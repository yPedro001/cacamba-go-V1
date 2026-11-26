'use client';

import React, { useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer } from 'react-leaflet';
import { MapInnerContent } from './MapInnerContent';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import type { MapController } from '../hooks/useMapController';
import type { Cacamba, Locacao } from '@/core/domain/types';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export interface EnrichedMapCacamba extends Cacamba {
  _resolvedLat?: number;
  _resolvedLng?: number;
  _color: 'verde' | 'amarelo' | 'vermelho' | 'azul' | 'cinza';
}

interface MapComponentProps {
  controller: MapController;
  onSelectCacamba?: (cab: EnrichedMapCacamba) => void;
  onRequestAdvanceStatus?: (cab: EnrichedMapCacamba, loc: Locacao) => void;
}

export function MapComponent({
  controller,
  onSelectCacamba,
  onRequestAdvanceStatus,
}: MapComponentProps) {
  const [fallbackModalOpen, setFallbackModalOpen] = useState(false);

  return (
    <div className="w-full h-full relative z-10" data-ready={!fallbackModalOpen}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={true}
        attributionControl={true}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapInnerContent
          controller={controller}
          onSelectCacamba={onSelectCacamba}
          onRequestAdvanceStatus={onRequestAdvanceStatus}
          onNotify={() => setFallbackModalOpen(false)}
        />
      </MapContainer>
    </div>
  );
}
