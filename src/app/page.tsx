"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TruckIcon, AlertCircle, TrendingUp, Clock, CalendarDays, Map as MapIcon, ArrowUpRight, Activity } from "lucide-react"
import { useCacambas, useLocacoes, useGastos, useClientes } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { useRentalsController } from '@/features/rentals/hooks/useRentalsController'


const DashboardChart = dynamic(() => import('@/components/DashboardChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse">Carregando métricas...</div>,
})

export default function Dashboard() {
  const router = useRouter()
  const cacambas = useCacambas()
  const locacoes = useLocacoes()
  const gastos = useGastos()
  const clientes = useClientes()
  const [mounted, setMounted] = useState(false)

  const { 
    inadimplentesValor, 
    arrecadado, 
    receitaEsperada, 
    acoes 
  } = useRentalsController()

  const currentMonthPeriod = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"
  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'short' }); 
  
  const fluxoCorrente = React.useMemo(() => {
    // 1. Arrecadação Corrente (Apenas status pago/concluida E do mês atual)
    const arrecadacaoAtual = locacoes
      .filter(l => (l.status === 'pago' || l.status === 'concluida') && l.dataRetirada.startsWith(currentMonthPeriod))
      .reduce((acc, curr) => acc + curr.valor, 0);
    
    // 2. Gastos Correntes (Apenas gastos lançados no mês atual)
    const gastosAtuais = gastos
      .filter(g => g.data.startsWith(currentMonthPeriod))
      .reduce((acc, curr) => acc + curr.valor, 0);

    return { arrecadacaoAtual, gastosAtuais, label: `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} (Atual)` };
  }, [locacoes, gastos, currentMonthPeriod, currentMonthName]);

  const stats = React.useMemo(() => {
    const total = cacambas.length
    const uso = cacambas.filter(c => c.status === 'locada' || c.status === 'vencida').length
    const disponivel = cacambas.filter(c => c.status === 'disponivel').length
    const percent = total > 0 ? Math.round((uso / total) * 100) : 0

    const gastosTotais = gastos.reduce((acc, curr) => acc + curr.valor, 0)

    const proximosVencimentos = [...locacoes]
      .filter(l => l.status === 'em_uso' || l.status === 'entrega_pendente')
      .sort((a, b) => new Date(a.dataDevolucaoPrevista).getTime() - new Date(b.dataDevolucaoPrevista).getTime())
      .slice(0, 5)

    const locacoesRecentes = [...locacoes]
      .reverse()
      .slice(0, 5)

    return {
      total, emUso: uso, disponivel, percent,
      inadimplentesValor, atrasadasCount: acoes.retiradas,
      arrecadado, gastosTotais, receitaEsperada,
      acoes, proximosVencimentos, locacoesRecentes
    }
  }, [cacambas, gastos, locacoes, inadimplentesValor, arrecadado, receitaEsperada, acoes])

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null;

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">

      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-2">
          {/* Texto do título usa foreground para garantir contraste em qualquer tema */}
          <h2 className="text-5xl font-black tracking-tighter text-foreground italic leading-none">
            Dashboard <span className="text-accent">Operacional</span>
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sistemas Ativos &amp; Monitoramento Global
          </p>
        </div>
        
        {/* QUICK ACTION BAR */}
        <div className="flex items-center gap-4 bg-card p-2 rounded-[24px] border border-border shadow-2xl">
          <Button 
            onClick={() => router.push('/mapa')} 
            variant="ghost"
            className="h-11 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 font-bold text-[10px] uppercase tracking-widest"
          >
            <MapIcon size={16} className="mr-2" /> Central de Mapa
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button 
            onClick={() => router.push('/alugueis')} 
            className="h-11 px-8 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_30px_-5px_rgba(99,102,241,0.4)] transition-all active:scale-95 italic"
          >
            <Plus size={16} className="mr-2" /> Abrir Locação
          </Button>
        </div>
      </div>

      {/* TOP KPI GRID - ULTRA PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Capacidade Card — superfície escura intencional, sempre dark */}
        <Card className="relative overflow-hidden group border-none bg-slate-900 dark:bg-slate-900 text-white p-8 rounded-[40px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[80px] pointer-events-none group-hover:bg-accent/20 transition-all duration-700" />
          <div className="relative space-y-6">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                <TruckIcon size={24} className="text-accent" />
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                <Activity size={10} className="animate-spin-slow" /> Frota Ativa
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">OCUPAÇÃO ATUAL</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black tracking-tighter italic text-white">{stats.emUso}</span>
                <span className="text-lg font-bold text-slate-400">/ {stats.total}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-indigo-400 transition-all duration-1500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                  style={{ width: `${stats.percent}%` }} 
                />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stats.percent}% Capacidade operacional utilizada</p>
            </div>
          </div>
        </Card>

        {/* Financeiro Arrecadado — superfície adaptativa */}
        <Card className="relative overflow-hidden group border border-border bg-card shadow-xl p-8 rounded-[40px] transition-all hover:-translate-y-2">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] pointer-events-none" />
          <div className="relative space-y-6">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10 shadow-inner">
                <TrendingUp size={24} className="text-emerald-500" />
              </div>
              <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <ArrowUpRight size={10} /> Em Alta
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 font-mono">RECEITA OPERACIONAL</p>
              <div className="text-4xl font-black tracking-tighter tabular-nums text-foreground">
                R$ {stats.arrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               Consolidado no período
            </p>
          </div>
        </Card>

        {/* Pendências — superfície adaptativa com acento vermelho */}
        <Card className="relative overflow-hidden group border border-red-500/20 bg-card shadow-xl p-8 rounded-[40px] transition-all hover:-translate-y-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-500/5 blur-[80px] pointer-events-none" />
          <div className="relative space-y-6">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/10 shadow-inner">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <div className="flex items-center gap-2 text-red-500 text-[9px] font-black uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 animate-pulse">
                Risco Crítico
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 font-mono">VALORES PENDENTES</p>
              <div className="text-4xl font-black tracking-tighter tabular-nums text-red-500">
                R$ {stats.inadimplentesValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">{stats.atrasadasCount} Contratos com atraso</p>
          </div>
        </Card>

        {/* Projeção de Faturamento — superfície accent (texto branco fixo é correto aqui) */}
        <Card 
          className="relative overflow-hidden group bg-accent border-none p-8 rounded-[40px] shadow-[0_40px_80px_-15px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-2 cursor-pointer" 
          onClick={() => router.push('/relatorios')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <div className="relative space-y-6 text-white">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-white/20 rounded-2xl border border-white/30 shadow-inner">
                <TrendingUp size={24} />
              </div>
              <div className="flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                Previsão Mensal
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2 font-mono italic">ESTIMATIVA DE CAIXA</p>
              <div className="text-4xl font-black tracking-tighter tabular-nums">
                R$ {stats.receitaEsperada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/80">
               Explorar detalhes <ArrowUpRight size={14} />
            </div>
          </div>
        </Card>
      </div>

      {/* DASHBOARD MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Ações Pendentes — superfície escura premium intencional, texto branco próprio */}
        <Card className="lg:col-span-1 border-none bg-slate-900 text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 text-white/[0.02] rotate-12 pointer-events-none">
            <TruckIcon size={400} />
          </div>
          
          <div className="relative h-full flex flex-col space-y-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4 text-white">
                <span className="w-2 h-8 bg-accent rounded-full" />
                Painel Logístico
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 ml-1">Prioridades do dia</p>
            </div>

            <div className="space-y-5 flex-1">
               <div onClick={() => router.push('/mapa?filtro=azul')} className="group/item flex items-center justify-between p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/10 shadow-inner">
                        <TruckIcon size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Agendamentos</p>
                        <p className="text-2xl font-black text-white italic">{stats.acoes.entregas}</p>
                     </div>
                  </div>
                  <ArrowUpRight size={20} className="text-slate-600 group-hover/item:text-white transition-all transform group-hover/item:translate-x-1 group-hover/item:-translate-y-1" />
               </div>

               <div onClick={() => router.push('/mapa?filtro=vermelho')} className="group/item flex items-center justify-between p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/10 shadow-inner">
                        <Clock size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expirando Hoje</p>
                        <p className="text-2xl font-black text-white italic">{stats.acoes.retiradas}</p>
                     </div>
                  </div>
                  <ArrowUpRight size={20} className="text-slate-600 group-hover/item:text-white transition-all transform group-hover/item:translate-x-1 group-hover/item:-translate-y-1" />
               </div>

               <div onClick={() => router.push('/relatorios')} className="group/item flex items-center justify-between p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10 shadow-inner">
                        <AlertCircle size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inadimplentes</p>
                        <p className="text-2xl font-black text-white italic">{stats.acoes.financeiro}</p>
                     </div>
                  </div>
                  <ArrowUpRight size={20} className="text-slate-600 group-hover/item:text-white transition-all transform group-hover/item:translate-x-1 group-hover/item:-translate-y-1" />
               </div>
            </div>

            <Button 
              onClick={() => router.push('/relatorios')}
              className="w-full h-14 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] transition-all active:scale-95 italic"
            >
              Monitoramento Completo
            </Button>
          </div>
        </Card>

        {/* Fluxo de Caixa — Mês Corrente Estritamente */}
        <Card className="lg:col-span-2 border border-border bg-card text-card-foreground rounded-[40px] overflow-hidden shadow-2xl flex flex-col p-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-4 text-card-foreground">
                <TrendingUp className="text-emerald-500" /> Fluxo de Caixa
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] mt-3 ml-1">Análise Operacional do Mês Vigente</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-accent" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Arrecadação</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-slate-400" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Gastos</span>
               </div>
            </div>
          </div>
          <div className="flex-1 min-h-[400px]">
             <DashboardChart data={[
               { name: fluxoCorrente.label, Arrecadação: fluxoCorrente.arrecadacaoAtual, Gastos: fluxoCorrente.gastosAtuais }
             ]} />
          </div>
        </Card>
      </div>

      {/* BOTTOM HISTORIC SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[32px] border border-border bg-card shadow-xl overflow-hidden group">
          <CardHeader className="bg-muted/30 p-6 border-b border-border">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Vencimentos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.proximosVencimentos.length === 0 ? (
               <div className="p-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Nada pendente</div>
            ) : (
              <div className="divide-y divide-border">
                {stats.proximosVencimentos.map(loc => {
                   const cliente = clientes.find(c => c.id === loc.clienteId)
                   return (
                    <div key={loc.id} className="p-5 flex justify-between items-center transition-all hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-black text-xs text-muted-foreground">
                          {cliente?.nome?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight text-foreground line-clamp-1">{cliente?.nome || '—'}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Retirada: {new Date(loc.dataDevolucaoPrevista).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em]",
                        loc.status === 'em_uso' ? "bg-amber-400/10 text-amber-600 dark:text-amber-400" : "bg-blue-400/10 text-blue-600 dark:text-blue-400"
                      )}>
                        {loc.status === 'em_uso' ? 'Em Uso' : 'Pendente'}
                      </div>
                    </div>
                   )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border border-border bg-card shadow-xl overflow-hidden group">
          <CardHeader className="bg-muted/30 p-6 border-b border-border">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" /> Locações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.locacoesRecentes.length === 0 ? (
               <div className="p-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Inicie um contrato</div>
            ) : (
              <div className="divide-y divide-border">
                {stats.locacoesRecentes.map(loc => {
                   const cliente = clientes.find(c => c.id === loc.clienteId)
                   return (
                    <div key={loc.id} className="p-5 flex justify-between items-center transition-all hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center font-black text-xs text-accent">
                          {cliente?.nome?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight text-foreground line-clamp-1">{cliente?.nome || '—'}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Registrado em {new Date(loc.dataRetirada).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="font-black text-sm text-emerald-500 block tabular-nums">R$ {loc.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                      </div>
                    </div>
                   )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
