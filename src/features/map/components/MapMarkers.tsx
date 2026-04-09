// @ts-nocheck
import React from 'react';
import { Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { createCacambaIcon, USER_ICON, MAP_COLORS } from '../constants';
import { MapColor, Cacamba } from '@/core/domain/types';
import { Navigation, MapPin, Calendar, CreditCard, CheckCircle, Truck } from 'lucide-react';

interface MapMarkersProps {
  userPos: [number, number] | null;
  accuracy: number;
  route: { coords: [number, number][]; distance: string; time: string } | null;
  filteredCacambas: any[]; // enriched with _resolvedLat, _resolvedLng, _color
  locacoes: any[];
  tick: number;
  today: Date;
  getLocacaoForCacamba: (id: string) => any;
  getClienteName: (id: string) => string;
  drawRoute: (lat: number, lng: number) => void;
  openGoogleMaps: (lat: number, lng: number) => void;
  advanceRentalStatus: (id: string) => void;
  setHistoricoModal: (c: Cacamba) => void;
  isRouting?: boolean;
}

const formatCurrency = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—';

const formatDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
};

export const MapMarkersV2 = React.memo(({
  userPos, accuracy, route, filteredCacambas,
  locacoes, tick, today,
  getLocacaoForCacamba, getClienteName,
  drawRoute, openGoogleMaps,
  advanceRentalStatus, setHistoricoModal, isRouting
}: MapMarkersProps) => {

  return (
    <>
      {/* Marcador do usuário */}
      {userPos && (
        <>
          <Marker position={userPos} icon={USER_ICON}>
            <Popup>
              <b>Você está aqui!</b>
              <br />
              Precisão: ~{Math.round(accuracy)}m
            </Popup>
          </Marker>
          <Circle
            center={userPos}
            radius={Math.min(accuracy || 100, 500)}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.10, weight: 1 }}
          />
        </>
      )}

      {/* Polyline de rota */}
      {route && (
        <Polyline
          positions={route.coords}
          pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85, dashArray: '12,8' }}
        />
      )}

      {/* Marcadores das caçambas */}
      {filteredCacambas
        .filter(cab => cab._resolvedLat != null && cab._resolvedLng != null)
        .map((cab) => {
          const loc = getLocacaoForCacamba(cab.id);
          const color: MapColor = cab._color;
          const blink = color === 'vermelho';
          const lat = cab._resolvedLat!;
          const lng = cab._resolvedLng!;

          // Label do botão de ação principal
          const actionLabel =
            loc?.status === 'entrega_pendente' ? 'Confirmar Entrega' :
            loc?.status === 'em_uso' ? 'Marcar p/ Retirada' :
            loc?.status === 'vencida' ? 'Confirmar Retirada' : null;

          const actionColor =
            loc?.status === 'entrega_pendente' ? 'bg-blue-600 hover:bg-blue-700 border-blue-800 shadow-blue-200' :
            loc?.status === 'em_uso' ? 'bg-amber-500 hover:bg-amber-600 border-amber-700 shadow-amber-200' :
            'bg-red-600 hover:bg-red-700 border-red-800 shadow-red-200';

          return (
            <Marker
              key={`${cab.id}-${tick}`}
              position={[lat, lng]}
              icon={createCacambaIcon(cab.codigo, color, blink)}
            >
              <Popup className="cacamba-popup" minWidth={340} maxWidth={400}>
                <div className="cacamba-popup-inner overflow-hidden rounded-xl shadow-2xl border border-slate-200">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Caçamba
                      </span>
                      <strong className="text-xl font-black text-slate-900 leading-none">
                        {cab.codigo}
                      </strong>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                      style={{ background: MAP_COLORS[color].bg }}
                    >
                      {MAP_COLORS[color].label}
                    </div>
                  </div>

                  {/* Corpo */}
                  <div className="px-5 py-4 bg-white space-y-4">
                    {loc ? (
                      <>
                        {/* Cliente e endereço */}
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                            <MapPin className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                              Local da Operação
                            </p>
                            <p className="font-black text-slate-900 text-sm leading-tight truncate">
                              {getClienteName(loc.clienteId)}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic truncate">
                              {loc.enderecoObra || 'Endereço não informado'}
                            </p>
                          </div>
                        </div>

                        {/* Valor */}
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
                            <CreditCard className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                              Valor
                            </p>
                            <p className="font-black text-slate-900 text-sm">
                              {formatCurrency(loc.valor)}
                            </p>
                          </div>
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Entrega
                            </p>
                            <span className="block font-black text-slate-700 text-xs">
                              {formatDate(cab.dataEntrega)}
                            </span>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                              Vencimento
                              <span className={`w-1.5 h-1.5 rounded-full ${color === 'vermelho' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                            </p>
                            <span className="block font-black text-slate-700 text-xs">
                              {formatDate(loc.dataDevolucaoPrevista)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                          <MapPin className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">Pronta para Uso</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Esta caçamba está disponível no pátio principal.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5">
                    {/* Botões de rota */}
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ring-1 ring-inset ${
                          isRouting
                            ? 'bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed'
                            : 'bg-white hover:bg-blue-50 text-blue-600 ring-blue-100 border-b-2 border-blue-200 hover:border-blue-300'
                        }`}
                        onClick={() => !isRouting && drawRoute(lat, lng)}
                        disabled={!!isRouting}
                      >
                        <Navigation className={`w-3.5 h-3.5 ${isRouting ? 'animate-pulse' : ''}`} />
                        {isRouting ? 'Calculando...' : 'Gerar Rota'}
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[11px] font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200 border-b-2 border-slate-300 shadow-sm transition-all"
                        onClick={() => openGoogleMaps(lat, lng)}
                      >
                        <img
                          src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32"
                          className="w-3.5 h-3.5 rounded-sm"
                          alt="Google Maps"
                        />
                        Google Maps
                      </button>
                    </div>

                    {/* Botão de ação de status */}
                    {loc && actionLabel && (
                      <button
                        className={`w-full h-11 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 border-b-4 ${actionColor}`}
                        onClick={() => advanceRentalStatus(loc.id)}
                      >
                        {loc.status === 'entrega_pendente'
                          ? <Truck className="w-3.5 h-3.5" />
                          : <CheckCircle className="w-3.5 h-3.5" />
                        }
                        {actionLabel}
                      </button>
                    )}

                    {/* Ver Histórico */}
                    {(cab.historico?.length ?? 0) > 0 && (
                      <button
                        className="w-full py-2 text-[9px] text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border border-dashed border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50"
                        onClick={() => setHistoricoModal(cab)}
                      >
                        Ver Histórico ({cab.historico!.length})
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
});

MapMarkersV2.displayName = 'MapMarkersV2';
