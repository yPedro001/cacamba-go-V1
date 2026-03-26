import React from 'react';
import { TileLayer } from 'react-leaflet';
import { useMapController } from '../hooks/useMapController';
import { MapMarkersV2 as MapMarkers } from './MapMarkers';
import { MapControls } from './MapControls';
import { MapOverlays } from './MapOverlays';
import { MapFilterPanel } from './MapFilterPanel';
import { MapRegister, InvalidateOnVisible, FlyToCenter } from './MapHelpers';
import { useClientes } from '@/store/useAppStore';
import { getMapColor } from '@/core/domain/business-logic';

export function MapInnerContent({ controller }: { controller: any }) {
  const {
    mapRef, userPos, accuracy, geoError, route, filteredCacambas,
    filterColor, setFilterColor, filterCliente, setFilterCliente,
    filterVencimento, setFilterVencimento, showFilters, setShowFilters,
    historicoModal, setHistoricoModal, tick, locate, drawRoute,
    openGoogleMaps, getLocacaoForCacamba, getClienteName,
    handleMarcarRetirada, setRoute, today, locacoes, isRouting,
    clearFilters, advanceRentalStatus
  } = controller;

  const clientes = useClientes();

  return (
    <>
      <MapRegister mapRef={mapRef} />
      <InvalidateOnVisible />
      {userPos && <FlyToCenter center={userPos} zoom={16} />}

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      <MapControls 
        userPos={userPos}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        locate={locate}
        clearFilters={clearFilters}
        setRoute={setRoute}
        mapRef={mapRef}
        filteredCacambas={filteredCacambas}
      />

      {/* Leaflet Content */}
      <MapMarkers 
        userPos={userPos}
        accuracy={accuracy}
        route={route}
        filteredCacambas={filteredCacambas}
        locacoes={locacoes}
        tick={tick}
        today={today}
        getMapColor={getMapColor}
        getLocacaoForCacamba={getLocacaoForCacamba}
        getClienteName={getClienteName}
        drawRoute={drawRoute}
        openGoogleMaps={openGoogleMaps}
        handleMarcarRetirada={handleMarcarRetirada}
        advanceRentalStatus={advanceRentalStatus}
        setHistoricoModal={setHistoricoModal}
        isRouting={isRouting}
      />

      {/* Histórico Modal (Simplified, can be a child later) */}
      {historicoModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pointer-events-auto">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="text-lg font-bold">Histórico — {historicoModal.codigo}</h3>
              <button 
                onClick={() => setHistoricoModal(null)} 
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
              >✕</button>
            </div>
            <div className="p-4 max-h-[55vh] overflow-y-auto space-y-2">
              {[...(historicoModal.historico || [])].reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border text-xs">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between font-bold">
                      <span>{entry.status}</span>
                      <span>{new Date(entry.data).toLocaleString()}</span>
                    </div>
                    <p className="text-muted-foreground">{entry.usuario} · {entry.motivo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
