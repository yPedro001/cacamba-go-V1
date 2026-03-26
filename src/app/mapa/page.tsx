"use client"
import React from 'react'
import dynamic from 'next/dynamic'

// O MapaView contém toda a lógica (hooks e componentes) que dependem de 'window' ou 'leaflet'.
// Ao carregar dinamicamente com ssr: false, garantimos que o build da Vercel não falhe.
const MapaView = dynamic(() => import('@/features/map/components/MapaView'), { 
  ssr: false, 
  loading: () => (
    <div className="h-[calc(100vh-100px)] w-full flex items-center justify-center bg-muted/20 border border-border rounded-xl">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium">Carregando Mapa de Operações...</p>
      </div>
    </div>
  )
})

export default function MapaPage() {
  return <MapaView />
}
