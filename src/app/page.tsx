"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  TruckIcon,
  AlertCircle,
  TrendingUp,
  Clock,
  CalendarDays,
  Map as MapIcon,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { useCacambas, useLocacoes, useGastos, useClientes } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useRentalsController } from '@/features/rentals/hooks/useRentalsController';
import { formatLocalDateBR } from '@/lib/domain-helpers';

const DashboardChart = dynamic(() => import('@/components/DashboardChart'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground animate-pulse">
      Carregando métricas financeiras...
    </div>
  ),
});

export default function Dashboard() {
  const router = useRouter();
  const cacambas = useCacambas();
  const locacoes = useLocacoes();
  const gastos = useGastos();
  const clientes = useClientes();
  const [mounted, setMounted] = useState(false);

  const {
    inadimplentesValor,
    arrecadado,
    receitaEsperada,
    acoes,
  } = useRentalsController();

  const currentMonthPeriod = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"
  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'short' });

  const fluxoCorrente = useMemo(() => {
    // 1. Arrecadação Corrente (Status pago/concluída E do mês atual, com verificação defensiva)
    const arrecadacaoAtual = locacoes
      .filter(
        (l) =>
          (l.status === 'pago' || l.status === 'concluida') &&
          Boolean(l.dataRetirada && String(l.dataRetirada).startsWith(currentMonthPeriod))
      )
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

    // 2. Gastos Correntes (Gastos lançados no mês atual, defensivo)
    const gastosAtuais = gastos
      .filter((g) => Boolean(g.data && String(g.data).startsWith(currentMonthPeriod)))
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

    return {
      arrecadacaoAtual,
      gastosAtuais,
      label: `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} (Atual)`,
    };
  }, [locacoes, gastos, currentMonthPeriod, currentMonthName]);

  const stats = useMemo(() => {
    const total = cacambas.length;
    const uso = cacambas.filter((c) => c.status === 'locada' || c.status === 'vencida').length;
    const disponivel = cacambas.filter((c) => c.status === 'disponivel').length;
    const percent = total > 0 ? Math.round((uso / total) * 100) : 0;

    const gastosTotais = gastos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

    const proximosVencimentos = [...locacoes]
      .filter((l) => l.status === 'em_uso' || l.status === 'entrega_pendente')
      .sort((a, b) => {
        const tA = a.dataDevolucaoPrevista ? new Date(a.dataDevolucaoPrevista).getTime() : 0;
        const tB = b.dataDevolucaoPrevista ? new Date(b.dataDevolucaoPrevista).getTime() : 0;
        return (Number.isNaN(tA) ? 0 : tA) - (Number.isNaN(tB) ? 0 : tB);
      })
      .slice(0, 5);

    const locacoesRecentes = [...locacoes]
      .slice()
      .reverse()
      .slice(0, 5);

    return {
      total,
      emUso: uso,
      disponivel,
      percent,
      inadimplentesValor: Number(inadimplentesValor) || 0,
      atrasadasCount: acoes?.retiradas || 0,
      arrecadado: Number(arrecadado) || 0,
      gastosTotais,
      receitaEsperada: Number(receitaEsperada) || 0,
      acoes: acoes || { entregas: 0, retiradas: 0, financeiro: 0 },
      proximosVencimentos,
      locacoesRecentes,
    };
  }, [cacambas, gastos, locacoes, inadimplentesValor, arrecadado, receitaEsperada, acoes]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* HEADER OPERACIONAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Visão Geral
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operação Ativa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitoramento de pátio, faturamento corrente e prioridades de rota.
          </p>
        </div>

        {/* BARRA DE AÇÕES RÁPIDAS */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/mapa')}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            <MapIcon className="h-4 w-4 mr-2 text-primary" />
            Mapa
          </Button>
          <Button
            type="button"
            onClick={() => router.push('/alugueis')}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Locação
          </Button>
        </div>
      </div>

      {/* GRADE DE KPIS PRINCIPAIS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacidade do Pátio */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ocupação da Frota
            </span>
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TruckIcon className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-foreground">{stats.emUso}</span>
              <span className="text-sm font-medium text-muted-foreground">/ {stats.total} caçambas</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, stats.percent))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.disponivel} disponíveis no pátio ({stats.percent}% em uso)
            </p>
          </div>
        </Card>

        {/* Receita Realizada */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Receita Realizada
            </span>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums text-foreground">
              R$ {stats.arrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-2">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Consolidado do período
            </p>
          </div>
        </Card>

        {/* Pendências / Em Aberto */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              A Receber / Em Aberto
            </span>
            <div className="h-9 w-9 rounded-lg bg-status-danger-bg border border-destructive/20 flex items-center justify-center text-status-danger-ink">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums text-status-danger-ink">
              R$ {stats.inadimplentesValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.atrasadasCount} locações com devolução vencida
            </p>
          </div>
        </Card>

        {/* Previsão de Faturamento */}
        <Card
          className="p-5 space-y-3 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => router.push('/relatorios')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estimativa de Caixa
            </span>
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums text-foreground">
              R$ {stats.receitaEsperada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-primary font-medium flex items-center gap-1 mt-2">
              Ver relatórios detalhados <ArrowUpRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </Card>
      </div>

      {/* SEÇÃO INTERMEDIÁRIA: PAINEL LOGÍSTICO & FLUXO DE CAIXA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Logístico */}
        <Card className="p-6 flex flex-col justify-between space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Prioridades Operacionais
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ações pendentes na frota para hoje
            </p>
          </div>

          <div className="space-y-3 flex-1">
            <div
              onClick={() => router.push('/mapa?filtro=azul')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/50 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <TruckIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Entregas Pendentes</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{stats.acoes.entregas}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div
              onClick={() => router.push('/mapa?filtro=vermelho')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/50 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Retiradas Vencidas</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{stats.acoes.retiradas}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div
              onClick={() => router.push('/relatorios')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/50 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-status-danger-bg text-status-danger-ink flex items-center justify-center border border-destructive/20">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Cobranças Pendentes</p>
                  <p className="text-xl font-bold text-status-danger-ink tabular-nums">{stats.acoes.financeiro}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/alugueis')}
            className="w-full min-h-[44px]"
          >
            Abrir Gestão de Locações
          </Button>
        </Card>

        {/* Fluxo de Caixa (1 Gráfico Principal Limpo) */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Fluxo Operacional do Mês
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparativo entre arrecadação realizada e despesas
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                Arrecadação
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
                Gastos
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[280px]">
            <DashboardChart
              data={[
                {
                  name: fluxoCorrente.label,
                  Arrecadação: fluxoCorrente.arrecadacaoAtual,
                  Gastos: fluxoCorrente.gastosAtuais,
                },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* SEÇÃO INFERIOR: HISTÓRICO E PRÓXIMOS VENCIMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencimentos Próximos */}
        <Card>
          <CardHeader className="py-4 px-5 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Retiradas &amp; Vencimentos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.proximosVencimentos.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Nenhum contrato vencendo no momento.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.proximosVencimentos.map((loc) => {
                  const cliente = clientes.find((c) => c.id === loc.clienteId);
                  return (
                    <div
                      key={loc.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {cliente?.nome || 'Cliente não identificado'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {loc.enderecoObra || 'Endereço da obra'} · Previsão: {formatLocalDateBR(loc.dataDevolucaoPrevista)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0',
                          loc.status === 'em_uso'
                            ? 'bg-status-warning-bg text-status-warning-ink border border-amber-500/20'
                            : 'bg-status-info-bg text-status-info-ink border border-blue-500/20'
                        )}
                      >
                        {loc.status === 'em_uso' ? 'Em Obra' : 'A Entregar'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Locações Recentes */}
        <Card>
          <CardHeader className="py-4 px-5 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-400" />
              Últimas Locações Registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.locacoesRecentes.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Nenhuma locação registrada. Clique em &ldquo;Nova Locação&rdquo; para iniciar.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.locacoesRecentes.map((loc) => {
                  const cliente = clientes.find((c) => c.id === loc.clienteId);
                  return (
                    <div
                      key={loc.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {cliente?.nome || 'Cliente'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Início: {formatLocalDateBR(loc.dataRetirada)} · {loc.quantidadeCacambas || 1}x caçamba
                        </p>
                      </div>
                      <span className="font-bold text-sm text-emerald-400 tabular-nums shrink-0">
                        R$ {(Number(loc.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
