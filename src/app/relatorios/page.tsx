"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Plus, Trash, TrendingUp, TrendingDown, DollarSign, CreditCard, BarChart3, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts'
import { useAppStore, useLocacoes, useGastos, useClientes, useConfiguracoes } from '@/store/useAppStore'
import { useDataActions } from '@/core/application/useDataActions'
import { exportService } from '@/infrastructure/services/export-service'
import { ConfirmModal } from '@/components/ConfirmModal'
import { getClientName, MESES_ABREV } from '@/lib/business-utils'

type PeriodoFiltro = '7d' | '30d' | '90d' | '1a' | 'custom'
type SerieKey = 'bruto' | 'liquido' | 'taxas' | 'gastos'

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm min-w-[180px]">
        <p className="font-bold mb-2 text-foreground">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-semibold text-foreground">R$ {Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function RelatoriosPage() {
  // Gastos
  const locacoes = useLocacoes()
  const gastos = useGastos()
  const clientes = useClientes()
  const configuracoes = useConfiguracoes()
  const { addGasto, removeGasto } = useDataActions()
  const [activeTab, setActiveTab] = useState('visao-geral')
  const [mounted, setMounted] = useState(false)

  // Filtros do gráfico
  const [periodoBotao, setPeriodoBotao] = useState<PeriodoFiltro>('30d')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [seriesAtivas, setSeriesAtivas] = useState<SerieKey[]>(['bruto', 'liquido', 'taxas', 'gastos'])
  const [barSelecionada, setBarSelecionada] = useState<string | null>(null)

  // Gastos
  const [novaData, setNovaData] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('Manutenção')
  const [novoValor, setNovoValor] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')

  // Estado para exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [gastoIdToDelete, setGastoIdToDelete] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const hoje = new Date()
    const fim = hoje.toISOString().split('T')[0]
    const ini = new Date(hoje)
    ini.setDate(ini.getDate() - 30)
    const iniStr = ini.toISOString().split('T')[0]
    setDataFim(fim)
    setDataInicio(iniStr)
    setNovaData(fim)
  }, [])

  const handlePeriodoBotao = (p: PeriodoFiltro) => {
    setPeriodoBotao(p)
    setBarSelecionada(null)
    if (p === 'custom') return
    const hoje = new Date()
    const fim = hoje.toISOString().split('T')[0]
    const ini = new Date(hoje)
    if (p === '7d') ini.setDate(ini.getDate() - 7)
    else if (p === '30d') ini.setDate(ini.getDate() - 30)
    else if (p === '90d') ini.setDate(ini.getDate() - 90)
    else if (p === '1a') ini.setFullYear(ini.getFullYear() - 1)
    setDataInicio(ini.toISOString().split('T')[0])
    setDataFim(fim)
  }

  if (!mounted) return <div className="p-8 text-center text-muted-foreground">Carregando relatórios...</div>

  // Locações filtradas pelo período
  const locacoesReceita = locacoes.filter(l => {
    if (l.status !== 'pago' && l.status !== 'concluida') return false
    if (dataInicio && l.dataRetirada < dataInicio) return false
    if (dataFim && l.dataRetirada > dataFim) return false
    return true
  })

  const faturamentoBruto = locacoesReceita.reduce((acc, l) => acc + (l.valor ?? 0), 0)
  const totalTaxas = locacoesReceita.reduce((acc, l) => acc + (l.valorTaxa ?? 0), 0)
  const faturamentoLiquido = locacoesReceita.reduce((acc, l) => acc + (l.valorLiquido ?? l.valor ?? 0), 0)
  const gastosTotais = gastos.reduce((acc, g) => acc + g.valor, 0)
  const lucroLiquido = faturamentoLiquido - gastosTotais

  // Agrupamento por mês
  const mesesMap: Record<string, { name: string; Bruto: number; Líquido: number; Taxas: number; Gastos: number; count: number }> = {}
  locacoesReceita.forEach(l => {
    const [ano, mes] = l.dataRetirada.split('-')
    const label = `${MESES_ABREV[parseInt(mes) - 1]}/${ano.slice(2)}`
    const key = `${ano}-${mes}`
    if (!mesesMap[key]) mesesMap[key] = { name: label, Bruto: 0, Líquido: 0, Taxas: 0, Gastos: 0, count: 0 }
    mesesMap[key].Bruto += l.valor ?? 0
    mesesMap[key].Taxas += l.valorTaxa ?? 0
    mesesMap[key].Líquido += l.valorLiquido ?? l.valor ?? 0
    mesesMap[key].count++
  })

  const gastosFiltrados = gastos.filter(g => {
    if (dataInicio && g.data < dataInicio) return false
    if (dataFim && g.data > dataFim) return false
    return true
  })

  gastosFiltrados.forEach(g => {
    const [ano, mes] = g.data.split('-')
    const label = `${MESES_ABREV[parseInt(mes) - 1]}/${ano.slice(2)}`
    const key = `${ano}-${mes}`
    if (!mesesMap[key]) mesesMap[key] = { name: label, Bruto: 0, Líquido: 0, Taxas: 0, Gastos: 0, count: 0 }
    mesesMap[key].Gastos += g.valor
  })

  const dataRelatorio = Object.entries(mesesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)

  if (dataRelatorio.length === 0) {
    const totalGastoFiltrado = gastosFiltrados.reduce((acc, c) => acc + c.valor, 0)
    dataRelatorio.push({ name: 'Período', Bruto: faturamentoBruto, Líquido: faturamentoLiquido, Taxas: totalTaxas, Gastos: totalGastoFiltrado, count: locacoesReceita.length })
  }

  const handleAddGasto = () => {
    if (!novaData || !novoValor || !novaCategoria) {
      alert("Preencha todos os campos do gasto.")
      return
    }
    addGasto({ id: Date.now().toString(), data: novaData, categoria: novaCategoria, valor: parseFloat(novoValor), descricao: novaDescricao || 'Sem descrição' })
    setNovoValor('')
    setNovaDescricao('')
  }

  const handleDeleteGasto = (id: string) => {
    if (configuracoes.pularConfirmacaoExclusao) {
      removeGasto(id)
    } else {
      setGastoIdToDelete(id)
      setIsDeleteModalOpen(true)
    }
  }

  const confirmDeleteGasto = () => {
    if (gastoIdToDelete) {
      removeGasto(gastoIdToDelete)
      setGastoIdToDelete(null)
    }
  }

  const exportExcel = () => {
    // 1. Mapear Entradas (Locações pagas no período)
    const entradasMapped = locacoesReceita.map(l => ({
      data: l.dataRetirada,
      tipo: 'Entrada',
      detalhes: getClientName(l.clienteId, clientes),
      descricao: `Locação: ${l.quantidadeCacambas || 1} caçamba(s) - ${l.metodoPagamento || 'N/A'}`,
      valor: l.valorLiquido ?? l.valor ?? 0
    }))

    // 2. Mapear Saídas (Gastos no período)
    const saidasMapped = gastosFiltrados.map(g => ({
      data: g.data,
      tipo: 'Saída',
      detalhes: g.categoria,
      descricao: g.descricao,
      valor: g.valor
    }))

    // 3. Combinar e Ordenar (mais recente primeiro)
    const allItems = [...entradasMapped, ...saidasMapped].sort((a, b) => b.data.localeCompare(a.data))

    // 4. Exportar via serviço
    exportService.exportExcel({
      title: 'Relatório Financeiro Completo',
      filename: `financeiro_${dataInicio}_a_${dataFim}`,
      headers: ['Data', 'Tipo', 'Cliente / Categoria', 'Descrição', 'Valor'],
      data: allItems.map(item => [
        new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        item.tipo,
        item.detalhes,
        item.descricao,
        `R$ ${item.valor.toFixed(2)}`
      ])
    })
  }

  const toggleSerie = (key: SerieKey | 'all') => {
    if (key === 'all') {
      if (seriesAtivas.length === 4) {
        setSeriesAtivas([])
      } else {
        setSeriesAtivas(['bruto', 'liquido', 'taxas', 'gastos'])
      }
      return
    }

    setSeriesAtivas(prev => 
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

  const isAllActive = seriesAtivas.length === 4

  // Barras visíveis por série selecionada
  const showBruto = seriesAtivas.includes('bruto')
  const showLiquido = seriesAtivas.includes('liquido')
  const showTaxas = seriesAtivas.includes('taxas')
  const showGastos = seriesAtivas.includes('gastos')

  const periodoOpcoes: { key: PeriodoFiltro; label: string }[] = [
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: '90d', label: '3 meses' },
    { key: '1a', label: '1 ano' },
    { key: 'custom', label: 'Personalizado' },
  ]

  const serieOpcoes: { key: SerieKey | 'all'; label: string; color: string }[] = [
    { key: 'all', label: 'Todos', color: '#888' },
    { key: 'bruto', label: 'Bruto', color: '#10b981' },
    { key: 'liquido', label: 'Líquido', color: '#38bdf8' },
    { key: 'taxas', label: 'Taxas', color: '#f59e0b' },
    { key: 'gastos', label: 'Gastos', color: '#ef4444' },
  ]

  const detalhesBarra = barSelecionada
    ? locacoesReceita.filter(l => {
      const [ano, mes] = l.dataRetirada.split('-')
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      return `${meses[parseInt(mes) - 1]}/${ano.slice(2)}` === barSelecionada
    })
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h2>
        <Button onClick={exportExcel} variant="outline"><Download className="h-4 w-4 mr-2" /> Exportar Planilha</Button>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {[{ id: 'visao-geral', label: 'Visão Geral' }, { id: 'orcamento', label: 'Orçamento & Gastos' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 font-semibold text-sm transition-colors ${activeTab === t.id ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'visao-geral' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Cards de Métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Faturamento Bruto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">R$ {faturamentoBruto.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Sem descontar taxas</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-500" /> Taxas de Cartão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">R$ {totalTaxas.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Pago a operadoras</p>
              </CardContent>
            </Card>
            <Card className="border-sky-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-sky-400" /> Faturamento Líquido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-400">R$ {faturamentoLiquido.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Após descontos de taxas</p>
              </CardContent>
            </Card>
            <Card className={lucroLiquido < 0 ? 'border-red-500/20' : 'border-blue-500/20'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Lucro Operacional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${lucroLiquido < 0 ? 'text-red-500' : 'text-blue-500'}`}>R$ {lucroLiquido.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Líquido menos gastos</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Interativo */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Faturamento por Período</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {barSelecionada ? `Detalhes de ${barSelecionada} · Clique em outra barra ou aqui para limpar` : 'Clique em uma coluna para ver os detalhes das locações'}
                    </p>
                  </div>
                  {barSelecionada && (
                    <Button variant="outline" size="sm" onClick={() => setBarSelecionada(null)} className="text-xs">
                      ✕ Limpar seleção
                    </Button>
                  )}
                </div>

                {/* Filtros de Período */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Período:</span>
                  {periodoOpcoes.map(p => (
                    <button key={p.key} onClick={() => handlePeriodoBotao(p.key)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${periodoBotao === p.key ? 'bg-accent text-white border-accent' : 'border-border text-muted-foreground hover:border-accent/50 hover:text-accent'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Inputs de data personalizados */}
                {periodoBotao === 'custom' && (
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">De:</label>
                      <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-8 w-[170px] text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Até:</label>
                      <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-8 w-[170px] text-sm" />
                    </div>
                  </div>
                )}

                {/* Filtros de Series */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground font-medium">Exibir:</span>
                  {serieOpcoes.map(s => {
                    const isActive = s.key === 'all' ? isAllActive : seriesAtivas.includes(s.key as SerieKey)
                    return (
                      <button key={s.key} onClick={() => toggleSerie(s.key)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${isActive ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:border-accent/50'}`}
                        style={isActive ? { backgroundColor: s.color, borderColor: s.color } : {}}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataRelatorio}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  onClick={(data) => {
                    if (data?.activeLabel) {
                      setBarSelecionada(prev => prev === data.activeLabel ? null : data.activeLabel!)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                    wrapperStyle={{ paddingTop: '12px' }}
                  />
                  {showBruto && (
                    <Bar dataKey="Bruto" name="Faturamento Bruto" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {dataRelatorio.map((entry, index) => (
                        <Cell key={index} fill={barSelecionada && barSelecionada !== entry.name ? '#10b98150' : '#10b981'} />
                      ))}
                    </Bar>
                  )}
                  {showLiquido && (
                    <Bar dataKey="Líquido" name="Faturamento Líquido" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {dataRelatorio.map((entry, index) => (
                        <Cell key={index} fill={barSelecionada && barSelecionada !== entry.name ? '#38bdf850' : '#38bdf8'} />
                      ))}
                    </Bar>
                  )}
                  {showTaxas && (
                    <Bar dataKey="Taxas" name="Taxas de Cartão" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {dataRelatorio.map((entry, index) => (
                        <Cell key={index} fill={barSelecionada && barSelecionada !== entry.name ? '#f59e0b50' : '#f59e0b'} />
                      ))}
                    </Bar>
                  )}
                  {showGastos && (
                    <Bar dataKey="Gastos" name="Gastos Operacionais" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {dataRelatorio.map((entry, index) => (
                        <Cell key={index} fill={barSelecionada && barSelecionada !== entry.name ? '#ef444450' : '#ef4444'} />
                      ))}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Painel de detalhes ao clicar na barra */}
          {barSelecionada && detalhesBarra.length > 0 && (
            <Card className="border-accent/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detalhes: {barSelecionada}</CardTitle>
                <p className="text-xs text-muted-foreground">{detalhesBarra.length} locação(ões) neste período</p>
              </CardHeader>
              <CardContent>
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
                    {detalhesBarra.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{getClientName(l.clienteId, clientes)}</TableCell>
                        <TableCell>{l.quantidadeCacambas ?? 1}</TableCell>
                        <TableCell className="capitalize">{l.metodoPagamento ?? '—'}</TableCell>
                        <TableCell className="text-right text-green-500">R$ {(l.valor ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-amber-500">R$ {(l.valorTaxa ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sky-400 font-semibold">R$ {(l.valorLiquido ?? l.valor ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'orcamento' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader><CardTitle>Lançar Novo Gasto</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
                <div className="space-y-1"><label className="text-sm font-medium">Data</label><Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Categoria</label>
                  <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Gasolina / Diesel</option><option>Manutenção</option><option>Impostos</option><option>Taxas Bancárias</option><option>Outro</option>
                  </select>
                </div>
                <div className="space-y-1"><label className="text-sm font-medium">Valor (R$)</label><Input type="number" step="any" value={novoValor} onChange={e => setNovoValor(e.target.value)} placeholder="0.00" /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Descrição</label><Input value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Placa Caminhão..." /></div>
                <Button onClick={handleAddGasto} className="font-semibold bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Histórico de Gastos</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead><TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map(g => (
                    <TableRow key={g.id}>
                      <TableCell>{new Date(g.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{g.categoria}</TableCell>
                      <TableCell>{g.descricao}</TableCell>
                      <TableCell className="text-right text-red-500 font-medium">R$ {g.valor.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleDeleteGasto(g.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {gastos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum gasto lançado.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteGasto}
        title="Excluir Gasto"
        description="Tem certeza que deseja apagar este lançamento de gasto? Esta ação afetará os cálculos de lucro líquido nos relatórios."
      />
    </div>
  )
}
