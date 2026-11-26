'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

export interface RelatorioPontoMensal {
  name: string;
  Bruto: number;
  Líquido: number;
  Taxas: number;
  Gastos: number;
  count: number;
}

interface RelatoriosChartProps {
  data: RelatorioPontoMensal[];
  showBruto: boolean;
  showLiquido: boolean;
  showTaxas: boolean;
  showGastos: boolean;
  barSelecionada: string | null;
  onSelectBar: (label: string) => void;
}

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs min-w-[180px] space-y-1.5">
      <p className="font-bold text-foreground border-b border-border pb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.name}:
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            R$ {Number(entry.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RelatoriosChart({
  data,
  showBruto,
  showLiquido,
  showTaxas,
  showGastos,
  barSelecionada,
  onSelectBar,
}: RelatoriosChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
        onClick={(chartData) => {
          if (chartData?.activeLabel != null) {
            onSelectBar(String(chartData.activeLabel));
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v) => `R$${Number(v).toLocaleString('pt-BR')}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.45)' }} />
        <Legend
          formatter={(value) => <span className="text-xs sm:text-sm text-foreground">{value}</span>}
          wrapperStyle={{ paddingTop: '12px' }}
        />

        {showBruto && (
          <Bar dataKey="Bruto" name="Faturamento Bruto" fill="#16794C" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell
                key={`bruto-${index}`}
                fill={barSelecionada && barSelecionada !== entry.name ? 'rgba(22, 121, 76, 0.3)' : '#16794C'}
              />
            ))}
          </Bar>
        )}
        {showLiquido && (
          <Bar dataKey="Líquido" name="Faturamento Líquido" fill="#1D5FB8" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell
                key={`liq-${index}`}
                fill={barSelecionada && barSelecionada !== entry.name ? 'rgba(29, 95, 184, 0.3)' : '#1D5FB8'}
              />
            ))}
          </Bar>
        )}
        {showTaxas && (
          <Bar dataKey="Taxas" name="Taxas de Cartão" fill="#D98A00" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell
                key={`tax-${index}`}
                fill={barSelecionada && barSelecionada !== entry.name ? 'rgba(217, 138, 0, 0.3)' : '#D98A00'}
              />
            ))}
          </Bar>
        )}
        {showGastos && (
          <Bar dataKey="Gastos" name="Gastos Operacionais" fill="#C42B22" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell
                key={`gast-${index}`}
                fill={barSelecionada && barSelecionada !== entry.name ? 'rgba(196, 43, 34, 0.3)' : '#C42B22'}
              />
            ))}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
