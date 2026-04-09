"use client"
import React from 'react'
import dynamic from 'next/dynamic'

// O MapaView contém toda a lógica (hooks e componentes) que dependem de 'window' ou 'leaflet'.
// Ao carregar dinamicamente com ssr: false, garantimos que o build da Vercel não falhe.
const MapaView = dynamic(() => import('@/features/map/components/MapaView'), { 
  ssr: false, 
  loading: () => (
    <div className="h-[calc(100vh-120px)] w-full flex items-center justify-center bg-muted/20 border border-border/40 rounded-[32px]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[11px] italic">Iniciando Centro de Operações...</p>
      </div>
    </div>
  )
})

export default function MapaPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <MapaView />
    </div>
  )
}
