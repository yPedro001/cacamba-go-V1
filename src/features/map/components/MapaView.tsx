'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMapController } from '../hooks/useMapController';
import { MAP_COLORS } from '../constants';
import { MapFilterPanel } from './MapFilterPanel';
import { MapComponent, EnrichedMapCacamba } from './MapComponent';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useCacambas, useClientes } from '@/store/useAppStore';
import { formatLocalDateBR, buildWhatsAppUrl } from '@/lib/domain-helpers';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Locacao, MapColor } from '@/core/domain/types';
import {
  MapPin,
  SlidersHorizontal,
  X,
  Navigation,
  ExternalLink,
  CheckCircle2,
  Truck,
  History,
  Phone,
  AlertTriangle,
  Crosshair,
} from 'lucide-react';

const ACTIVE_MAP_STATUS_KEYS: Exclude<MapColor, 'verde'>[] = [
  'azul',
  'amarelo',
  'vermelho',
  'cinza',
];

function getAdvanceActionMeta(status: Locacao['status']) {
  if (status === 'entrega_pendente') {
    return {
      buttonLabel: 'Confirmar Entrega',
      modalTitle: 'Confirmar Entrega na Obra',
      modalDescription: 'Esta caçamba passará para o status Em Uso e iniciará a contagem de prazo.',
    };
  }
  if (status === 'em_uso') {
    return {
      buttonLabel: 'Solicitar Retirada',
      modalTitle: 'Marcar para Retirada',
      modalDescription: 'Esta caçamba será sinalizada no mapa em vermelho para retirada no endereço.',
    };
  }
  return {
    buttonLabel: 'Confirmar Retirada e Pagamento',
    modalTitle: 'Confirmar Retirada e Baixa Financeira',
    modalDescription:
      'A locação será marcada como Paga (receita realizada) com a data de hoje e a caçamba voltará a ficar disponível no pátio.',
  };
}

export default function MapaView() {
  const controller = useMapController();
  const clientes = useClientes();
  const allCacambas = useCacambas();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedCacambaId, setSelectedCacambaId] = useState<string | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState<{
    cab: EnrichedMapCacamba;
    loc: Locacao;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const filterFromUrl = searchParams.get('filtro');
    if (filterFromUrl) {
      controller.setFilterColor(filterFromUrl as MapColor | 'todos');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  const { locacoes, filteredCacambas } = controller;

  const statusCounts = useMemo(() => {
    const counts: Record<Exclude<MapColor, 'verde'>, number> = {
      azul: 0,
      amarelo: 0,
      vermelho: 0,
      cinza: 0,
    };
    allCacambas.forEach((cab) => {
      const enriched = filteredCacambas.find((fc) => fc.id === cab.id);
      if (enriched && enriched._color !== 'verde') {
        counts[enriched._color] = (counts[enriched._color] || 0) + 1;
      }
    });
    return counts;
  }, [allCacambas, filteredCacambas]);

  const semCoordenadasProprias = useMemo(() => {
    return filteredCacambas.filter((c) => c.lat == null || c.lng == null).length;
  }, [filteredCacambas]);

  // Itinerário do dia: entregas pendentes + retiradas vencidas (prioridade vencida primeiro)
  const itinerario = useMemo(() => {
    return [...locacoes]
      .filter((l) => l.status === 'vencida' || l.status === 'entrega_pendente')
      .sort((a, b) => {
        if (a.status === 'vencida' && b.status !== 'vencida') return -1;
        if (a.status !== 'vencida' && b.status === 'vencida') return 1;
        return (a.dataDevolucaoPrevista || a.dataRetirada).localeCompare(
          b.dataDevolucaoPrevista || b.dataRetirada
        );
      })
      .slice(0, 8);
  }, [locacoes]);

  const selectedCacamba = useMemo(() => {
    if (!selectedCacambaId) return null;
    return (filteredCacambas.find((c) => c.id === selectedCacambaId) as EnrichedMapCacamba) ?? null;
  }, [filteredCacambas, selectedCacambaId]);

  const focusCacamba = (cab: EnrichedMapCacamba) => {
    setSelectedCacambaId(cab.id);
    if (cab._resolvedLat != null && cab._resolvedLng != null && controller.mapRef.current) {
      controller.mapRef.current.flyTo([cab._resolvedLat, cab._resolvedLng], 16, { duration: 0.9 });
    }
  };

  const focusFromLocacao = (loc: Locacao) => {
    const targetId = loc.cacambaId || loc.cacambaIds?.[0];
    if (!targetId) return;
    const match = filteredCacambas.find((c) => c.id === targetId) as EnrichedMapCacamba | undefined;
    if (match) {
      focusCacamba(match);
    } else if (loc.lat != null && loc.lng != null && controller.mapRef.current) {
      controller.mapRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 0.9 });
    }
  };

  const hasActiveFilters =
    controller.filterColor !== 'todos' ||
    controller.filterCliente !== 'todos' ||
    controller.filterVencimento !== 'todos';

  if (!mounted) {
    return (
      <div className="h-[calc(100dvh-160px)] min-h-[420px] w-full flex items-center justify-center bg-card border border-border rounded-xl">
        <p className="text-muted-foreground font-semibold text-xs uppercase tracking-widest">
          Carregando mapa...
        </p>
      </div>
    );
  }

  const selectedLoc = selectedCacamba
    ? controller.getLocacaoForCacamba(selectedCacamba.id)
    : undefined;
  const selectedCliente = selectedLoc
    ? clientes.find((c) => c.id === selectedLoc.clienteId)
    : undefined;
  const selectedWhatsApp = selectedCliente?.telefone
    ? buildWhatsAppUrl(
        selectedCliente.telefone,
        `Olá ${selectedCliente.nome}, tudo bem? Sobre a caçamba ${selectedCacamba?.codigo || ''}.`
      )
    : null;
  const advanceMeta = selectedLoc ? getAdvanceActionMeta(selectedLoc.status) : null;

  return (
    <div className="space-y-4 w-full" data-map-v3="true">
      {/* Cabeçalho operacional único */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Mapa de Operações
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Localize caçambas, trace rotas e acompanhe entregas e retiradas do dia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => controller.locate()}
            className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
          >
            <Crosshair className="w-4 h-4 mr-2 text-primary" />
            Localizar
          </Button>
          <Button
            type="button"
            variant={controller.showFilters ? 'default' : 'outline'}
            onClick={() => controller.setShowFilters(!controller.showFilters)}
            className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => controller.clearFilters()}
              className="min-h-[44px] text-destructive hover:text-destructive whitespace-nowrap"
            >
              <X className="w-4 h-4 mr-1.5" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Barra única de status clicáveis (sem legenda duplicada dentro do mapa) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => controller.setFilterColor('todos')}
          className={cn(
            'min-h-[40px] shrink-0 px-3 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap',
            controller.filterColor === 'todos'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-card text-muted-foreground border-border hover:text-foreground'
          )}
        >
          Todas ({allCacambas.length})
        </button>
        {ACTIVE_MAP_STATUS_KEYS.map((key) => {
          const val = MAP_COLORS[key];
          const isSelected = controller.filterColor === key;
          const count = isSelected
            ? filteredCacambas.length
            : !hasActiveFilters
              ? statusCounts[key]
              : null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => controller.setFilterColor(isSelected ? 'todos' : key)}
              className={cn(
                'min-h-[40px] shrink-0 inline-flex items-center gap-2 px-3 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap',
                isSelected
                  ? 'border-transparent shadow-sm'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              )}
              style={isSelected ? { background: val.bg, color: val.ink } : undefined}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: val.bg, border: `1.5px solid ${val.ring}` }}
              />
              <span>{val.label}</span>
              {count !== null && (
                <span className="tabular-nums opacity-80">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Canvas do mapa */}
      <div className="w-full relative">
        <div className="relative w-full h-[52dvh] min-h-[340px] max-h-[540px] lg:h-[62dvh] lg:max-h-[660px] overflow-hidden rounded-xl border border-border shadow-md bg-muted">
          <MapComponent
            controller={controller}
            onSelectCacamba={(cab) => setSelectedCacambaId(cab.id)}
            onRequestAdvanceStatus={(cab, loc) => setPendingAdvance({ cab, loc })}
          />
        </div>

        {/* Badge flutuante de rota calculada */}
        {controller.route && (
          <div className="mt-2 sm:mt-0 sm:absolute sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 z-[800] flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-info text-white text-xs sm:text-sm rounded-full font-semibold shadow-lg">
              <Navigation className="w-4 h-4 shrink-0" />
              <span className="tabular-nums">
                {controller.route.distance} km · ~{controller.route.time} min
              </span>
              <button
                type="button"
                onClick={() => controller.setRoute(null)}
                aria-label="Fechar rota"
                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aviso de fallback para pátio quando há caçambas sem GPS próprio */}
      {semCoordenadasProprias > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 border border-border rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <span>
            {semCoordenadasProprias} caçamba(s) sem coordenadas próprias de obra estão agrupadas na posição da sede.
          </span>
        </div>
      )}

      {/* Card sincronizado da caçamba selecionada (excelente em campo/mobile) */}
      {selectedCacamba && (
        <Card className="border-primary/40 bg-card shadow-md">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="px-2.5 py-1 rounded-md text-xs font-bold font-mono shrink-0"
                style={{
                  background: MAP_COLORS[selectedCacamba._color].bg,
                  color: MAP_COLORS[selectedCacamba._color].ink,
                }}
              >
                {selectedCacamba.codigo}
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">
                  {selectedLoc ? controller.getClienteName(selectedLoc.clienteId) : 'No Pátio (Disponível)'}
                </CardTitle>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedLoc?.enderecoObra || selectedCacamba.enderecoAtual || 'Sede da empresa'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCacambaId(null)}
              aria-label="Fechar detalhes da caçamba"
              className="min-h-[44px] min-w-[44px] shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedLoc && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/40 rounded-lg p-3 border border-border">
                <div>
                  <span className="text-muted-foreground block">Entrega</span>
                  <span className="font-semibold tabular-nums">
                    {formatLocalDateBR(selectedLoc.dataRetirada)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Vencimento</span>
                  <span className="font-semibold tabular-nums">
                    {formatLocalDateBR(selectedLoc.dataDevolucaoPrevista)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground block">Valor</span>
                  <span className="font-bold tabular-nums">
                    {selectedLoc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedCacamba._resolvedLat != null && selectedCacamba._resolvedLng != null && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      controller.drawRoute(selectedCacamba._resolvedLat!, selectedCacamba._resolvedLng!)
                    }
                    disabled={controller.isRouting}
                    className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
                  >
                    <Navigation className="w-4 h-4 mr-2 text-primary" />
                    {controller.isRouting ? 'Calculando...' : 'Traçar Rota'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      controller.openGoogleMaps(
                        selectedCacamba._resolvedLat!,
                        selectedCacamba._resolvedLng!
                      )
                    }
                    className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 text-info" />
                    Google Maps
                  </Button>
                </>
              )}

              {selectedWhatsApp && (
                <a
                  href={selectedWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border border-border bg-background hover:bg-muted text-sm font-semibold whitespace-nowrap flex-1 sm:flex-none"
                >
                  <Phone className="w-4 h-4 mr-2 text-success" />
                  WhatsApp
                </a>
              )}

              {(selectedCacamba.historico?.length ?? 0) > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => controller.setHistoricoModal(selectedCacamba)}
                  className="min-h-[44px] whitespace-nowrap"
                >
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              )}

              {selectedLoc && advanceMeta && (
                <Button
                  type="button"
                  onClick={() => setPendingAdvance({ cab: selectedCacamba, loc: selectedLoc })}
                  className="min-h-[44px] flex-1 sm:ml-auto whitespace-nowrap"
                >
                  {selectedLoc.status === 'entrega_pendente' ? (
                    <Truck className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  {advanceMeta.buttonLabel}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itinerário Operacional do Dia */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary rounded-full" />
            <CardTitle className="text-base">Itinerário Operacional</CardTitle>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground tabular-nums">
            {itinerario.length} pendente{itinerario.length === 1 ? '' : 's'}
          </span>
        </CardHeader>
        <CardContent>
          {itinerario.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed border-border">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Sua frota está em dia</p>
              <p className="text-xs mt-1">Nenhuma entrega ou retirada urgente no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {itinerario.map((loc) => {
                const isRetirada = loc.status === 'vencida';
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => focusFromLocacao(loc)}
                    className={cn(
                      'text-left p-3.5 rounded-xl border border-border border-l-4 bg-background hover:bg-muted/60 transition-colors flex flex-col gap-2 min-h-[116px]',
                      isRetirada ? 'border-l-destructive' : 'border-l-info'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span
                        className={cn(
                          'text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                          isRetirada
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-info/15 text-info'
                        )}
                      >
                        {isRetirada ? 'Retirada' : 'Entrega'}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {formatLocalDateBR(loc.dataDevolucaoPrevista || loc.dataRetirada)}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-foreground line-clamp-1">
                      {(loc.enderecoObra || '').split(',')[0] || 'Endereço não informado'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-auto flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {controller.getClienteName(loc.clienteId)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MapFilterPanel
        showFilters={controller.showFilters}
        setShowFilters={controller.setShowFilters}
        filterColor={controller.filterColor}
        setFilterColor={controller.setFilterColor}
        filterCliente={controller.filterCliente}
        setFilterCliente={controller.setFilterCliente}
        filterVencimento={controller.filterVencimento}
        setFilterVencimento={controller.setFilterVencimento}
        clientes={clientes}
        clearFilters={controller.clearFilters}
      />

      <ConfirmModal
        isOpen={!!pendingAdvance}
        onClose={() => setPendingAdvance(null)}
        onConfirm={() => {
          if (pendingAdvance && pendingAdvance.loc.id) {
            controller.advanceRentalStatus(pendingAdvance.loc.id);
            setPendingAdvance(null);
          }
        }}
        title={pendingAdvance ? getAdvanceActionMeta(pendingAdvance.loc.status).modalTitle : ''}
        description={
          pendingAdvance
            ? `${pendingAdvance.cab.codigo} (${controller.getClienteName(pendingAdvance.loc.clienteId)}): ${getAdvanceActionMeta(pendingAdvance.loc.status).modalDescription}`
            : ''
        }
        confirmText={pendingAdvance ? getAdvanceActionMeta(pendingAdvance.loc.status).buttonLabel : 'Confirmar'}
        variant={pendingAdvance?.loc.status === 'vencida' ? 'default' : 'default'}
      />
    </div>
  );
}
