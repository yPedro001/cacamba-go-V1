"use client"
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, CheckCircle2, Truck, X, Trash, Edit, Receipt } from 'lucide-react'
import { useAppStore, useClientes, useLocacoes, useCacambas, useNotificacoes, useConfiguracoes, usePerfil } from '@/store/useAppStore'
import { Locacao, MetodoPagamento, Cliente } from '@/core/domain/types'
import { ReciboModal } from '@/components/ReciboModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { LocacaoModal } from '@/features/rentals/components/LocacaoModal'
import { getClientName } from '@/lib/business-utils'
import { useSearchParams } from 'next/navigation'
import { useDataActions } from '@/core/application/useDataActions'
import { useRentalsController } from '@/features/rentals/hooks/useRentalsController'

const labelMetodo: Record<MetodoPagamento, string> = {
  pix: 'PIX',
  debito: 'Débito',
  credito: 'Crédito',
  boleto: 'Boleto',
}

const badgeMetodo: Record<MetodoPagamento, string> = {
  pix: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  debito: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  credito: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  boleto: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export default function AlugueisPage() {
  const clientes = useClientes()
  const locacoes = useLocacoes()
  const cacambas = useCacambas()
  const notificacoes = useNotificacoes()
  const configuracoes = useConfiguracoes()
  const perfil = usePerfil()
  const { addLocacao, updateLocacao, removeLocacao, advanceRentalStatus, addCliente, updateCliente } = useDataActions()
  const [filter, setFilter] = useState<'todos' | 'entrega_pendente' | 'em_uso' | 'vencida' | 'pago'>('todos')
  
  // Capturando search params de forma segura
  const searchParams = useSearchParams()
  const highlightId = searchParams ? searchParams.get('highlightId') : null

  const rentals = useRentalsController();

  const [reciboLocacao, setReciboLocacao] = useState<Locacao | null>(null)
  
  // Estado para exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [locacaoIdToDelete, setLocacaoIdToDelete] = useState<string | null>(null)

  const handleOpenModal = (locacao?: Locacao) => {
    rentals.handleOpenModal(locacao);
  }

  const handleDelete = (id: string) => {
    if (configuracoes.pularConfirmacaoExclusao) {
      removeLocacao(id)
    } else {
      setLocacaoIdToDelete(id)
      setIsDeleteModalOpen(true)
    }
  }

  const confirmDelete = () => {
    if (locacaoIdToDelete) {
      removeLocacao(locacaoIdToDelete)
      setLocacaoIdToDelete(null)
      setIsDeleteModalOpen(false)
    }
  }

  const usaTaxa = rentals.editingLocacao?.metodoPagamento === 'credito' || rentals.editingLocacao?.metodoPagamento === 'debito'

  const filteredLocacoes = locacoes
    .filter(l => filter === 'todos' ? true : l.status === filter)
    .sort((a, b) => b.dataRetirada.localeCompare(a.dataRetirada));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entrega_pendente': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Entrega Pendente</Badge>
      case 'em_uso': return <Badge variant="warning" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Em Uso</Badge>
      case 'vencida': return <Badge variant="destructive">Vencida/Retirar</Badge>
      case 'pago': return <Badge variant="success">Pago</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Locações</h2>
        <Button onClick={() => handleOpenModal()} className="bg-accent hover:bg-accent-dark text-white font-semibold">
          <Plus className="h-4 w-4 mr-2" /> Nova Locação
        </Button>
      </div>

      <div className="flex gap-2 pb-4 overflow-x-auto">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'entrega_pendente', label: 'Entrega Pendente', hover: 'hover:bg-blue-500/10 hover:text-blue-500' },
          { key: 'em_uso', label: 'Em Uso', hover: 'hover:bg-amber-500/10 hover:text-amber-500' },
          { key: 'vencida', label: 'Vencida/Retirar', hover: 'hover:bg-red-500/10 hover:text-red-500' },
          { key: 'pago', label: 'Pago', hover: 'hover:bg-green-500/10 hover:text-green-500' },
        ].map(f => (
          <Button key={f.key} onClick={() => setFilter(f.key as any)} variant={filter === f.key ? 'default' : 'outline'}
            className={`whitespace-nowrap rounded-full ${f.hover || ''}`}>{f.label}</Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico e Ativos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Qtd. Caçambas</TableHead>
                <TableHead>Local da Obra</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Datas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocacoes.map((locacao) => (
                <TableRow key={locacao.id} className={locacao.id === highlightId ? 'bg-accent/20 border-2 border-accent animate-[pulse_2s_ease-in-out_3]' : ''}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{getClientName(locacao.clienteId, clientes)}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent font-bold text-sm">
                      {locacao.quantidadeCacambas ?? 1}
                    </span>
                  </TableCell>
                  <TableCell className="truncate max-w-[200px] text-muted-foreground whitespace-nowrap" title={locacao.enderecoObra}>{locacao.enderecoObra}</TableCell>
                  <TableCell>
                    <div className="font-semibold">R$ {Number(locacao.valor).toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    {locacao.metodoPagamento ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeMetodo[locacao.metodoPagamento]}`}>
                        {labelMetodo[locacao.metodoPagamento]}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">Início: {new Date(locacao.dataRetirada + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-muted-foreground">Fim: {locacao.dataDevolucaoPrevista ? new Date(locacao.dataDevolucaoPrevista + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(locacao.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 items-center">
                      {locacao.status !== 'pago' && (
                        <Button 
                          onClick={() => advanceRentalStatus(locacao.id!)} 
                          variant="outline" 
                          size="sm"
                          className={`h-8 font-bold border-2 transition-all active:scale-95 ${
                            locacao.status === 'entrega_pendente' ? 'text-blue-500 border-blue-200 hover:bg-blue-500 hover:text-white' :
                            locacao.status === 'em_uso' ? 'text-amber-500 border-amber-200 hover:bg-amber-500 hover:text-white' :
                            'text-green-600 border-green-200 hover:bg-green-600 hover:text-white'
                          }`}
                          title="Avançar para próximo estágio"
                        >
                          {locacao.status === 'entrega_pendente' && <><Truck className="h-3.5 w-3.5 mr-1" /> Confirmar Entrega</>}
                          {locacao.status === 'em_uso' && <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar Vencimento</>}
                          {locacao.status === 'vencida' && <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Receber Pagamento</>}
                        </Button>
                      )}
                      <Button onClick={() => setReciboLocacao(locacao)} variant="ghost" size="icon"
                        className="h-8 w-8 text-accent hover:bg-accent/10" title="Ver Recibo">
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleOpenModal(locacao)} variant="ghost" size="icon"
                        className="h-8 w-8 text-blue-500 hover:bg-blue-500/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(locacao.id!)} variant="ghost" size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLocacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Nenhuma locação encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LocacaoModal 
        isOpen={rentals.isModalOpen} 
        onClose={rentals.handleCloseModal} 
        locacao={rentals.editingLocacao} 
        onSave={rentals.handleSave} 
        onAddClienteAndSave={rentals.handleAddClienteAndSave}
        clientes={clientes}
        perfil={perfil}
        cacambas={cacambas}
      />
      {reciboLocacao && <ReciboModal locacao={reciboLocacao} onClose={() => setReciboLocacao(null)} />}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Locação"
        description="Tem certeza que deseja excluir esta locação? Esta ação não poderá ser desfeita e os dados financeiros associados serão removidos."
      />
    </div>
  )
}
