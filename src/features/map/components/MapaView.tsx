"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapComponent } from './MapComponent'
import { useMapController } from '../hooks/useMapController'
import { MAP_COLORS } from '../constants'
import { MapFilterPanel } from './MapFilterPanel'
import { useClientes } from '@/store/useAppStore'

export default function MapaView() {
  const controller = useMapController();
  const clientes = useClientes();

  return (
    <div className="space-y-6 w-full max-w-none px-2" data-build-v2-9-pixel-perfect="true">
      {/* HEADER - ALINHADO COM BADGES À DIREITA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black tracking-tight text-foreground/90">Mapa de Operações</h2>
        <div className="flex gap-2 bg-background/50 backdrop-blur-sm border border-border/50 p-2 rounded-xl shadow-sm">
          <Badge variant="success" className="font-bold">Disponível</Badge>
          <Badge variant="warning" className="font-bold">Em Uso</Badge>
          <Badge variant="destructive" className="font-bold">Retirar</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* MAPA - LARGURA TOTAL NO TOPO */}
        <div className="w-full h-auto overflow-hidden rounded-2xl border border-border/40 shadow-xl">
          <MapComponent controller={controller} />
        </div>
        
        {/* SEÇÃO INFERIOR - ITINERÁRIO E CONTROLES LADO A LADO (50/50) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch pb-10">
          
          {/* 1. ITINERÁRIO DO DIA (LADO ESQUERDO) */}
          <div className="w-full flex">
            <Card className="border-border/40 shadow-lg bg-card/60 backdrop-blur-md flex-1 flex flex-col overflow-hidden group">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                  Itinerário do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex-1">
                <div className="space-y-5">
                  <div className="p-4 border-l-4 border-l-blue-600 bg-blue-600/5 hover:bg-blue-600/10 transition-all rounded-r-xl border border-border/5">
                    <p className="font-black text-base text-blue-700 dark:text-blue-400">Entrega Urgente: C-008</p>
                    <p className="text-sm text-muted-foreground font-medium">Pátio principal</p>
                    <p className="text-xs font-semibold mt-2 opacity-70">Levar para base de operações</p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all rounded-r-xl border border-border/5">
                    <p className="font-black text-base text-yellow-700 dark:text-yellow-400">Entrega: C-052</p>
                    <p className="text-sm text-muted-foreground font-medium">Roberto Almeida</p>
                    <p className="text-xs font-semibold mt-2 opacity-70">Av. Brasil, 2500 - 10:00</p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-l-red-600 bg-red-600/5 hover:bg-red-600/10 transition-all rounded-r-xl border border-border/5">
                    <p className="font-black text-base text-red-700 dark:text-red-400">Retirada: C-045</p>
                    <p className="text-sm text-muted-foreground font-medium">Maria Souza</p>
                    <p className="text-xs font-semibold mt-2 opacity-70">Rua Augusta, 400 - 14:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. PAINEL DE CONTROLE DO MAPA (LADO DIREITO) */}
          <div className="w-full flex">
            <Card className="border-border/40 shadow-lg bg-card/60 backdrop-blur-md flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black text-muted-foreground/80 uppercase tracking-[0.2em]">Painel de Controle do Mapa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 flex-1 flex flex-col justify-between">
                
                {/* LEGENDA DE STATUS */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    LEGENDA DE STATUS
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {Object.entries(MAP_COLORS).map(([key, val]) => (
                      <div 
                        key={key} 
                        onClick={() => controller.setFilterColor(controller.filterColor === key ? 'todos' : key as any)} 
                        className="flex items-start gap-3 cursor-pointer group/item"
                      >
                        <div className="mt-1 h-3 w-3 rounded-full flex-shrink-0 animate-pulse-subtle" style={{ backgroundColor: val.bg, border: `2px solid ${val.ring}` }} />
                        <div className="leading-tight">
                          <p className="text-[11px] font-black text-foreground group-hover/item:text-primary transition-colors">{val.label}</p>
                          <p className="text-[9px] text-muted-foreground/80 font-medium">{val.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO - GRANDES E LADO A LADO */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => controller.locate()}
                      className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border/50 bg-background/40 hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-95 group shadow-sm"
                    >
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors mb-2">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Localizar</span>
                    </button>
                    
                    <button 
                      onClick={() => controller.setShowFilters(!controller.showFilters)}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all active:scale-95 shadow-sm group ${controller.showFilters ? 'bg-primary border-primary text-white' : 'border-border/50 bg-background/40 hover:bg-indigo-500/5 hover:border-indigo-500/30'}`}
                    >
                      <div className={`p-3 rounded-xl mb-2 transition-colors ${controller.showFilters ? 'bg-white/20' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'}`}>
                        <svg className={`w-6 h-6 ${controller.showFilters ? 'text-white' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Filtros</span>
                    </button>
                  </div>
                  
                  {/* BOTÃO LIMPAR - RODAPÉ DO CARD */}
                  <button 
                    onClick={() => controller.clearFilters()}
                    className="w-full flex items-center justify-center p-2.5 mt-2 transition-all hover:bg-red-500/5 group"
                  >
                    <div className="flex items-center gap-2 border-t border-border/10 pt-4 w-full justify-center">
                      <svg className="w-4 h-4 text-red-500 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                      <span className="text-red-500 font-black uppercase text-[11px] tracking-[0.2em] group-hover:tracking-[0.25em] transition-all">Limpar Todos os Filtros</span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
