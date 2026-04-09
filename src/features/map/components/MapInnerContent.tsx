// @ts-nocheck
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
import { ModalBase } from '@/components/ui/modal-base';
import { Button } from '@/components/ui/button';

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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

      {/* Modal de Histórico da Caçamba — padronizado com ModalBase */}
      <ModalBase
        isOpen={!!historicoModal}
        onClose={() => setHistoricoModal(null)}
        maxWidth="lg"
        title={
          historicoModal ? (
            <>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Histórico de Operações</span>
              <span className="text-accent">{historicoModal.codigo}</span>
            </>
          ) : null
        }
        footer={
          <Button
            onClick={() => setHistoricoModal(null)}
            className="h-11 px-8 font-black uppercase tracking-widest text-[11px] bg-accent hover:bg-accent-dark text-white rounded-2xl"
          >
            Fechar Visualização
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
                <p className="text-xs text-slate-500 mt-1">Não há registros de movimentação para esta caçamba.</p>
              </div>
            ) : (
              [...(historicoModal.historico || [])].reverse().map((entry, i) => (
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
                    <p className="text-sm font-semibold mb-1 leading-snug">{entry.motivo || 'Nenhum comentário adicional'}</p>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 mt-2">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-300">
                        {entry.usuario?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Responsável: {entry.usuario}</span>
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
