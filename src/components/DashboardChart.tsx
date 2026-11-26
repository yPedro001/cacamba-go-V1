"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DashboardChartData = {
  name: string;
  Arrecadação: number;
  Gastos: number;
};

interface DashboardChartProps {
  data: DashboardChartData[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value}`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
          formatter={(value: any) =>
            new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              Number(value) || 0
            )
          }
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
          }}
          itemStyle={{ color: "hsl(var(--foreground))", fontSize: "12px", fontWeight: 600 }}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 700, marginBottom: "4px" }}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
        <Bar dataKey="Arrecadação" fill="#16794C" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Bar dataKey="Gastos" fill="#C42B22" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
