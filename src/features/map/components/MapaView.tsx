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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Mapa de Operações</h2>
        <div className="flex gap-2 bg-background border border-border p-2 rounded-lg">
          <Badge variant="success">Disponível</Badge>
          <Badge className="bg-blue-500 hover:bg-blue-600">Entregar</Badge>
          <Badge variant="warning">Em Uso</Badge>
          <Badge variant="destructive">Retirar</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          <MapComponent controller={controller} />
        </div>
        
        <div className="space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Itinerário do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-l-blue-500 bg-muted/30 rounded-r-md">
                  <p className="font-semibold text-sm">Entrega Urgente: C-008</p>
                  <p className="text-xs text-muted-foreground">Pátio principal</p>
                  <p className="text-xs font-medium mt-1">Levar para base de operações</p>
                </div>
                
                <div className="p-3 border-l-4 border-l-yellow-500 bg-muted/30 rounded-r-md">
                  <p className="font-semibold text-sm">Entrega: C-052</p>
                  <p className="text-xs text-muted-foreground">Roberto Almeida</p>
                  <p className="text-xs font-medium mt-1">Av. Brasil, 2500 - 10:00</p>
                </div>
                
                <div className="p-3 border-l-4 border-l-red-500 bg-muted/30 rounded-r-md">
                  <p className="font-semibold text-sm">Retirada: C-045</p>
                  <p className="text-xs text-muted-foreground">Maria Souza</p>
                  <p className="text-xs font-medium mt-1">Rua Augusta, 400 - 14:00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Controles do Mapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Legenda Operacional</p>
                <div className="space-y-2.5">
                  {Object.entries(MAP_COLORS).map(([key, val]) => (
                    <div 
                      key={key} 
                      onClick={() => controller.setFilterColor(controller.filterColor === key ? 'todos' : key as any)} 
                      className={`flex items-center gap-3 cursor-pointer rounded-md p-1.5 transition-all ${controller.filterColor === key ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                    >
                      <div className="h-3.5 w-3.5 rounded-full flex-shrink-0 border-2" style={{ backgroundColor: val.bg, borderColor: val.ring }} />
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-foreground">{val.label}</p>
                        <p className="text-[9px] text-muted-foreground">{val.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => controller.locate()}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors gap-1 shadow-sm"
                  >
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <span className="text-[10px] font-bold">Localizar</span>
                  </button>
                  <button 
                    onClick={() => controller.setShowFilters(!controller.showFilters)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1 shadow-sm ${controller.showFilters ? 'bg-primary border-primary text-white' : 'bg-card border-border hover:bg-muted'}`}
                  >
                    <div className={`p-1.5 rounded-lg ${controller.showFilters ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                      <svg className={`w-4 h-4 ${controller.showFilters ? 'text-white' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                    </div>
                    <span className="text-[10px] font-bold">Filtros</span>
                  </button>
                </div>
                
                <button 
                  onClick={() => controller.clearFilters()}
                  className="w-full flex items-center justify-center p-2.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 transition-colors gap-2 shadow-sm group"
                >
                  <div className="p-1 bg-white rounded-md border border-red-100 group-hover:scale-110 transition-transform">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Limpar Todos os Filtros</span>
                </button>
              </div>

              {controller.geoError && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-600 font-medium text-center">
                  ⚠️ {controller.geoError}
                </div>
              )}
              {controller.route && (
                <div className="p-3 rounded-lg bg-blue-500 dark:bg-blue-600 text-white shadow-lg space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Rota Ativa</span>
                    <button onClick={() => controller.setRoute(null)} className="text-[10px] font-black">✕</button>
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
