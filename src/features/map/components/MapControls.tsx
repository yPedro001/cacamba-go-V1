import React from 'react';
import { Button } from '@/components/ui/button';
import { Locate, Filter, XCircle, RefreshCw } from 'lucide-react';

interface MapControlsProps {
  userPos: [number, number] | null;
  showFilters: boolean;
  setShowFilters: (v: boolean | ((prev: boolean) => boolean)) => void;
  locate: () => void;
  clearFilters: () => void;
  setRoute: (v: any) => void;
  mapRef: React.MutableRefObject<L.Map | null>;
  filteredCacambas?: any[];
}

export function MapControls({
  userPos,
  showFilters,
  setShowFilters,
  locate,
  clearFilters,
  setRoute,
  mapRef,
  filteredCacambas = []
}: MapControlsProps) {
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
      {/* Botão Atualizar (Opcional, mas mantido para utilidade) */}
      <Button 
        onClick={() => { setRoute(null); mapRef.current?.invalidateSize(); }} 
        variant="secondary" size="sm" 
        className="shadow-lg backdrop-blur bg-white/90 dark:bg-black/80 font-semibold border h-10 px-3"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      {/* 1. LOCALIZAR */}
      <Button 
        onClick={() => locate()} 
        variant="secondary" size="sm" 
        className="shadow-lg backdrop-blur bg-white/90 dark:bg-black/80 font-bold border h-12 px-4 flex items-center gap-2 hover:bg-white transition-all text-blue-600 border-blue-100"
      >
        <Locate className="h-5 w-5" /> 
        <span className="hidden sm:inline">Localizar</span>
      </Button>
      
      {/* 2. FILTRO */}
      <Button 
        onClick={() => setShowFilters(v => !v)} 
        variant="secondary" size="sm" 
        className={`shadow-lg backdrop-blur font-bold border h-12 px-4 flex items-center gap-2 transition-all ${showFilters ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white/90 dark:bg-black/80 text-foreground'}`}
      >
        <Filter className="h-5 w-5" />
        <span className="hidden sm:inline">Filtros</span>
      </Button>

      {/* 3. LIMPAR FILTRO */}
      <Button 
        onClick={() => clearFilters()} 
        variant="secondary" size="sm" 
        className="shadow-lg backdrop-blur bg-white/90 dark:bg-black/80 font-bold border h-12 px-4 flex items-center gap-2 text-red-500 hover:bg-red-50 border-red-100"
      >
        <XCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Limpar</span>
      </Button>
    </div>
  );
}
