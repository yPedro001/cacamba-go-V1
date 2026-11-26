'use client';

import React from 'react';
import { Locate, Filter, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapControlsProps {
  showFilters: boolean;
  setShowFilters: (v: boolean | ((prev: boolean) => boolean)) => void;
  locate: () => void;
  setRoute: (v: null) => void;
  hasActiveRoute: boolean;
  hasActiveFilters: boolean;
  mapRef: React.MutableRefObject<{ invalidateSize?: () => void } | null>;
}

/**
 * Controles essenciais flutuantes no canto superior direito (44x44 touch-safe).
 */
export function MapControls({
  showFilters,
  setShowFilters,
  locate,
  setRoute,
  hasActiveRoute,
  hasActiveFilters,
  mapRef,
}: MapControlsProps) {
  return (
    <div className="absolute top-3 right-3 z-[800] flex flex-col gap-2 pointer-events-auto">
      <button
        type="button"
        onClick={locate}
        title="Centralizar minha localização ou caçamba filtrada"
        aria-label="Localizar no mapa"
        className="h-11 w-11 flex items-center justify-center bg-card/95 backdrop-blur border border-border rounded-xl shadow-md hover:bg-muted text-primary transition-colors active:scale-95"
      >
        <Locate className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        title="Filtros do mapa"
        aria-label="Abrir filtros do mapa"
        className={cn(
          'relative h-11 w-11 flex items-center justify-center backdrop-blur rounded-xl shadow-md transition-colors active:scale-95 border',
          showFilters || hasActiveFilters
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-card/95 border-border text-foreground hover:bg-muted'
        )}
      >
        <Filter className="h-4 w-4" />
        {hasActiveFilters && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-card"
          />
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setRoute(null);
          mapRef.current?.invalidateSize?.();
        }}
        title="Reajustar mapa"
        aria-label="Reajustar visualização do mapa"
        className="h-11 w-11 flex items-center justify-center bg-card/95 backdrop-blur border border-border rounded-xl shadow-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-95"
      >
        <RefreshCw className="h-4 w-4" />
      </button>

      {hasActiveRoute && (
        <button
          type="button"
          onClick={() => setRoute(null)}
          title="Limpar rota traçada"
          aria-label="Limpar rota traçada"
          className="h-11 w-11 flex items-center justify-center bg-destructive text-destructive-foreground rounded-xl shadow-md hover:opacity-90 transition-opacity active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
