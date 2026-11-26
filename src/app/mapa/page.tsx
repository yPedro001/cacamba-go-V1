"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const MapaView = dynamic(() => import('@/features/map/components/MapaView'), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100dvh-160px)] min-h-[420px] w-full flex items-center justify-center bg-card border border-border rounded-xl">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <div className="h-9 w-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-semibold text-xs uppercase tracking-widest">
          Carregando mapa operacional...
        </p>
      </div>
    </div>
  ),
});

export default function MapaPage() {
  return <MapaView />;
}
