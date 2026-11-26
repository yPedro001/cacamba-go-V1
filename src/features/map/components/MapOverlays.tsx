'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface MapOverlaysProps {
  geoError: string;
}

/**
 * Overlays mínimos no mapa para não obstruir controles de zoom (+/-) no topo esquerdo.
 * Exibe apenas aviso discreto quando a geolocalização do navegador falha.
 */
export function MapOverlays({ geoError }: MapOverlaysProps) {
  if (!geoError) return null;

  return (
    <div
      role="status"
      className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[800] pointer-events-auto"
    >
      <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-card/95 border border-warning/40 text-foreground shadow-lg text-xs rounded-lg font-medium">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <span>{geoError}</span>
      </div>
    </div>
  );
}
