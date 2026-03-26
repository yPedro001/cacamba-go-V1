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
 * VERSION v2.4 - ULTIMATE RESILIENCE BUILD
 */
function MapResilienceHelper() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    
    console.log('[MapComponent] v2.4 - ACTIVATING RESILIENCE HELPER');
    
    // Multiple invalidation passes to survive Next.js / Tailwind layout shifts
    const passes = [100, 500, 1000, 2500, 5000];
    const timers = passes.map(ms => setTimeout(() => {
      map.invalidateSize();
      console.log(`[MapComponent] v2.4 - invalidateSize pass (${ms}ms)`);
      
      // Force visibility of internal Leaflet panes
      const panes = document.querySelectorAll('.leaflet-pane, .leaflet-tile-pane');
      panes.forEach(p => {
        p.style.opacity = '1';
        p.style.visibility = 'visible';
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
      console.log('[MapComponent] v2.4 - INSTANCE SYNCED - ' + new Date().toLocaleTimeString());
      controller.mapRef.current = map;
    }
    return () => {
      console.log('[MapComponent] v2.4 - UNMOUNTING map instance');
      if (controller.mapRef) controller.mapRef.current = null;
    };
  }, [map, controller]);
  return null;
}

export const MapComponent = ({ controller }: { controller: any }) => {
  return (
    <div id="map-root-container" className="relative h-[calc(100vh-180px)] min-h-[550px] lg:min-h-[650px] w-full z-0 overflow-hidden rounded-xl border border-border bg-slate-100 dark:bg-slate-900 shadow-inner">
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
        crossOrigin="" 
      />
      <style>{`
        .leaflet-container { 
          height: 100% !important; 
          width: 100% !important; 
          background: #f8fafc !important; 
          z-index: 10 !important;
        }
        .dark .leaflet-container { background: #020617 !important; }
        .leaflet-tile-container { opacity: 1 !important; visibility: visible !important; display: block !important; }
        .leaflet-pane { z-index: 40 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 100 !important; }
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
