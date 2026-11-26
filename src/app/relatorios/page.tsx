'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Download,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  BarChart3,
  Calendar,
  X,
} from 'lucide-react';
import { useLocacoes, useGastos, useClientes, useConfiguracoes } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { exportService } from '@/infrastructure/services/export-service';
import { ConfirmModal } from '@/components/ConfirmModal';
import { getClientName, MESES_ABREV } from '@/lib/business-utils';
import { isLocacaoReceitaRealizada } from '@/core/domain/business-logic';
import { addDaysLocalISO, formatLocalDateBR, getLocalTodayISO } from '@/lib/domain-helpers';
import { notify } from '@/lib/notificationService';
import { cn } from '@/lib/utils';
import type { RelatorioPontoMensal } from '@/components/RelatoriosChart';

const RelatoriosChart = dynamic(() => import('@/components/RelatoriosChart'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
      Carregando gráfico financeiro...
    </div>
  ),
});

type PeriodoFiltro = '7d' | '30d' | '90d' | '1a' | 'custom';
type SerieKey = 'bruto' | 'liquido' | 'taxas' | 'gastos';

export default function RelatoriosPage() {
  const locacoes = useLocacoes();
  const gastos = useGastos();
  const clientes = useClientes();
  const configuracoes = useConfiguracoes();
  const { addGasto, removeGasto } = useDataActions();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'orcamento'>('visao-geral');

  const [periodoBotao, setPeriodoBotao] = useState<PeriodoFiltro>('30d');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [seriesAtivas, setSeriesAtivas] = useState<SerieKey[]>(['bruto', 'liquido', 'taxas', 'gastos']);
  const [barSelecionada, setBarSelecionada] = useState<string | null>(null);

  const [novaData, setNovaData] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('Manutenção');
  const [novoValor, setNovoValor] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [gastoFormError, setGastoFormError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [gastoIdToDelete, setGastoIdToDelete] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hojeStr = getLocalTodayISO();
    setDataFim(hojeStr);
    setDataInicio(addDaysLocalISO(hojeStr, -30));
    setNovaData(hojeStr);
  }, []);

  const handlePeriodoBotao = (p: PeriodoFiltro) => {
    setPeriodoBotao(p);
    setBarSelecionada(null);
    if (p === 'custom') return;

    const fim = getLocalTodayISO();
    const dias = p === '7d' ? -7 : p === '30d' ? -30 : p === '90d' ? -90 : -365;
    setDataInicio(addDaysLocalISO(fim, dias));
    setDataFim(fim);
  };

  const locacoesReceita = useMemo(() => {
    return locacoes.filter((l) => {
      if (!isLocacaoReceitaRealizada(l.status)) return false;
      const refData = l.dataPagamento || l.dataRetirada;
      if (dataInicio && refData < dataInicio) return false;
      if (dataFim && refData > dataFim) return false;
      return true;
    });
  }, [locacoes, dataInicio, dataFim]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      if (dataInicio && g.data < dataInicio) return false;
      if (dataFim && g.data > dataFim) return false;
      return true;
    });
  }, [gastos, dataInicio, dataFim]);

  const faturamentoBruto = useMemo(
    () => locacoesReceita.reduce((acc, l) => acc + (l.valor ?? 0), 0),
    [locacoesReceita]
  );
  const totalTaxas = useMemo(
    () => locacoesReceita.reduce((acc, l) => acc + (l.valorTaxa ?? 0), 0),
    [locacoesReceita]
  );
  const faturamentoLiquido = useMemo(
    () => locacoesReceita.reduce((acc, l) => acc + (l.valorLiquido ?? l.valor ?? 0), 0),
    [locacoesReceita]
  );
  const gastosDoPeriodo = useMemo(
    () => gastosFiltrados.reduce((acc, g) => acc + g.valor, 0),
    [gastosFiltrados]
  );
  const lucroLiquido = faturamentoLiquido - gastosDoPeriodo;

  const dataRelatorio = useMemo<RelatorioPontoMensal[]>(() => {
    const mesesMap: Record<string, RelatorioPontoMensal> = {};

    locacoesReceita.forEach((l) => {
      const refData = l.dataPagamento || l.dataRetirada;
      const [ano, mes] = refData.split('-');
      const mesIdx = Math.max(0, Math.min(11, parseInt(mes, 10) - 1));
      const label = `${MESES_ABREV[mesIdx]}/${ano.slice(2)}`;
      const key = `${ano}-${mes}`;
      if (!mesesMap[key]) {
        mesesMap[key] = { name: label, Bruto: 0, Líquido: 0, Taxas: 0, Gastos: 0, count: 0 };
      }
      mesesMap[key].Bruto += l.valor ?? 0;
      mesesMap[key].Taxas += l.valorTaxa ?? 0;
      mesesMap[key].Líquido += l.valorLiquido ?? l.valor ?? 0;
      mesesMap[key].count++;
    });

    gastosFiltrados.forEach((g) => {
      const [ano, mes] = g.data.split('-');
      const mesIdx = Math.max(0, Math.min(11, parseInt(mes, 10) - 1));
      const label = `${MESES_ABREV[mesIdx]}/${ano.slice(2)}`;
      const key = `${ano}-${mes}`;
      if (!mesesMap[key]) {
        mesesMap[key] = { name: label, Bruto: 0, Líquido: 0, Taxas: 0, Gastos: 0, count: 0 };
      }
      mesesMap[key].Gastos += g.valor;
    });

    const sorted = Object.entries(mesesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    if (sorted.length === 0) {
      return [
        {
          name: 'Período',
          Bruto: faturamentoBruto,
          Líquido: faturamentoLiquido,
          Taxas: totalTaxas,
          Gastos: gastosDoPeriodo,
          count: locacoesReceita.length,
        },
      ];
    }

    return sorted;
  }, [
    locacoesReceita,
    gastosFiltrados,
    faturamentoBruto,
    faturamentoLiquido,
    totalTaxas,
    gastosDoPeriodo,
  ]);

  const detalhesBarra = useMemo(() => {
    if (!barSelecionada) return [];
    return locacoesReceita.filter((l) => {
      const refData = l.dataPagamento || l.dataRetirada;
      const [ano, mes] = refData.split('-');
      const mesIdx = Math.max(0, Math.min(11, parseInt(mes, 10) - 1));
      return `${MESES_ABREV[mesIdx]}/${ano.slice(2)}` === barSelecionada;
    });
  }, [barSelecionada, locacoesReceita]);

  const gastosOrdenados = useMemo(
    () => [...gastos].sort((a, b) => b.data.localeCompare(a.data)),
    [gastos]
  );

  if (!mounted) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Carregando relatórios...
      </div>
    );
  }

  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    setGastoFormError(null);

    const parsedValor = parseFloat(novoValor.replace(',', '.'));
    if (!novaData || !novaCategoria || !Number.isFinite(parsedValor) || parsedValor <= 0) {
      const msg = 'Informe uma data válida, categoria e um valor maior que zero.';
      setGastoFormError(msg);
      notify.error(msg);
      return;
    }

    addGasto({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      data: novaData,
      categoria: novaCategoria,
      valor: Number(parsedValor.toFixed(2)),
      descricao: novaDescricao.trim() || 'Sem descrição',
    });
    setNovoValor('');
    setNovaDescricao('');
    notify.success('Gasto lançado com sucesso.');
  };

  const handleDeleteGasto = (id: string) => {
    if (configuracoes.pularConfirmacaoExclusao) {
      removeGasto(id);
      notify.success('Gasto removido.');
    } else {
      setGastoIdToDelete(id);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteGasto = () => {
    if (gastoIdToDelete) {
      removeGasto(gastoIdToDelete);
      setGastoIdToDelete(null);
      notify.success('Gasto removido.');
    }
  };

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const entradasMapped = locacoesReceita.map((l) => ({
        data: l.dataPagamento || l.dataRetirada,
        tipo: 'Entrada',
        detalhes: getClientName(l.clienteId, clientes),
        descricao: `Locação: ${l.quantidadeCacambas || 1} caçamba(s) - ${l.metodoPagamento || 'N/A'}`,
        valor: l.valorLiquido ?? l.valor ?? 0,
      }));

      const saidasMapped = gastosFiltrados.map((g) => ({
        data: g.data,
        tipo: 'Saída',
        detalhes: g.categoria,
        descricao: g.descricao,
        valor: g.valor,
      }));

      const allItems = [...entradasMapped, ...saidasMapped].sort((a, b) =>
        b.data.localeCompare(a.data)
      );

      await exportService.exportExcel({
        title: 'Relatório Financeiro Completo',
        filename: `financeiro_${dataInicio || 'inicio'}_a_${dataFim || 'hoje'}`,
        headers: ['Data', 'Tipo', 'Cliente / Categoria', 'Descrição', 'Valor'],
        data: allItems.map((item) => [
          formatLocalDateBR(item.data),
          item.tipo,
          item.detalhes,
          item.descricao,
          `R$ ${item.valor.toFixed(2)}`,
        ]),
      });
      notify.success('Planilha exportada com sucesso.');
    } catch {
      notify.error('Não foi possível exportar a planilha.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSerie = (key: SerieKey | 'all') => {
    if (key === 'all') {
      setSeriesAtivas(seriesAtivas.length === 4 ? [] : ['bruto', 'liquido', 'taxas', 'gastos']);
      return;
    }
    setSeriesAtivas((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const isAllActive = seriesAtivas.length === 4;
  const periodoOpcoes: { key: PeriodoFiltro; label: string }[] = [
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: '90d', label: '3 meses' },
    { key: '1a', label: '1 ano' },
    { key: 'custom', label: 'Personalizado' },
  ];

  const serieOpcoes: { key: SerieKey | 'all'; label: string; color: string }[] = [
    { key: 'all', label: 'Todas', color: '#57534E' },
    { key: 'bruto', label: 'Bruto', color: '#16794C' },
    { key: 'liquido', label: 'Líquido', color: '#1D5FB8' },
    { key: 'taxas', label: 'Taxas', color: '#D98A00' },
    { key: 'gastos', label: 'Gastos', color: '#C42B22' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Relatórios Financeiros</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Entradas confirmadas, taxas de cartão e despesas operacionais do período selecionado.
          </p>
        </div>
        <Button
          type="button"
          onClick={exportExcel}
          disabled={isExporting}
          variant="outline"
          className="min-h-[44px] w-full sm:w-auto whitespace-nowrap"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar Planilha'}
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {[
          { id: 'visao-geral' as const, label: 'Visão Geral' },
          { id: 'orcamento' as const, label: `Gastos (${gastos.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'min-h-[44px] px-4 py-2 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap',
              activeTab === t.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'visao-geral' && (
        <div className="space-y-6">
          {/* 4 KPIs do período filtrado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-success/25">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Faturamento Bruto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success tabular-nums">
                  R$ {faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {locacoesReceita.length} contrato(s) pago(s) no período
                </p>
              </CardContent>
            </Card>

            <Card className="border-warning/25">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-warning" />
                  Taxas de Cartão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning tabular-nums">
                  R$ {totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Descontado nas operadoras</p>
              </CardContent>
            </Card>

            <Card className="border-info/25">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-info" />
                  Faturamento Líquido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info tabular-nums">
                  R$ {faturamentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Receita após taxas</p>
              </CardContent>
            </Card>

            <Card className={lucroLiquido < 0 ? 'border-destructive/30' : 'border-primary/25'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Resultado do Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    lucroLiquido < 0 ? 'text-destructive' : 'text-foreground'
                  )}
                >
                  R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  Gastos filtrados: R$ {gastosDoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico interativo */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Faturamento vs Gastos
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {barSelecionada
                        ? `Exibindo detalhamento de ${barSelecionada}. Clique na barra novamente para fechar.`
                        : 'Clique em uma coluna mensal para detalhar as locações pagas.'}
                    </p>
                  </div>
                  {barSelecionada && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBarSelecionada(null)}
                      className="min-h-[40px] self-start"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar seleção
                    </Button>
                  )}
                </div>

                {/* Filtros de período */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium mr-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Período:
                  </span>
                  {periodoOpcoes.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handlePeriodoBotao(p.key)}
                      className={cn(
                        'min-h-[38px] px-3 py-1 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap',
                        periodoBotao === p.key
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {periodoBotao === 'custom' && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor="rel-data-ini" className="text-xs text-muted-foreground whitespace-nowrap">
                        De:
                      </label>
                      <Input
                        id="rel-data-ini"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="min-h-[44px] text-base sm:text-sm w-full sm:w-[175px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="rel-data-fim" className="text-xs text-muted-foreground whitespace-nowrap">
                        Até:
                      </label>
                      <Input
                        id="rel-data-fim"
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="min-h-[44px] text-base sm:text-sm w-full sm:w-[175px]"
                      />
                    </div>
                  </div>
                )}

                {/* Séries do gráfico */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground font-medium mr-1">Exibir:</span>
                  {serieOpcoes.map((s) => {
                    const isActive =
                      s.key === 'all' ? isAllActive : seriesAtivas.includes(s.key as SerieKey);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleSerie(s.key)}
                        className={cn(
                          'min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap',
                          isActive
                            ? 'text-white border-transparent'
                            : 'bg-background border-border text-muted-foreground hover:text-foreground'
                        )}
                        style={isActive ? { backgroundColor: s.color } : undefined}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[320px] sm:h-[370px] px-2 sm:px-6">
              <RelatoriosChart
                data={dataRelatorio}
                showBruto={seriesAtivas.includes('bruto')}
                showLiquido={seriesAtivas.includes('liquido')}
                showTaxas={seriesAtivas.includes('taxas')}
                showGastos={seriesAtivas.includes('gastos')}
                barSelecionada={barSelecionada}
                onSelectBar={(label) =>
                  setBarSelecionada((prev) => (prev === label ? null : label))
                }
              />
            </CardContent>
          </Card>

          {/* Detalhes da barra clicada */}
          {barSelecionada && detalhesBarra.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detalhamento: {barSelecionada}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {detalhesBarra.length} locação(ões) contabilizada(s) neste mês
                </p>
              </CardHeader>
              <CardContent>
                {/* Mobile Cards */}
                <div className="space-y-3 md:hidden">
                  {detalhesBarra.map((l) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-lg border border-border bg-background space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between gap-2 font-semibold text-foreground">
                        <span className="truncate">{getClientName(l.clienteId, clientes)}</span>
                        <span className="text-info tabular-nums shrink-0">
                          Líq. R$ {(l.valorLiquido ?? l.valor ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span className="capitalize">
                          {l.quantidadeCacambas ?? 1} caç. · {l.metodoPagamento ?? '—'}
                        </span>
                        <span className="tabular-nums">
                          Bruto R$ {(l.valor ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Caçambas</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                        <TableHead className="text-right">Taxa</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalhesBarra.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">
                            {getClientName(l.clienteId, clientes)}
                          </TableCell>
                          <TableCell className="tabular-nums">{l.quantidadeCacambas ?? 1}</TableCell>
                          <TableCell className="capitalize">{l.metodoPagamento ?? '—'}</TableCell>
                          <TableCell className="text-right text-success tabular-nums">
                            R$ {(l.valor ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-warning tabular-nums">
                            R$ {(l.valorTaxa ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-info font-semibold tabular-nums">
                            R$ {(l.valorLiquido ?? l.valor ?? 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'orcamento' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lançar Novo Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleAddGasto}
                className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end"
              >
                <div className="space-y-1">
                  <label htmlFor="gasto-data" className="text-xs font-semibold text-muted-foreground">
                    Data
                  </label>
                  <Input
                    id="gasto-data"
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="min-h-[44px] text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="gasto-cat" className="text-xs font-semibold text-muted-foreground">
                    Categoria
                  </label>
                  <select
                    id="gasto-cat"
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    className="flex min-h-[44px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm"
                  >
                    <option>Gasolina / Diesel</option>
                    <option>Manutenção</option>
                    <option>Descarte / Aterro</option>
                    <option>Impostos</option>
                    <option>Taxas Bancárias</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="gasto-val" className="text-xs font-semibold text-muted-foreground">
                    Valor (R$)
                  </label>
                  <Input
                    id="gasto-val"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={novoValor}
                    onChange={(e) => {
                      setNovoValor(e.target.value);
                      setGastoFormError(null);
                    }}
                    placeholder="0,00"
                    className="min-h-[44px] text-base sm:text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="gasto-desc" className="text-xs font-semibold text-muted-foreground">
                    Descrição
                  </label>
                  <Input
                    id="gasto-desc"
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    placeholder="Ex: Diesel caminhão..."
                    className="min-h-[44px] text-base sm:text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  variant="destructive"
                  className="min-h-[44px] w-full whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Gasto
                </Button>
              </form>
              {gastoFormError && (
                <p className="text-xs text-destructive font-medium mt-2">{gastoFormError}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              {gastosOrdenados.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum gasto lançado ainda.
                </p>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="space-y-3 md:hidden">
                    {gastosOrdenados.map((g) => (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-xl border border-border bg-background flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="tabular-nums">{formatLocalDateBR(g.data)}</span>
                            <span>·</span>
                            <span className="font-semibold text-foreground truncate">{g.categoria}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{g.descricao}</p>
                          <p className="text-sm font-bold text-destructive tabular-nums">
                            R$ {g.valor.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleDeleteGasto(g.id)}
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir gasto"
                          className="min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="w-[60px] text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gastosOrdenados.map((g) => (
                          <TableRow key={g.id}>
                            <TableCell className="tabular-nums">{formatLocalDateBR(g.data)}</TableCell>
                            <TableCell className="font-medium">{g.categoria}</TableCell>
                            <TableCell className="text-muted-foreground">{g.descricao}</TableCell>
                            <TableCell className="text-right text-destructive font-semibold tabular-nums">
                              R$ {g.valor.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                onClick={() => handleDeleteGasto(g.id)}
                                variant="ghost"
                                size="icon"
                                aria-label="Excluir gasto"
                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteGasto}
        title="Excluir Gasto"
        description="Tem certeza que deseja apagar este lançamento de gasto? Os cálculos de lucro nos relatórios serão recalculados."
        variant="destructive"
      />
    </div>
  );
}
