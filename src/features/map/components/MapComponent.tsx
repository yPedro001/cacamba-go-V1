"use client"

import React from 'react'
import L from 'leaflet'
import { MapContainer } from 'react-leaflet'
import { MapInnerContent } from './MapInnerContent'
import { MapController } from '../hooks/useMapController'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants'

/**
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

export const MapComponent = ({ controller }: { controller: MapController }) => {
  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[550px] lg:min-h-[650px] w-full z-0 overflow-hidden rounded-xl border border-border bg-slate-100 dark:bg-slate-900">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={true}
        style={{ height: '100%', width: '100%' }}
        ref={(map) => {
          if (map) {
            controller.mapRef.current = map;
          }
        }}
      >
        <MapInnerContent controller={controller} />
      </MapContainer>
    </div>
  )
}
