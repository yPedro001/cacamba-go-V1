'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MapColor, Cliente } from '@/core/domain/types';
import { Button } from '@/components/ui/button';

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
 * Painel de filtros avançados via Portal (z-[1100], acima dos controles Leaflet).
 * Exibe apenas status operacionais que existem no mapa ativo.
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

  const activeCount = [
    filterColor !== 'todos',
    filterCliente !== 'todos',
    filterVencimento !== 'todos',
  ].filter(Boolean).length;

  const selectClass =
    'w-full min-h-[44px] h-11 px-3 rounded-lg border border-input bg-background text-base sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer';

  const content = (
    <div
      className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-filters-title"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => setShowFilters(false)}
      />

      <div className="relative w-full sm:max-w-sm bg-card border border-border shadow-2xl rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-0.5">
              Refinar Visualização
            </p>
            <h3 id="map-filters-title" className="text-base font-bold text-foreground">
              Filtros do Mapa {activeCount > 0 ? `(${activeCount})` : ''}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(false)}
            aria-label="Fechar filtros"
            className="h-11 w-11 flex items-center justify-center hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="map-filter-status" className="text-xs font-semibold text-muted-foreground">
            Status operacional
          </label>
          <select
            id="map-filter-status"
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value as MapColor | 'todos')}
            className={selectClass}
          >
            <option value="todos">Todos no mapa</option>
            <option value="azul">Entrega Pendente</option>
            <option value="amarelo">Em Uso na Obra</option>
            <option value="vermelho">Vencida / Retirar</option>
            <option value="cinza">Disponível no Pátio</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="map-filter-cliente" className="text-xs font-semibold text-muted-foreground">
            Cliente
          </label>
          <select
            id="map-filter-cliente"
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            className={selectClass}
          >
            <option value="todos">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="map-filter-venc" className="text-xs font-semibold text-muted-foreground">
            Prazo de vencimento
          </label>
          <select
            id="map-filter-venc"
            value={filterVencimento}
            onChange={(e) => setFilterVencimento(e.target.value as 'todos' | '7' | '15' | '30')}
            className={selectClass}
          >
            <option value="todos">Qualquer prazo</option>
            <option value="7">Próximos 7 dias</option>
            <option value="15">Próximos 15 dias</option>
            <option value="30">Próximos 30 dias</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearFilters();
              setShowFilters(false);
            }}
            className="w-full sm:flex-1 min-h-[44px]"
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={() => setShowFilters(false)}
            className="w-full sm:flex-1 min-h-[44px]"
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
