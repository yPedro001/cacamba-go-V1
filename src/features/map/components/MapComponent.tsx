// @ts-nocheck
"use client"

import React, { useEffect, useState } from 'react'
import L from 'leaflet'
// IMPORTANTE: O mapa NÃO funciona sem isso. É isso que causou o mapa invisível/colapsado na tela.
import 'leaflet/dist/leaflet.css'
import { MapContainer } from 'react-leaflet'
import { MapInnerContent } from './MapInnerContent'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants'

// Fix dos ícones padrão do Leaflet (necessário em Next.js)
// Executado apenas no cliente — este arquivo NUNCA é importado no servidor
// (MapaView é carregado com ssr: false pela page.tsx)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  controller: any;
}

/**
 * MapComponent: Wrapper do MapContainer do Leaflet.
 * 
 * IMPORTANTE: Este componente é importado DIRETAMENTE pelo MapaView,
 * que por sua vez é carregado com { ssr: false } pela app/mapa/page.tsx.
 * Portanto, este componente NUNCA executa no servidor — é seguro usar Leaflet aqui.
 * 
 * NÃO há `mounted` state aqui — não é necessário porque já estamos no cliente.
 */
export function MapComponent({ controller }: MapComponentProps) {
  return (
    // Container com height explícita via style — não depende de CSS herdado
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }}>
      {/* O MapContainer agora tem o CSS garantido e preencherá esse div 100% */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={true}
        attributionControl={true}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '580px', borderRadius: '1.5rem' }}
      >
        <MapInnerContent controller={controller} />
      </MapContainer>
    </div>
  );
}
