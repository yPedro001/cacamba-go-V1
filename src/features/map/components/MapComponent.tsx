"use client"

import React, { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, useMap } from 'react-leaflet'
import { MapInnerContent } from './MapInnerContent'
import { MapController } from '../hooks/useMapController'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants'

/**
 * VERSION v2.1 - Production Fix
 * Fix for Leaflet default icon issues in Next.js/Webpack
 */
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

/**
 * Resiliently synces the Leaflet map instance with our state controller
 */
function MapInstanceSync({ controller }: { controller: MapController }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      console.log('[MapComponent] Map instance synced successfully (v2.1)');
      controller.mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 500);
    }
    return () => {
      console.log('[MapComponent] Map instance unmounting...');
      controller.mapRef.current = null;
    };
  }, [map, controller]);
  return null;
}

export const MapComponent = ({ controller }: { controller: MapController }) => {
  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[550px] lg:min-h-[650px] w-full z-0 overflow-hidden rounded-xl border border-border bg-slate-100 dark:bg-slate-900 shadow-inner">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={true}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
      >
        <MapInstanceSync controller={controller} />
        <MapInnerContent controller={controller} />
      </MapContainer>
    </div>
  )
}
