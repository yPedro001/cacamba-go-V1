// @ts-nocheck
"use client"

import React, { useEffect } from 'react'
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

/**
 * VERSION v2.5 - THERMAL STABILITY BUILD
 */
function MapResilienceHelper() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    
    console.log('[MapComponent] v2.5 - INITIALIZING RESILIENCE');
    
    const passes = [50, 250, 750, 2000, 4000];
    const timers = passes.map(ms => setTimeout(() => {
      // Force Leaflet recalculation
      map.invalidateSize();
      
      // Force Global browser recalculation
      window.dispatchEvent(new Event('resize'));
      
      console.log(`[MapComponent] v2.5 - Stability Pass (${ms}ms)`);
      
      // Force CSS visibility across all possible Leaflet elements
      const elements = document.querySelectorAll('.leaflet-pane, .leaflet-tile-pane, .leaflet-layer, .leaflet-marker-icon');
      elements.forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
      });
    }, ms));

    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

function MapInstanceSync({ controller }: { controller: any }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      console.log('[MapComponent] v2.5 - INSTANCE SYNCED - READY');
      controller.mapRef.current = map;
    }
  }, [map, controller]);
  return null;
}

export const MapComponent = ({ controller }: { controller: any }) => {
  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[550px] lg:min-h-[650px] w-full z-0 overflow-hidden rounded-xl border border-border bg-slate-100 dark:bg-slate-900 shadow-2xl">
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
      />
      <style>{`
        .leaflet-container { 
          height: 100% !important; 
          min-height: 550px !important;
          width: 100% !important; 
          background: #f8fafc !important; 
          z-index: 1 !important;
        }
        .dark .leaflet-container { background: #020617 !important; }
        .leaflet-tile-pane { z-index: 10 !important; opacity: 1 !important; }
        .leaflet-marker-pane { z-index: 600 !important; }
        .leaflet-popup-pane { z-index: 700 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 1000 !important; }
      `}</style>
      
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={true}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapInstanceSync controller={controller} />
        <MapResilienceHelper />
        <MapInnerContent controller={controller} />
      </MapContainer>
    </div>
  )
}
