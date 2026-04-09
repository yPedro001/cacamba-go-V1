import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCacambas, useLocacoes, useClientes, usePerfil } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { getMapColor } from '@/core/domain/business-logic';
import { Cacamba, MapColor } from '@/core/domain/types';

// IMPORTANTE: Leaflet é importado dinamicamente apenas em contexto de browser.
// Não importe 'L from leaflet' aqui diretamente - este hook é executado em SSR.
// O `mapRef.current` recebe a instância via MapInstanceSync dentro do MapContainer.

export type MapController = ReturnType<typeof useMapController>;

export function useMapController() {
  const cacambas = useCacambas();
  const locacoes = useLocacoes();
  const clientes = useClientes();
  const perfil = usePerfil();
  const { updateLocacao, advanceRentalStatus } = useDataActions();

  // Ref para a instância do mapa Leaflet (populada pelo MapInstanceSync)
  // Tipado como `any` para evitar a necessidade de importar `L` diretamente neste hook
  const mapRef = useRef<any>(null);

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [hasFlownToUser, setHasFlownToUser] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [geoError, setGeoError] = useState('');
  const [route, setRoute] = useState<{ coords: [number, number][]; distance: string; time: string } | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [tick, setTick] = useState(0);

  const [filterColor, setFilterColorState] = useState<MapColor | 'todos'>('todos');
  const [filterCliente, setFilterClienteState] = useState<string>('todos');
  const [filterVencimento, setFilterVencimentoState] = useState<'todos' | '7' | '15' | '30'>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [historicoModal, setHistoricoModal] = useState<Cacamba | null>(null);
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

  // Coordenadas da empresa como fallback
  const empresaLat = perfil.lat ?? -23.5505;
  const empresaLng = perfil.lng ?? -46.6333;

  // Mapeamento de locações O(1) — exclui apenas as totalmente concluídas/pagas
  const locacaoMap = useMemo(() => {
    const map: Record<string, any> = {};
    locacoes.forEach(l => {
      if (l.status === 'pago' || l.status === 'cancelada' || l.status === 'concluida') return;
      if (l.cacambaId) map[l.cacambaId] = l;
      if (l.cacambaIds) {
        l.cacambaIds.forEach((id: string) => { map[id] = l; });
      }
    });
    return map;
  }, [locacoes]);

  const getLocacaoForCacamba = useCallback((cacambaId: string) => locacaoMap[cacambaId], [locacaoMap]);

  const getClienteName = useCallback((clienteId: string) =>
    clientes.find(c => c.id === clienteId)?.nome ?? '—',
  [clientes]);

  /**
   * Resolução de coordenadas de uma caçamba:
   * - Se disponível → usa lat/lng da empresa do perfil
   * - Se vinculada a locação → usa lat/lng da locação (endereço da obra)
   * - Fallback final: coordenadas da empresa
   */
  const resolveCacambaCoords = useCallback((c: Cacamba): [number, number] | null => {
    if (c.status === 'disponivel') {
      return [empresaLat, empresaLng];
    }
    const loc = locacaoMap[c.id];
    if (loc?.lat != null && loc?.lng != null) {
      return [loc.lat, loc.lng];
    }
    if (c.lat != null && c.lng != null) {
      return [c.lat, c.lng];
    }
    // Caçambas não-disponíveis sem coordenadas: usa empresa como fallback
    return [empresaLat, empresaLng];
  }, [locacaoMap, empresaLat, empresaLng]);

  // Lista filtrada — inclui TODAS as caçambas (disponíveis vão para o pátio)
  const filteredCacambas = useMemo(() => {
    return cacambas
      .map(c => {
        const coords = resolveCacambaCoords(c);
        const color = getMapColor(c, locacoes, today, locacaoMap[c.id]);
        return { ...c, _resolvedLat: coords?.[0], _resolvedLng: coords?.[1], _color: color };
      })
      .filter(c => {
        if (filterColor !== 'todos' && c._color !== filterColor) return false;
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
  }, [cacambas, locacoes, today, filterColor, filterCliente, filterVencimento, locacaoMap, resolveCacambaCoords]);

  // Localização do usuário — executada apenas no mount
  const initializeUserLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      // Sem suporte a geolocalização: centraliza na empresa
      const fallback: [number, number] = [empresaLat, empresaLng];
      setUserPos(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords: [number, number] = [p.coords.latitude, p.coords.longitude];
        setUserPos(coords);
        setAccuracy(p.coords.accuracy);
        setGeoError('');
      },
      () => {
        // Permissão negada: fallback para localização da empresa
        setGeoError('Localização negada. Mostrando pátio da empresa.');
        const fallback: [number, number] = [empresaLat, empresaLng];
        setUserPos(fallback);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [empresaLat, empresaLng]);

  // Inicializa geolocalização uma única vez no mount
  useEffect(() => {
    initializeUserLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Voa para a posição do usuário apenas na primeira vez que ela é definida
  useEffect(() => {
    if (userPos && mapRef.current && !hasFlownToUser) {
      mapRef.current.flyTo(userPos, 15, { duration: 1.2 });
      setHasFlownToUser(true);
    }
  }, [userPos, hasFlownToUser]);

  // Ação de Localização manual (botão)
  const locate = useCallback(() => {
    const isFilterActive = filterColor !== 'todos' || filterCliente !== 'todos' || filterVencimento !== 'todos';

    if (isFilterActive && filteredCacambas.length > 0) {
      const idx = navigationIndex % filteredCacambas.length;
      const target = filteredCacambas[idx];
      if (target?._resolvedLat != null && target?._resolvedLng != null && mapRef.current) {
        mapRef.current.flyTo([target._resolvedLat, target._resolvedLng], 17, { duration: 1.2 });
        setNavigationIndex(prev => prev + 1);
      }
      return;
    }

    // Sem filtro → localizar usuário
    if (userPos && mapRef.current) {
      mapRef.current.flyTo(userPos, 16, { duration: 1 });
    } else {
      initializeUserLocation();
    }
  }, [filteredCacambas, navigationIndex, filterColor, filterCliente, filterVencimento, userPos, initializeUserLocation]);

  const handleFilterChange = useCallback((type: 'color' | 'cliente' | 'vencimento', value: any) => {
    if (type === 'color') setFilterColorState(value);
    if (type === 'cliente') setFilterClienteState(value);
    if (type === 'vencimento') setFilterVencimentoState(value);
    setNavigationIndex(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterColorState('todos');
    setFilterClienteState('todos');
    setFilterVencimentoState('todos');
    setNavigationIndex(0);
    setRoute(null);
  }, []);

  const drawRoute = useCallback(async (lat: number, lng: number) => {
    if (!userPos || isRouting) return;
    setIsRouting(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${lng},${lat}?overview=simplified&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes?.[0]) {
        const r = data.routes[0];
        setRoute({
          coords: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
          distance: (r.distance / 1000).toFixed(1),
          time: String(Math.round(r.duration / 60)),
        });
        // Centraliza o mapa na caçamba quando gera rota
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }
      }
    } catch {
      // Não quebra o mapa por falha de rota; simplesmente fecha loading
    } finally {
      setIsRouting(false);
    }
  }, [userPos, isRouting]);

  const openGoogleMaps = useCallback((lat: number, lng: number) => {
    const origin = userPos ? `${userPos[0]},${userPos[1]}` : '';
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  }, [userPos]);

  return useMemo(() => ({
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
    perfil,
    locate,
    drawRoute,
    openGoogleMaps,
    getLocacaoForCacamba,
    getClienteName,
    resolveCacambaCoords,
    setRoute,
    clearFilters,
    advanceRentalStatus,
    setFilterColor: (v: MapColor | 'todos') => handleFilterChange('color', v),
    setFilterCliente: (v: string) => handleFilterChange('cliente', v),
    setFilterVencimento: (v: any) => handleFilterChange('vencimento', v),
  }), [
    userPos, accuracy, geoError, route, isRouting, filteredCacambas,
    filterColor, filterCliente, filterVencimento, showFilters,
    historicoModal, tick, today, locacoes, perfil, locate, drawRoute,
    openGoogleMaps, getLocacaoForCacamba, getClienteName, resolveCacambaCoords,
    clearFilters, advanceRentalStatus, handleFilterChange,
  ]);
}
