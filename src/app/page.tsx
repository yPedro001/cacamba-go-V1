"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TruckIcon, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { useCacambas, useLocacoes, useGastos } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { calculateFinancials } from '@/core/domain/business-logic'

const DashboardChart = dynamic(() => import('@/components/DashboardChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-muted-foreground">Carregando gráfico...</div>,
})

export default function Dashboard() {
  const router = useRouter()
  const cacambas = useCacambas()
  const locacoes = useLocacoes()
  const gastos = useGastos()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="p-8 text-center text-muted-foreground">Carregando dashboard corporativo...</div>

  // Business Logic Centralized
  const totalCacambas = cacambas.length
  const emUso = cacambas.filter(c => c.status === 'locada' || c.status === 'vencida').length
  const disponiveis = cacambas.filter(c => c.status === 'disponivel').length
  const percentEmUso = totalCacambas > 0 ? Math.round((emUso / totalCacambas) * 100) : 0

  const hoje = new Date().toISOString().split('T')[0]
  const inadimplentes = locacoes.filter(l => l.status === 'vencida' || (l.status === 'a_pagar' && l.dataRetirada < hoje))
  const inadimplentesValor = inadimplentes.reduce((acc, curr) => acc + curr.valor, 0)
  
  const arrecadacaoTotal = locacoes
    .filter(l => l.status === 'pago' || l.status === 'concluida')
    .reduce((acc, curr) => acc + curr.valor, 0)
    
  const gastosTotais = gastos.reduce((acc, curr) => acc + curr.valor, 0)

  const chartData = [
    { name: 'Geral', Arrecadação: arrecadacaoTotal, Gastos: gastosTotais },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => router.push('/alugueis')} className="font-semibold bg-accent hover:bg-accent-dark text-white shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Novo Aluguel
          </Button>
          <Button onClick={() => router.push('/gerenciamento')} variant="outline" className="font-semibold shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Nova Caçamba
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]" onClick={() => router.push('/gerenciamento')}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Frota</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black">{totalCacambas}</div></CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]" onClick={() => router.push('/alugueis')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Em Operação</CardTitle>
            <TruckIcon className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{emUso}</div>
            <p className="text-[10px] font-bold text-yellow-600 mt-1">{percentEmUso}% de ocupação</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]" onClick={() => router.push('/gerenciamento')}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Disponíveis</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-green-600">{disponiveis}</div></CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]" onClick={() => router.push('/alugueis')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Inadimplência</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-500">R$ {inadimplentesValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">{inadimplentes.length} contratos críticos</p>
          </CardContent>
        </Card>

        <Card className="border-b-4 border-b-green-600 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]" onClick={() => router.push('/relatorios')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-black text-green-600">R$ {arrecadacaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>

        <Card className="border-b-4 border-b-red-600 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]" onClick={() => router.push('/relatorios')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-black text-red-600">R$ {gastosTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-slate-200">
        <CardHeader><CardTitle className="text-lg font-bold">Fluxo de Caixa Acumulado</CardTitle></CardHeader>
        <CardContent className="h-[350px] w-full pt-4">
          <DashboardChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}
