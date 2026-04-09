// @ts-nocheck
import React from 'react';
import { TileLayer } from 'react-leaflet';
import { MapMarkersV2 } from './MapMarkers';
import { MapControls } from './MapControls';
import { MapOverlays } from './MapOverlays';
import { MapRegister, InvalidateOnVisible, ResizeObserverHelper } from './MapHelpers';
import { ModalBase } from '@/components/ui/modal-base';
import { Button } from '@/components/ui/button';

/**
 * MapInnerContent: Renderizado DENTRO do MapContainer.
 * Recebe o controller por prop — NÃO instancia seu próprio useMapController.
 */
export function MapInnerContent({ controller }: { controller: any }) {
  const {
    mapRef, userPos, accuracy, geoError, route, filteredCacambas,
    filterColor, setFilterColor, setShowFilters, showFilters,
    historicoModal, setHistoricoModal, tick, today,
    locate, drawRoute, openGoogleMaps,
    getLocacaoForCacamba, getClienteName,
    setRoute, locacoes, isRouting,
    clearFilters, advanceRentalStatus,
  } = controller;

  return (
    <>
      {/* Helpers estruturais do mapa */}
      <MapRegister mapRef={mapRef} />
      <InvalidateOnVisible />
      <ResizeObserverHelper />

      {/* Tiles (OpenStreetMap) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        keepBuffer={4}
      />

      {/* Overlays flutuantes sobre o mapa (legenda, erros, rota) */}
      <MapOverlays
        filterColor={filterColor}
        setFilterColor={setFilterColor}
        route={route}
        geoError={geoError}
      />

      {/* Botões de controle no canto superior direito */}
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

      {/* Marcadores e rotas */}
      <MapMarkersV2
        userPos={userPos}
        accuracy={accuracy}
        route={route}
        filteredCacambas={filteredCacambas}
        locacoes={locacoes}
        tick={tick}
        today={today}
        getLocacaoForCacamba={getLocacaoForCacamba}
        getClienteName={getClienteName}
        drawRoute={drawRoute}
        openGoogleMaps={openGoogleMaps}
        advanceRentalStatus={advanceRentalStatus}
        setHistoricoModal={setHistoricoModal}
        isRouting={isRouting}
      />

      {/* Modal de Histórico da Caçamba */}
      <ModalBase
        isOpen={!!historicoModal}
        onClose={() => setHistoricoModal(null)}
        maxWidth="lg"
        title={
          historicoModal ? (
            <>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                Histórico de Operações
              </span>
              <span className="text-accent">{historicoModal.codigo}</span>
            </>
          ) : null
        }
        footer={
          <Button
            onClick={() => setHistoricoModal(null)}
            className="h-11 px-8 font-black uppercase tracking-widest text-[11px] bg-accent hover:bg-accent-dark text-white rounded-2xl"
          >
            Fechar
          </Button>
        }
      >
        {historicoModal && (
          <div className="space-y-4">
            {(!historicoModal.historico || historicoModal.historico.length === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-sm font-bold">Sem histórico registrado</p>
                <p className="text-xs text-slate-500 mt-1">
                  Não há registros de movimentação para esta caçamba.
                </p>
              </div>
            ) : (
              [...(historicoModal.historico || [])].reverse().map((entry: any, i: number) => (
                <div key={i} className="relative pl-6 pb-4 border-l-2 border-white/10 last:border-0 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-4 border-accent shadow-sm" />
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-accent/20 transition-colors">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent">
                        {entry.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {new Date(entry.data).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mb-1 leading-snug">
                      {entry.motivo || 'Nenhum comentário adicional'}
                    </p>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 mt-2">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-300">
                        {((entry.usuario || '?').charAt(0)).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        Responsável: {entry.usuario}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ModalBase>
    </>
  );
}
