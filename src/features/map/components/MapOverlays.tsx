import React from 'react';
import { MAP_COLORS } from '../constants';
import { MapColor } from '@/core/domain/types';

interface MapOverlaysProps {
  filterColor: MapColor | 'todos';
  setFilterColor: (v: MapColor | 'todos') => void;
  route: { distance: string; time: string } | null;
  geoError: string;
}

/**
 * MapOverlays: Elementos de UI flutuantes DENTRO do mapa.
 * - Legenda no canto superior esquerdo (clicável para filtrar)
 * - Toast de erro de geolocalização
 * (A rota badge foi movida para fora do mapa no MapaView)
 */
export function MapOverlays({
  filterColor,
  setFilterColor,
  route,
  geoError,
}: MapOverlaysProps) {
  return (
    <>
      {/* Legenda no canto superior esquerdo */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 min-w-[175px]">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Legenda
          </p>
          {Object.entries(MAP_COLORS).map(([key, val]) => (
            <div
              key={key}
              onClick={() => setFilterColor(filterColor === key ? 'todos' : key as MapColor)}
              className={`flex items-center gap-2 mb-1.5 cursor-pointer rounded-md px-1.5 py-1 transition-colors select-none ${
                filterColor === key ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ background: val.bg, border: `2px solid ${val.ring}` }}
              />
              <div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{val.label}</p>
                <p className="text-[9px] text-slate-400 leading-none">{val.desc}</p>
              </div>
            </div>
          ))}
          {filterColor !== 'todos' && (
            <button
              onClick={() => setFilterColor('todos')}
              className="mt-1 w-full text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Limpar filtro ✕
            </button>
          )}
        </div>
      </div>

      {/* Toast de erro de geolocalização */}
      {geoError && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-amber-500 text-white shadow-xl text-xs rounded-full font-semibold max-w-xs text-center">
          {geoError}
        </div>
      )}
    </>
  );
}
