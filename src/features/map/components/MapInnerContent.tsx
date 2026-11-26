'use client';

import React from 'react';
import { TileLayer } from 'react-leaflet';
import { MapMarkersV2 } from './MapMarkers';
import { MapControls } from './MapControls';
import { MapOverlays } from './MapOverlays';
import { MapRegister, InvalidateOnVisible, ResizeObserverHelper } from './MapHelpers';
import { HistoricoModal } from '@/features/inventory/components/HistoricoModal';
import type { MapController } from '../hooks/useMapController';
import type { EnrichedMapCacamba } from './MapComponent';
import type { Locacao } from '@/core/domain/types';

interface MapInnerContentProps {
  controller: MapController;
  onSelectCacamba?: (cab: EnrichedMapCacamba) => void;
  onRequestAdvanceStatus?: (cab: EnrichedMapCacamba, loc: Locacao) => void;
  onNotify?: () => void;
}

/**
 * Renderizado dentro do MapContainer com controller compartilhado.
 */
export function MapInnerContent({
  controller,
  onSelectCacamba,
  onRequestAdvanceStatus,
}: MapInnerContentProps) {
  const {
    mapRef,
    userPos,
    accuracy,
    geoError,
    route,
    filteredCacambas,
    filterColor,
    filterCliente,
    filterVencimento,
    setShowFilters,
    showFilters,
    historicoModal,
    setHistoricoModal,
    locate,
    drawRoute,
    openGoogleMaps,
    getLocacaoForCacamba,
    getClienteName,
    setRoute,
    isRouting,
    advanceRentalStatus,
  } = controller;

  const hasActiveFilters =
    filterColor !== 'todos' || filterCliente !== 'todos' || filterVencimento !== 'todos';

  return (
    <>
      <MapRegister mapRef={mapRef} />
      <InvalidateOnVisible />
      <ResizeObserverHelper />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        keepBuffer={4}
      />

      <MapOverlays geoError={geoError} />

      <MapControls
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        locate={locate}
        setRoute={() => setRoute(null)}
        hasActiveRoute={!!route}
        hasActiveFilters={hasActiveFilters}
        mapRef={mapRef}
      />

      <MapMarkersV2
        userPos={userPos}
        accuracy={accuracy}
        route={route}
        filteredCacambas={filteredCacambas as EnrichedMapCacamba[]}
        getLocacaoForCacamba={getLocacaoForCacamba}
        getClienteName={getClienteName}
        drawRoute={drawRoute}
        openGoogleMaps={openGoogleMaps}
        onSelectCacamba={onSelectCacamba}
        onRequestAdvanceStatus={onRequestAdvanceStatus}
        advanceRentalStatus={advanceRentalStatus}
        setHistoricoModal={setHistoricoModal}
        isRouting={isRouting}
      />

      <HistoricoModal
        isOpen={!!historicoModal}
        onClose={() => setHistoricoModal(null)}
        selectedCacamba={historicoModal}
      />
    </>
  );
}
