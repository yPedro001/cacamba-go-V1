import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export function FlyToCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prev = useRef<string>('');
  
  useEffect(() => {
    const key = `${center[0].toFixed(4)},${center[1].toFixed(4)}`;
    if (key !== prev.current) {
      map.flyTo(center, zoom, { duration: 1.2 });
      prev.current = key;
    }
  }, [center, zoom, map]);
  
  return null;
}

export function MapRegister({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => { mapRef.current = null; };
  }, [map, mapRef]);
  return null;
}

export function InvalidateOnVisible() {
  const map = useMap();
  useEffect(() => {
    const handle = () => { if (!document.hidden) setTimeout(() => map.invalidateSize(), 200); };
    document.addEventListener('visibilitychange', handle);
    setTimeout(() => map.invalidateSize(), 300);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [map]);
  return null;
}
