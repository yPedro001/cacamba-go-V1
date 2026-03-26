import React from 'react';
import { MAP_COLORS } from '../constants';
import { MapColor } from '@/core/domain/types';

interface MapOverlaysProps {
  filterColor: MapColor | 'todos';
  setFilterColor: (v: MapColor | 'todos') => void;
  route: { distance: string; time: string } | null;
  geoError: string;
}

export function MapOverlays({
  filterColor,
  setFilterColor,
  route,
  geoError
}: MapOverlaysProps) {
  return (
    <>
      {/* Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-auto">
        <div className="bg-card/95 backdrop-blur border border-border rounded-xl shadow-xl p-3 min-w-[180px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Legenda</p>
          {Object.entries(MAP_COLORS).map(([key, val]) => (
            <div 
              key={key} 
              onClick={() => setFilterColor(filterColor === key ? 'todos' : key as MapColor)} 
              className={`flex items-center gap-2 mb-1.5 cursor-pointer rounded-md px-1 py-0.5 transition-colors ${filterColor === key ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: val.bg, border: `2px solid ${val.ring}` }} />
              <div>
                <p className="text-xs font-semibold text-foreground">{val.label}</p>
                <p className="text-[9px] text-muted-foreground leading-none">{val.desc}</p>
              </div>
            </div>
          ))}
          {filterColor !== 'todos' && (
            <button 
              onClick={() => setFilterColor('todos')} 
              className="mt-1 w-full text-[10px] text-accent hover:text-accent-foreground font-semibold"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Error / Route Toast */}
      {geoError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-red-500 text-white shadow-xl text-xs rounded-full font-semibold">
          {geoError}
        </div>
      )}
      
      {route && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 bg-blue-600/95 text-white shadow-2xl text-sm rounded-full font-bold flex items-center gap-3">
          {route.distance} km · ~{route.time} min
        </div>
      )}
    </>
  );
}
