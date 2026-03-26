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
    <div className="space-y-6 w-full max-w-none px-2" data-build-layout-fix="true">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Mapa de Operações</h2>
        <div className="flex gap-2 bg-background border border-border p-2 rounded-lg">
          <Badge variant="success">Disponível</Badge>
          <Badge className="bg-blue-500 hover:bg-blue-600">Entregar</Badge>
          <Badge variant="warning">Em Uso</Badge>
          <Badge variant="destructive">Retirar</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* MAPA - LARGURA TOTAL NO TOPO */}
        <div className="w-full">
          <MapComponent controller={controller} />
        </div>
        
        {/* SEÇÃO INFERIOR - ITINERÁRIO E CONTROLES LADO A LADO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* 1. ITINERÁRIO */}
          <Card className="shadow-highlight border-primary/10 overflow-hidden h-full">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                Itinerário do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-colors rounded-r-md">
                  <p className="font-bold text-sm text-blue-700 dark:text-blue-400">Entrega Urgente: C-008</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">Pátio principal</p>
                  <p className="text-[11px] font-semibold mt-1 opacity-80">Levar para base de operações</p>
                </div>
                
                <div className="p-3 border-l-4 border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors rounded-r-md">
                  <p className="font-bold text-sm text-yellow-700 dark:text-yellow-400">Entrega: C-052</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">Roberto Almeida</p>
                  <p className="text-[11px] font-semibold mt-1 opacity-80">Av. Brasil, 2500 - 10:00</p>
                </div>
                
                <div className="p-3 border-l-4 border-l-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors rounded-r-md">
                  <p className="font-bold text-sm text-red-700 dark:text-red-400">Retirada: C-045</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">Maria Souza</p>
                  <p className="text-[11px] font-semibold mt-1 opacity-80">Rua Augusta, 400 - 14:00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. CONTROLES DO MAPA */}
          <Card className="border-border shadow-2xl bg-card/80 backdrop-blur-xl h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Controles do Mapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Legenda Operacional</p>
                <div className="gap-3 grid grid-cols-2">
                  {Object.entries(MAP_COLORS).map(([key, val]) => (
                    <div 
                      key={key} 
                      onClick={() => controller.setFilterColor(controller.filterColor === key ? 'todos' : key as any)} 
                      className={`flex items-center gap-2 cursor-pointer rounded-md p-1.5 transition-all ${controller.filterColor === key ? 'bg-background shadow-sm border border-primary/20' : 'hover:bg-background/50'}`}
                    >
                      <div className="h-3 w-3 rounded-full flex-shrink-0 border-2" style={{ backgroundColor: val.bg, borderColor: val.ring }} />
                      <div className="leading-tight">
                        <p className="text-[10px] font-bold text-foreground">{val.label}</p>
                        <p className="text-[8px] text-muted-foreground line-clamp-1">{val.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => controller.locate()}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 shadow-sm"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">Localizar</span>
                  </button>
                  <button 
                    onClick={() => controller.setShowFilters(!controller.showFilters)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 shadow-sm ${controller.showFilters ? 'bg-primary border-primary text-white' : 'bg-card border-border hover:bg-muted'}`}
                  >
                    <div className={`p-2 rounded-lg ${controller.showFilters ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                      <svg className={`w-5 h-5 ${controller.showFilters ? 'text-white' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">Filtros</span>
                  </button>
                </div>
                
                <button 
                  onClick={() => controller.clearFilters()}
                  className="w-full flex items-center justify-center p-3 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-100 text-red-600 transition-all gap-3 shadow-md group"
                >
                  <div className="p-1.5 bg-white rounded-md border border-red-100 group-hover:rotate-12 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Limpar Filtros</span>
                </button>
              </div>

              {controller.geoError && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-600 font-medium text-center animate-pulse">
                  ⚠️ {controller.geoError}
                </div>
              )}
              {controller.route && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl space-y-1 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Rota Ativa</span>
                    <button onClick={() => controller.setRoute(null)} className="h-5 w-5 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/40 transition-colors">✕</button>
                  </div>
                  <p className="text-sm font-black">{controller.route.distance} km · ~{controller.route.time} min</p>
                </div>
              )}
            </CardContent>
          </Card>
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
