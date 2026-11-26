'use client';

import React from 'react';
import { Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { createCacambaIcon, USER_ICON, MAP_COLORS } from '../constants';
import { MapColor, Cacamba, Locacao } from '@/core/domain/types';
import { formatLocalDateBR } from '@/lib/domain-helpers';
import { Navigation, MapPin, CreditCard, CheckCircle, Truck, History, ExternalLink } from 'lucide-react';
import type { EnrichedMapCacamba } from './MapComponent';

interface MapMarkersProps {
  userPos: [number, number] | null;
  accuracy: number;
  route: { coords: [number, number][]; distance: string; time: string } | null;
  filteredCacambas: EnrichedMapCacamba[];
  getLocacaoForCacamba: (id: string) => Locacao | undefined;
  getClienteName: (id: string) => string;
  drawRoute: (lat: number, lng: number) => void;
  openGoogleMaps: (lat: number, lng: number) => void;
  onRequestAdvanceStatus?: (cab: EnrichedMapCacamba, loc: Locacao) => void;
  onSelectCacamba?: (cab: EnrichedMapCacamba) => void;
  advanceRentalStatus: (id: string) => void;
  setHistoricoModal: (c: Cacamba) => void;
  isRouting?: boolean;
}

const formatCurrency = (v?: number) =>
  typeof v === 'number'
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

export const MapMarkersV2 = React.memo(
  ({
    userPos,
    accuracy,
    route,
    filteredCacambas,
    getLocacaoForCacamba,
    getClienteName,
    drawRoute,
    openGoogleMaps,
    onRequestAdvanceStatus,
    onSelectCacamba,
    advanceRentalStatus,
    setHistoricoModal,
    isRouting,
  }: MapMarkersProps) => {
    return (
      <>
        {userPos && (
          <>
            <Marker position={userPos} icon={USER_ICON}>
              <Popup minWidth={180} maxWidth={240}>
                <div className="p-3 text-xs space-y-0.5 bg-card text-card-foreground">
                  <p className="font-bold">Sua posição / Sede</p>
                  <p className="text-muted-foreground tabular-nums">
                    Precisão aproximada: {Math.round(accuracy || 0)}m
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={userPos}
              radius={Math.min(accuracy || 100, 500)}
              pathOptions={{ color: '#1d5fb8', fillColor: '#1d5fb8', fillOpacity: 0.1, weight: 1 }}
            />
          </>
        )}

        {route && (
          <Polyline
            positions={route.coords}
            pathOptions={{ color: '#1d5fb8', weight: 5, opacity: 0.85, dashArray: '12,8' }}
          />
        )}

        {filteredCacambas
          .filter((cab) => cab._resolvedLat != null && cab._resolvedLng != null)
          .map((cab) => {
            const loc = getLocacaoForCacamba(cab.id);
            const color: MapColor = cab._color;
            const blink = color === 'vermelho';
            const lat = cab._resolvedLat!;
            const lng = cab._resolvedLng!;

            const actionLabel =
              loc?.status === 'entrega_pendente'
                ? 'Confirmar Entrega'
                : loc?.status === 'em_uso'
                  ? 'Solicitar Retirada'
                  : loc?.status === 'vencida'
                    ? 'Confirmar Retirada e Pagamento'
                    : null;

            const actionClass =
              loc?.status === 'entrega_pendente'
                ? 'bg-info hover:opacity-90 text-white'
                : loc?.status === 'em_uso'
                  ? 'bg-warning hover:opacity-90 text-stone-950'
                  : 'bg-destructive hover:opacity-90 text-white';

            return (
              <Marker
                key={cab.id}
                position={[lat, lng]}
                icon={createCacambaIcon(cab.codigo, color, blink)}
                eventHandlers={{
                  click: () => onSelectCacamba?.(cab),
                }}
              >
                <Popup className="cacamba-popup" minWidth={250} maxWidth={295}>
                  <div className="cacamba-popup-inner bg-card text-card-foreground overflow-hidden">
                    {/* Cabeçalho */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Caçamba
                        </span>
                        <strong className="text-lg font-bold font-mono text-foreground leading-tight">
                          {cab.codigo}
                        </strong>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ background: MAP_COLORS[color].bg, color: MAP_COLORS[color].ink }}
                      >
                        {MAP_COLORS[color].label}
                      </span>
                    </div>

                    {/* Corpo */}
                    <div className="px-4 py-3 space-y-3 text-xs">
                      {loc ? (
                        <>
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground truncate">
                                {getClienteName(loc.clienteId)}
                              </p>
                              <p className="text-muted-foreground text-[11px] leading-snug line-clamp-2">
                                {loc.enderecoObra || 'Endereço não informado'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <CreditCard className="w-3.5 h-3.5 text-success" />
                              <span>Valor</span>
                            </div>
                            <span className="font-bold text-foreground tabular-nums">
                              {formatCurrency(loc.valor)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/60">
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                Entrega
                              </span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {formatLocalDateBR(loc.dataRetirada || cab.dataEntrega)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                Vencimento
                              </span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {formatLocalDateBR(loc.dataDevolucaoPrevista)}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-3 text-center space-y-1">
                          <p className="font-bold text-foreground">Disponível no Pátio</p>
                          <p className="text-[11px] text-muted-foreground">
                            Pronta para nova locação ({cab.tamanho || 'padrão'}).
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="p-3 bg-muted/30 border-t border-border flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => !isRouting && drawRoute(lat, lng)}
                          disabled={!!isRouting}
                          className="min-h-[40px] flex items-center justify-center gap-1.5 px-2 rounded-lg text-[11px] font-semibold bg-background border border-border hover:bg-muted text-foreground disabled:opacity-50 whitespace-nowrap"
                        >
                          <Navigation className="w-3.5 h-3.5 text-primary" />
                          {isRouting ? 'Calculando...' : 'Traçar Rota'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openGoogleMaps(lat, lng)}
                          className="min-h-[40px] flex items-center justify-center gap-1.5 px-2 rounded-lg text-[11px] font-semibold bg-background border border-border hover:bg-muted text-foreground whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-info" />
                          Google Maps
                        </button>
                      </div>

                      {loc && actionLabel && (
                        <button
                          type="button"
                          className={`w-full min-h-[44px] px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-opacity ${actionClass}`}
                          onClick={() => {
                            if (onRequestAdvanceStatus) {
                              onRequestAdvanceStatus(cab, loc);
                            } else if (loc.id) {
                              advanceRentalStatus(loc.id);
                            }
                          }}
                        >
                          {loc.status === 'entrega_pendente' ? (
                            <Truck className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span className="truncate">{actionLabel}</span>
                        </button>
                      )}

                      {(cab.historico?.length ?? 0) > 0 && (
                        <button
                          type="button"
                          className="w-full min-h-[36px] text-[11px] text-muted-foreground hover:text-foreground font-semibold flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border hover:bg-muted/50"
                          onClick={() => setHistoricoModal(cab)}
                        >
                          <History className="w-3.5 h-3.5" />
                          Histórico ({cab.historico!.length})
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
  }
);

MapMarkersV2.displayName = 'MapMarkersV2';
