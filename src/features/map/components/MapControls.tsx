import React from 'react';
import { Locate, Filter, XCircle, RefreshCw } from 'lucide-react';

interface MapControlsProps {
  userPos: [number, number] | null;
  showFilters: boolean;
  setShowFilters: (v: boolean | ((prev: boolean) => boolean)) => void;
  locate: () => void;
  clearFilters: () => void;
  setRoute: (v: any) => void;
  mapRef: React.MutableRefObject<any>; // Tipado como `any` para evitar import direto do Leaflet
  filteredCacambas?: any[];
}

/**
 * MapControls: Botões flutuantes no canto superior direito do mapa.
 * Renderizado DENTRO do MapContainer (via MapInnerContent).
 * Posicionado com `absolute` — funciona corretamente dentro do contexto do Leaflet.
 */
export function MapControls({
  userPos,
  showFilters,
  setShowFilters,
  locate,
  clearFilters,
  setRoute,
  mapRef,
}: MapControlsProps) {
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">

      {/* Atualizar (invalidar tamanho e limpar rota) */}
      <button
        onClick={() => {
          setRoute(null);
          mapRef.current?.invalidateSize();
        }}
        title="Atualizar mapa"
        className="h-10 w-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95"
      >
        <RefreshCw className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Localizar */}
      <button
        onClick={locate}
        title="Localizar"
        className="h-10 w-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-blue-200 dark:border-blue-700 rounded-xl shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95 text-blue-600"
      >
        <Locate className="h-5 w-5" />
      </button>

      {/* Filtros */}
      <button
        onClick={() => setShowFilters(v => !v)}
        title="Filtros"
        className={`h-10 w-10 flex items-center justify-center backdrop-blur rounded-xl shadow-lg transition-all active:scale-95 border ${
          showFilters
            ? 'bg-primary border-primary text-white shadow-primary/30'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <Filter className="h-4 w-4" />
      </button>

      {/* Limpar filtros */}
      <button
        onClick={clearFilters}
        title="Limpar filtros"
        className="h-10 w-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-red-200 dark:border-red-800 rounded-xl shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 text-red-500"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
