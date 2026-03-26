// @ts-nocheck
"use client"

import React, { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, useMap } from 'react-leaflet'
import { MapInnerContent } from './MapInnerContent'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants'

/**
 * VERSION v2.2 - Force Build & Resilient Sync
 * Build Time: ${new Date().toISOString()}
 */
if (typeof window !== 'undefined') {
  // Fix for Leaflet default icon issues 
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function MapInstanceSync({ controller }: { controller: any }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      console.log('[MapComponent] v2.2 - INSTANCE SYNCED - ' + new Date().toLocaleTimeString());
      controller.mapRef.current = map;
      setTimeout(() => {
        map.invalidateSize();
        console.log('[MapComponent] v2.2 - invalidateSize() executed');
      }, 500);
    }
    return () => {
      console.log('[MapComponent] v2.2 - UNMOUNTING map instance');
      if (controller.mapRef) controller.mapRef.current = null;
    };
  }, [map, controller]);
  return null;
}

export const MapComponent = ({ controller }: { controller: any }) => {
  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[550px] lg:min-h-[650px] w-full z-0 overflow-hidden rounded-xl border border-border bg-slate-100 dark:bg-slate-900 shadow-inner">
      {/* 
         VERSION v2.3 - Emergency CSS Injection 
         Injecting directly to ensure it bypasses any build-time purge issues
      */}
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
        crossOrigin="" 
      />
      <style>{`
        .leaflet-container { background: #f1f5f9 !important; }
        .dark .leaflet-container { background: #0f172a !important; }
        .leaflet-tile-container { opacity: 1 !important; visibility: visible !important; }
        .leaflet-pane { z-index: 400 !important; }
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
        <MapInnerContent controller={controller} />
      </MapContainer>
    </div>
  )
}
