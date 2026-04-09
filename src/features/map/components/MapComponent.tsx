// @ts-nocheck
"use client"

import React, { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, useMap } from 'react-leaflet'
import { MapInnerContent } from './MapInnerContent'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants'

if (typeof window !== 'undefined') {
  // Fix for Leaflet default icon issues 
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function MapResilienceHelper() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    
    // Observer para capturar mudanças de tamanho no DOM
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    const container = map.getContainer();
    observer.observe(container);

    // Invalidação inicial forçada com atrasos progressivos
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 500),
      setTimeout(() => map.invalidateSize(), 1500),
    ];

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [map]);
  return null;
}

function MapInstanceSync({ controller }: { controller: any }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      controller.mapRef.current = map;
    }
    return () => {
      // Proper cleanup of ref when unmounting
      controller.mapRef.current = null;
    };
  }, [map, controller]);
  return null;
}

export const MapComponent = ({ controller }: { controller: any }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const mapId = "operacoes-map-container";

  if (!mounted) return (
    <div className="min-h-[400px] h-[600px] w-full bg-slate-900 animate-pulse rounded-[32px] flex items-center justify-center border border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-white/5 rounded-full" />
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Sincronizando <span className="text-accent">Satélites</span></p>
          <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-accent/50 animate-shimmer" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[500px] h-[600px] lg:h-[750px] w-full z-[1] overflow-hidden rounded-[32px] border border-border bg-white dark:bg-slate-900 shadow-2xl transition-colors duration-500">
      <MapContainer
        id={mapId}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={true}
        style={{ height: '100%', width: '100%', background: 'transparent' }}
        scrollWheelZoom={true}
        preferCanvas={true}
        key={mounted ? 'map-enabled' : 'map-disabled'} 
      >
        <MapResilienceHelper />
        <MapInstanceSync controller={controller} />
        <MapInnerContent controller={controller} />
      </MapContainer>
    </div>
  )
}
