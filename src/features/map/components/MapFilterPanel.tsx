import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapColor, Cliente } from '@/core/domain/types';

interface MapFilterPanelProps {
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  filterColor: MapColor | 'todos';
  setFilterColor: (v: MapColor | 'todos') => void;
  filterCliente: string;
  setFilterCliente: (v: string) => void;
  filterVencimento: 'todos' | '7' | '15' | '30';
  setFilterVencimento: (v: 'todos' | '7' | '15' | '30') => void;
  clientes: Cliente[];
  clearFilters: () => void;
}

export function MapFilterPanel({
  showFilters,
  setShowFilters,
  filterColor,
  setFilterColor,
  filterCliente,
  setFilterCliente,
  filterVencimento,
  setFilterVencimento,
  clientes,
  clearFilters
}: MapFilterPanelProps) {
  if (!showFilters) return null;

  return (
    <div className="absolute top-[148px] right-3 z-[1000] bg-card/95 backdrop-blur border border-border rounded-xl shadow-xl p-4 w-64 space-y-3 pointer-events-auto">
      <div className="flex justify-between items-center pb-2 border-b border-border/50">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Mapa</p>
          <p className="text-sm font-black uppercase tracking-tight">Filtros Avançados</p>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearFilters}
            className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Resetar todos os filtros"
          >
            Limpar
          </button>
          <button 
            onClick={() => setShowFilters(false)}
            className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-semibold">Por Status/Cor</label>
        <select 
          value={filterColor} 
          onChange={e => setFilterColor(e.target.value as any)} 
          className="w-full h-9 px-2 rounded-md border border-input bg-transparent text-sm"
        >
          <option value="todos">Todos</option>
          <option value="amarelo">🟡 Em Uso</option>
          <option value="azul">🔵 Entrega Pendente</option>
          <option value="vermelho">🔴 Vencida/Retirar</option>
          <option value="cinza">⚪ Disponível</option>
          <option value="verde">🟢 Pago</option>
        </select>
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-semibold">Por Cliente</label>
        <select 
          value={filterCliente} 
          onChange={e => setFilterCliente(e.target.value)} 
          className="w-full h-9 px-2 rounded-md border border-input bg-transparent text-sm"
        >
          <option value="todos">Todos os clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-semibold">Vencimento nos próximos</label>
        <select 
          value={filterVencimento} 
          onChange={e => setFilterVencimento(e.target.value as any)} 
          className="w-full h-9 px-2 rounded-md border border-input bg-transparent text-sm"
        >
          <option value="todos">Qualquer data</option>
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
        </select>
      </div>
      
      <Button 
        size="sm" 
        variant="ghost" 
        className="w-full text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-600 hover:bg-red-50 py-5 border border-dashed border-border mt-2" 
        onClick={clearFilters}
      >
        Limpar todos os filtros
      </Button>
    </div>
  );
}
