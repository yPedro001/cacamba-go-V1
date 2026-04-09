import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

/**
 * MapRegister: Registra a instância do mapa Leaflet no ref do controller.
 * Executado uma única vez após o MapContainer montar.
 */
export function MapRegister({ mapRef }: { mapRef: React.MutableRefObject<any> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => { mapRef.current = null; };
  }, [map, mapRef]);
  return null;
}

/**
 * InvalidateOnVisible: Força o Leaflet a recalcular tamanho quando
 * a aba volta ao foco (resolve problema de mapa preto em aba inativa).
 */
export function InvalidateOnVisible() {
  const map = useMap();
  useEffect(() => {
    const handle = () => {
      if (!document.hidden) setTimeout(() => map.invalidateSize(), 200);
    };
    document.addEventListener('visibilitychange', handle);
    // Invalidação inicial com delays progressivos para garantir render completo
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    const t3 = setTimeout(() => map.invalidateSize(), 1500);
    return () => {
      document.removeEventListener('visibilitychange', handle);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);
  return null;
}

/**
 * ResizeObserverHelper: Observa mudanças de tamanho no container do mapa
 * e invalida o tamanho automaticamente. Resolve problema de mapa em layouts flexíveis.
 */
export function ResizeObserverHelper() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}
