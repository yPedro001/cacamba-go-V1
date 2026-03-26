// @ts-nocheck
import React from 'react';
import { Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { createCacambaIcon, USER_ICON, MAP_COLORS } from '../constants';
import { MapColor, Cacamba } from '@/core/domain/types';
import { Navigation, MapPin } from 'lucide-react';

interface MapMarkersProps {
  userPos: [number, number] | null;
  accuracy: number;
  route: { coords: [number, number][]; distance: string; time: string } | null;
  filteredCacambas: any[];
  locacoes: any[];
  tick: number;
  today: Date;
  getMapColor: (c: any, locs: any, d: Date, loc?: any) => MapColor;
  getLocacaoForCacamba: (id: string) => any;
  getClienteName: (id: string) => string;
  drawRoute: (lat: number, lng: number) => void;
  openGoogleMaps: (lat: number, lng: number) => void;
  handleMarcarRetirada: (c: Cacamba) => void;
  advanceRentalStatus: (id: string) => void;
  setHistoricoModal: (c: Cacamba) => void;
  isRouting?: boolean;
}

export const MapMarkersV2 = React.memo(({
  userPos, accuracy, route, filteredCacambas, locacoes, tick, today,
  getMapColor, getLocacaoForCacamba, getClienteName, drawRoute, openGoogleMaps,
  handleMarcarRetirada, advanceRentalStatus, setHistoricoModal, isRouting
}: MapMarkersProps) => {
  
  console.log('[MapMarkersV2] Rendering with', filteredCacambas?.length, 'cacambas');
  
  return (
    <>
      {userPos && (
        <>
          <Marker position={userPos} icon={USER_ICON}>
            <Popup><b>Você está aqui!</b><br />Precisão: ~{Math.round(accuracy)}m</Popup>
          </Marker>
          <Circle center={userPos} radius={Math.min(accuracy, 500)} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.12, weight: 1 }} />
        </>
      )}

      {route && <Polyline positions={route.coords} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85, dashArray: '12,8' }} />}

      {filteredCacambas.map((cab) => {
        const loc = getLocacaoForCacamba(cab.id);
        const color = getMapColor(cab, locacoes, today, loc); 
        const blink = color === 'vermelho';
        
        return (
          <Marker 
            key={`${cab.id}-${tick}`} 
            position={[cab.lat!, cab.lng!]} 
            icon={createCacambaIcon(cab.codigo, color, blink)}
          >
            <Popup className="cacamba-popup" minWidth={340} maxWidth={400}>
              <div className="cacamba-popup-inner overflow-hidden rounded-xl shadow-2xl border border-slate-200">
                {/* Header Premium */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Identificação</span>
                    <strong className="text-xl font-black text-slate-900 leading-none antialiased">{cab.codigo}</strong>
                  </div>
                  <div 
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-sm ring-1 ring-inset ring-black/5"
                    style={{ background: MAP_COLORS[color].bg }}
                  >
                    {MAP_COLORS[color].label}
                  </div>
                </div>

                {/* Conteúdo com Hierarquia Forte */}
                <div className="px-5 py-6 bg-white space-y-5">
                  {loc ? (
                    <div className="space-y-6">
                      {/* Cliente e Endereço */}
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50">
                          <MapPin className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Local da Operação</p>
                          <p className="font-black text-slate-900 text-sm leading-tight mb-1 truncate">{getClienteName(loc.clienteId)}</p>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{loc.enderecoObra || 'Endereço não informado'}</p>
                        </div>
                      </div>

                      {/* Cronograma Grid */}
                      <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50/50 border border-slate-100/80">
                        <div className="space-y-1.5 border-r border-slate-200/50 pr-4">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 ring-2 ring-green-100" />
                            Entrega
                          </p>
                          <span className="block font-black text-slate-700 text-xs">
                            {cab.dataEntrega ? new Date(cab.dataEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : 'Pendente'}
                          </span>
                        </div>
                        <div className="space-y-1.5 pl-2 text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                            Retirada
                            <span className={`w-1.5 h-1.5 rounded-full ring-2 ${color === 'vermelho' ? 'bg-red-500 ring-red-100 animate-pulse' : 'bg-amber-400 ring-amber-100'}`} />
                          </p>
                          <span className="block font-black text-slate-700 text-xs">
                            {loc.dataDevolucaoPrevista ? new Date(loc.dataDevolucaoPrevista + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 grayscale opacity-60">
                       <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                          <MapPin className="w-6 h-6 text-slate-400" />
                       </div>
                       <div>
                          <p className="font-black text-slate-800 text-sm">Pronta para Uso</p>
                          <p className="text-[11px] text-slate-500 font-medium">Esta caçamba está disponível no pátio principal.</p>
                       </div>
                    </div>
                  )}
                </div>

                {/* Ações Inteligentes */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <button 
                      className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ring-1 ring-inset ${isRouting ? 'bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed' : 'bg-white hover:bg-blue-50 text-blue-600 ring-blue-100 border-b-2 border-blue-200 hover:border-blue-300'}`}
                      onClick={() => !isRouting && drawRoute(cab.lat!, cab.lng!)}
                      disabled={isRouting}
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isRouting ? 'animate-pulse' : ''}`} /> 
                      {isRouting ? 'Navegando...' : 'Gerar Rota'}
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg text-[11px] font-black uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 border-b-2 border-slate-300 shadow-sm transition-all"
                      onClick={() => openGoogleMaps(cab.lat!, cab.lng!)}
                    >
                      <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" className="w-3.5 h-3.5 rounded-sm" alt="G" />
                      Google
                    </button>
                  </div>
                  
                  {loc && loc.status !== 'pago' && (
                    <button 
                      className={`w-full h-12 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 border-b-4 ${
                        loc.status === 'entrega_pendente' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 border-blue-800' :
                        loc.status === 'em_uso' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 border-amber-700' :
                        'bg-green-600 hover:bg-green-700 shadow-green-200 border-green-800'
                      }`}
                      onClick={() => advanceRentalStatus(loc.id)}
                    >
                      <Navigation className="w-3.5 h-3.5 rotate-90" />
                      {loc.status === 'entrega_pendente' ? 'Confirmar Entrega' :
                       loc.status === 'em_uso' ? 'Marcar p/ Retirada' :
                       'Confirmar Pagamento'}
                    </button>
                  )}
                  
                  {(cab.historico?.length ?? 0) > 0 && (
                    <button 
                      className="w-full py-2.5 text-[9px] text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border border-dashed border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50"
                      onClick={() => setHistoricoModal(cab)}
                    >
                      Ver Histórico Detalhado ({cab.historico!.length})
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  );
});

MapMarkersV2.displayName = 'MapMarkersV2';
