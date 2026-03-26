'use client'
import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type DashboardChartData = {
  name: string
  Arrecadação: number
  Gastos: number
}

interface DashboardChartProps {
  data: DashboardChartData[]
}

/**
 * Componente isolado do gráfico do Dashboard.
 * Encapsula todos os imports do Recharts para que o carregamento dinâmico
 * via `dynamic()` funcione corretamente e separe o bundle.
 */
export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value}`}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend />
        <Bar dataKey="Arrecadação" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
