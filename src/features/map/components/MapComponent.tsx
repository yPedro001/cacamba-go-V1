"use client"

import React, { useLayoutEffect, useState, useRef } from 'react'
import L from 'leaflet'
import { LeafletProvider, createLeafletContext } from '@react-leaflet/core'

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
import { MapInnerContent } from './MapInnerContent'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants'

/**
 * Ultra-Resilient Map Component for React 19 / Next.js 15.
 */
export function MapComponent({ controller }: { controller: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<any>(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || controller.mapRef.current) return;
    
    const node = containerRef.current;
    if ((node as any)._leaflet_id) delete (node as any)._leaflet_id;

    try {
      const map = L.map(node, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        scrollWheelZoom: true,
        fadeAnimation: false 
      });

      controller.mapRef.current = map;
      
      const ctx = createLeafletContext(map);
      setContext(ctx);

    } catch (err) {
      console.warn('[MapComponent] Mount issue:', err);
    }

    return () => {
      if (controller.mapRef.current) {
        console.log('[MapComponent] Unmounting instance...');
        controller.mapRef.current.remove();
        controller.mapRef.current = null;
        setContext(null);
      }
    };
  }, []); // Only run once on mount

  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[550px] lg:min-h-[650px] w-full z-0 overflow-hidden rounded-xl border border-border bg-slate-100">
      <div ref={containerRef} className="h-full w-full" />
      
      {context && (
        <LeafletProvider value={context}>
          <MapInnerContent controller={controller} />
        </LeafletProvider>
      )}
    </div>
  );
}
