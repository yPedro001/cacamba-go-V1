"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMapController } from '../hooks/useMapController'
import { MAP_COLORS } from '../constants'
import { MapFilterPanel } from './MapFilterPanel'
import { useClientes } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
// Importação direta — MapaView já é carregado com ssr: false pela page.tsx
// Então é seguro importar MapComponent diretamente (Leaflet roda só no cliente)
import { MapComponent } from './MapComponent'

export default function MapaView() {
  const controller = useMapController();
  const clientes = useClientes();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Aplica filtro da URL ao montar (ex: navegação do dashboard com ?filtro=vermelho)
  React.useEffect(() => {
    if (!mounted) return;
    const filterFromUrl = searchParams.get('filtro');
    if (filterFromUrl) {
      setTimeout(() => {
        controller.setFilterColor(filterFromUrl as any);
      }, 200);
    }
  }, [mounted, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const { locacoes } = controller;

  // Itinerário do dia: locações que exigem ação operacional
  const itinerario = React.useMemo(() => {
    return locacoes
      .filter(l => l.status === 'vencida' || l.status === 'entrega_pendente')
      .slice(0, 6);
  }, [locacoes]);

  if (!mounted) {
    return (
      <div className="w-full" style={{ height: '700px' }}>
        <div className="w-full h-full bg-slate-900 animate-pulse rounded-3xl flex items-center justify-center">
          <p className="text-white/40 font-black text-xs uppercase tracking-widest">
            Carregando Mapa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full" data-map-v3="true">
      {/* ─── LINHA 1: HEADER & CONTROLES SUPERIORES ─── */}
      <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-5">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground/90">
            Mapa de Operações
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Visualize e gerencie suas caçambas em tempo real
          </p>
        </div>

        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 w-full 2xl:w-auto">
          {/* Badges de legenda rápida (agora agindo como filtros principais visuais na barra superior) */}
          <div className="flex flex-wrap gap-1.5 bg-background/50 backdrop-blur-sm border border-border/50 p-1.5 rounded-xl shadow-sm w-full xl:w-auto">
            {Object.entries(MAP_COLORS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => controller.setFilterColor(
                  controller.filterColor === key ? 'todos' : key as any
                )}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                  controller.filterColor === key
                    ? "text-white shadow-sm"
                    : "text-foreground/70 hover:text-foreground bg-background/40 hover:bg-background/80"
                )}
                style={controller.filterColor === key ? { background: val.bg } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: val.bg, border: `1.5px solid ${val.ring}` }}
                />
                {val.label}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-border/60 hidden xl:block"></div>

          {/* Botões de Ação na mesma linha */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <button
              onClick={() => controller.locate()}
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-background border border-border hover:bg-muted font-bold text-[11px] uppercase tracking-wider text-foreground shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Localizar no Mapa
            </button>
            <button
              onClick={() => controller.setShowFilters(!controller.showFilters)}
              className={cn(
                "flex-1 xl:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors",
                controller.showFilters ? "bg-primary border-primary text-white" : "bg-background border-border hover:bg-muted text-foreground"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros Avançados
            </button>
            <button
              onClick={() => controller.clearFilters()}
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 dark:bg-red-900/10 dark:border-red-900/30 dark:hover:bg-red-900/20 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* ─── LINHA 2: MAPA ─── */}
      <div className="w-full relative">
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-border/40 shadow-xl bg-slate-900"
          style={{ height: '580px' }}
        >
          <MapComponent controller={controller} />
        </div>

        {/* Badge de rota quando ativa */}
        {controller.route && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] shadow-2xl">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white text-sm rounded-full font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {controller.route.distance} km · ~{controller.route.time} min
              <button
                onClick={() => controller.setRoute(null)}
                className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors font-black text-xl leading-none flex items-center justify-center w-7 h-7"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── LINHA 3: PAINEL DE CONTROLE (ESQ) E ITINERÁRIO (DIR) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: PAINEL DE CONTROLE (compacto) */}
        <div className="lg:col-span-1 xl:col-span-1 border border-border/20 rounded-2xl bg-card/60 shadow-sm p-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Legenda de Status
          </h3>
          
          <div className="space-y-1">
            {Object.entries(MAP_COLORS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => controller.setFilterColor(
                  controller.filterColor === key ? 'todos' : key as any
                )}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg transition-all text-left group",
                  controller.filterColor === key
                    ? "bg-muted ring-1 ring-border shadow-sm"
                    : "hover:bg-muted/50 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: val.bg, border: `2px solid ${val.ring}` }}
                  />
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{val.label}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between bg-muted/30 -mx-4 -mb-4 p-4 rounded-b-2xl">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">No Mapa Atual</span>
            <span className="text-sm font-black text-foreground bg-background px-2.5 py-1 rounded-md border border-border/50 shadow-sm">
              {controller.filteredCacambas.length}
            </span>
          </div>
        </div>

        {/* COLUNA DIREITA: ITINERÁRIO DO DIA */}
        <div className="lg:col-span-4 xl:col-span-5">
          <Card className="border-border/20 shadow-sm bg-card/60 h-full">
            <CardHeader className="pb-3 border-b border-border/10 bg-muted/10">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-[0.1em]">
                <div className="w-1.5 h-5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                Itinerário Operacional
                {itinerario.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/50 shadow-sm">
                    {itinerario.length} Pendente{itinerario.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {itinerario.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-background/50 rounded-xl border border-dashed border-border/40 flex flex-col items-center justify-center">
                   <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-3 border border-green-200 dark:border-green-800/30">
                     <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <p className="text-sm font-bold text-foreground">Sua frota está em dia!</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-50 mt-1">Nenhuma pendência operacional.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {itinerario.map(loc => (
                    <div
                      key={loc.id}
                      className={cn(
                        "p-3.5 border-l-[4px] transition-all rounded-xl border border-border/10 shadow-sm flex flex-col h-full bg-background/80 hover:bg-background hover:shadow-md hover:border-border/30",
                        loc.status === 'vencida' ? "border-l-red-500" : "border-l-blue-500"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2.5">
                         <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md",
                            loc.status === 'vencida' ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                         )}>
                            {loc.status === 'vencida' ? 'Retirada' : 'Entrega'}
                         </span>
                      </div>
                      <p className="font-bold text-sm leading-tight mb-0.5 truncate" title={loc.enderecoObra || ''}>
                        {(loc.enderecoObra || '').split(',')[0] || 'Endereço não informado'}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-semibold mb-3 truncate">
                        {controller.getClienteName(loc.clienteId)}
                      </p>
                      <div className="mt-auto pt-2.5 border-t border-border/10 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-foreground/60 flex items-center gap-1.5">
                          {loc.status === 'vencida' ? 'Venceu ' : 'Para '}
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-black",
                            loc.status === 'vencida' ? "bg-red-50 text-red-600 dark:bg-red-900/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                          )}>
                             {new Date(loc.dataRetirada + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── PAINEL DE FILTROS (MODAL OVERLAY) ─── */}
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

    </div>
  );
}
