import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useCacambas, useLocacoes, useClientes } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { getMapColor } from '@/core/domain/business-logic';
import { Cacamba, MapColor } from '@/core/domain/types';

export type MapController = ReturnType<typeof useMapController>;

export function useMapController() {
  const cacambas = useCacambas();
  const locacoes = useLocacoes();
  const clientes = useClientes();
  const { updateLocacao, advanceRentalStatus } = useDataActions();
  
  const mapRef = useRef<L.Map | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  const [geoError, setGeoError] = useState('');
  const [route, setRoute] = useState<{ coords: [number, number][]; distance: string; time: string } | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [tick, setTick] = useState(0); 

  const [filterColor, setFilterColor] = useState<MapColor | 'todos'>('todos');
  const [filterCliente, setFilterCliente] = useState<string>('todos');
  const [filterVencimento, setFilterVencimento] = useState<'todos' | '7' | '15' | '30'>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [historicoModal, setHistoricoModal] = useState<Cacamba | null>(null);
  
  // Controle de navegação cíclica (Index)
  const [navigationIndex, setNavigationIndex] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [tick]);

  // Atualização periódica de tempo (5 min)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Mapeamento de locações O(1)
  const locacaoMap = useMemo(() => {
    const map: Record<string, any> = {};
    locacoes.forEach(l => {
      if (l.status === 'pago') return;
      if (l.cacambaId) map[l.cacambaId] = l;
      if (l.cacambaIds) {
        l.cacambaIds.forEach((id: string) => {
          map[id] = l;
        });
      }
    });
    return map;
  }, [locacoes]);

  const getLocacaoForCacamba = useCallback((cacambaId: string) => locacaoMap[cacambaId], [locacaoMap]);

  const getClienteName = useCallback((clienteId: string) =>
    clientes.find(c => c.id === clienteId)?.nome ?? '—',
  [clientes]);

  // Lista filtrada (Otimizada)
  const filteredCacambas = useMemo(() => {
    return cacambas.filter(c => {
      if (c.lat == null || c.lng == null) return false;
      const color = getMapColor(c, locacoes, today, locacaoMap[c.id]);
      if (filterColor !== 'todos' && color !== filterColor) return false;
      if (filterCliente !== 'todos') {
        const loc = locacaoMap[c.id];
        if (!loc || loc.clienteId !== filterCliente) return false;
      }
      if (filterVencimento !== 'todos') {
        const loc = locacaoMap[c.id];
        if (!loc?.dataDevolucaoPrevista) return false;
        const devDate = new Date(loc.dataDevolucaoPrevista + 'T00:00:00');
        const diffDays = Math.ceil((devDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > parseInt(filterVencimento)) return false;
      }
      return true;
    });
  }, [cacambas, locacoes, today, filterColor, filterCliente, filterVencimento, locacaoMap]);

  // Ação de Localização (DISPARO MANUAL)
  const locate = useCallback((customFilteredList?: Cacamba[]) => {
    const list = customFilteredList || filteredCacambas;
    const isFilterActive = filterColor !== 'todos' || filterCliente !== 'todos' || filterVencimento !== 'todos';

    // SE houver filtro ativo -> Navegação Cíclica nas Caçambas
    if (isFilterActive && list.length > 0) {
      const idx = navigationIndex % list.length;
      const target = list[idx];
      if (target?.lat != null && target?.lng != null && mapRef.current) {
        mapRef.current.flyTo([target.lat, target.lng], 18, { duration: 1.2 });
        setNavigationIndex(prev => prev + 1);
      }
      return;
    }

    // SE NÃO houver filtro -> Localizar Usuário
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const coords: [number, number] = [p.coords.latitude, p.coords.longitude];
          setUserPos(coords);
          setAccuracy(p.coords.accuracy);
          setGeoError('');
          if (mapRef.current) {
            mapRef.current.flyTo(coords, 16, { duration: 1 });
          }
        },
        () => setGeoError('Não foi possível obter sua localização.'),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    }
  }, [filteredCacambas, navigationIndex, filterColor, filterCliente, filterVencimento]);

  // Função disparada no início de um novo filtro
  const handleFilterChange = (type: 'color' | 'cliente' | 'vencimento', value: any) => {
    let nextColor = filterColor;
    let nextCliente = filterCliente;
    let nextVenc = filterVencimento;

    if (type === 'color') { setFilterColor(value); nextColor = value; }
    if (type === 'cliente') { setFilterCliente(value); nextCliente = value; }
    if (type === 'vencimento') { setFilterVencimento(value); nextVenc = value; }

    setNavigationIndex(0);

    // Pequeno delay para garantir que a lista filtrada seja recalculada antes de focar
    setTimeout(() => {
      // Calculamos a lista localmente para o foco inicial imediato
      const newList = cacambas.filter(c => {
        if (c.lat == null || c.lng == null) return false;
        const color = getMapColor(c, locacoes, today, locacaoMap[c.id]);
        if (nextColor !== 'todos' && color !== nextColor) return false;
        if (nextCliente !== 'todos') {
          const l = locacaoMap[c.id];
          if (!l || l.clienteId !== nextCliente) return false;
        }
        if (nextVenc !== 'todos') {
          const l = locacaoMap[c.id];
          if (!l?.dataDevolucaoPrevista) return false;
          const devD = new Date(l.dataDevolucaoPrevista + 'T00:00:00');
          const diff = Math.ceil((devD.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (diff > parseInt(nextVenc)) return false;
        }
        return true;
      });

      if (newList.length > 0 && mapRef.current) {
        const target = newList[0];
        mapRef.current.flyTo([target.lat!, target.lng!], 17, { duration: 1.5 });
        setNavigationIndex(1); // Já foca na 1ª, próximo clique vai para a 2ª
      }
    }, 50);
  };

  const clearFilters = useCallback(() => {
    setFilterColor('todos');
    setFilterCliente('todos');
    setFilterVencimento('todos');
    setNavigationIndex(0);
    setRoute(null);
  }, []);

  const handleMarcarRetirada = useCallback((c: Cacamba) => {
    const loc = getLocacaoForCacamba(c.id);
    if (loc?.id) updateLocacao(loc.id, { status: 'vencida' });
    setRoute(null);
  }, [getLocacaoForCacamba, updateLocacao]);

  const drawRoute = useCallback(async (lat: number, lng: number) => {
    if (!userPos || isRouting) return;
    setIsRouting(true);
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${lng},${lat}?overview=simplified&geometries=geojson`);
      const data = await res.json();
      if (data.routes?.[0]) {
        const r = data.routes[0];
        setRoute({ 
          coords: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]), 
          distance: (r.distance / 1000).toFixed(1), 
          time: String(Math.round(r.duration / 60)) 
        });
      }
    } catch { 
      alert('Erro ao calcular rota.'); 
    } finally { 
      setIsRouting(false); 
    }
  }, [userPos, isRouting]);

  const openGoogleMaps = (lat: number, lng: number) => {
    const origin = userPos ? `${userPos[0]},${userPos[1]}` : '';
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Localização inicial (uma única vez no mount)
  useEffect(() => {
    locate();
  }, []); // Efeito de montagem puro

  return {
    mapRef,
    userPos,
    accuracy,
    geoError,
    route,
    isRouting,
    filteredCacambas,
    filterColor,
    filterCliente,
    filterVencimento,
    showFilters,
    setShowFilters,
    historicoModal,
    setHistoricoModal,
    tick,
    today,
    locacoes,
    locate,
    drawRoute,
    openGoogleMaps,
    getLocacaoForCacamba,
    getClienteName,
    handleMarcarRetirada,
    setRoute,
    clearFilters,
    advanceRentalStatus,
    setFilterColor: (v: MapColor | 'todos') => handleFilterChange('color', v),
    setFilterCliente: (v: string) => handleFilterChange('cliente', v),
    setFilterVencimento: (v: any) => handleFilterChange('vencimento', v)
  };
}
