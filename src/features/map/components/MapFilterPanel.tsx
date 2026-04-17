import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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

/**
 * MapFilterPanel: Painel de filtros avançados.
 * Renderizado via Portal no document.body para garantir que fique sobre o mapa
 * e qualquer outro elemento, ignorando contextos de z-index ou overflow dos pais.
 */
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
  clearFilters,
}: MapFilterPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!showFilters || !mounted) return null;

  // Contar filtros ativos
  const activeCount = [
    filterColor !== 'todos',
    filterCliente !== 'todos',
    filterVencimento !== 'todos',
  ].filter(Boolean).length;

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop clicável para fechar */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setShowFilters(false)}
      />

      {/* Painel de filtros */}
      <div 
        className="relative bg-card border border-border shadow-2xl rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        style={{ width: '320px', maxWidth: '95vw' }}
      >

        {/* Header do painel */}
        <div className="flex justify-between items-center pb-3 border-b border-border/50">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-1">
              Refinar Mapa
            </p>
            <p className="text-base font-black tracking-tight">Filtros</p>
          </div>
          <button
            onClick={() => setShowFilters(false)}
            className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-xl transition-all active:scale-90"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Filtro por status */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest pl-1">
            Status
          </label>
          <select
            value={filterColor}
            onChange={e => setFilterColor(e.target.value as any)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="todos">Todos</option>
            <option value="azul">🔵 Entrega</option>
            <option value="amarelo">🟡 Em Uso</option>
            <option value="vermelho">🔴 Retirada</option>
            <option value="verde">🟢 Pago</option>
            <option value="cinza">⚪ Disponível</option>
          </select>
        </div>

        {/* Filtro por cliente */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest pl-1">
            Cliente
          </label>
          <select
            value={filterCliente}
            onChange={e => setFilterCliente(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="todos">Todos</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Filtro por vencimento */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest pl-1">
            Vencimento
          </label>
          <select
            value={filterVencimento}
            onChange={e => setFilterVencimento(e.target.value as any)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="todos">Tudo</option>
            <option value="7">Prox. 7 dias</option>
            <option value="15">Prox. 15 dias</option>
            <option value="30">Prox. 30 dias</option>
          </select>
        </div>

        {/* Botão de ação único e centralizado ou split reduzido */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => setShowFilters(false)}
            className="w-full h-10 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            Aplicar
          </button>
          <button
            onClick={clearFilters}
            className="w-full h-9 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground hover:text-red-600 transition-all"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
