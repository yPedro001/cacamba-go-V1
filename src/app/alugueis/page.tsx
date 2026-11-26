'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, CheckCircle2, Truck, Trash2, Edit, Receipt, MapPin } from 'lucide-react';
import { useClientes, useLocacoes, useCacambas, useConfiguracoes, usePerfil } from '@/store/useAppStore';
import { Locacao, MetodoPagamento } from '@/core/domain/types';
import { isLocacaoEncerrada } from '@/core/domain/business-logic';
import { ReciboModal } from '@/components/ReciboModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LocacaoModalWithGuard } from '@/features/rentals';
import { getClientName } from '@/lib/business-utils';
import { formatLocalDateBR } from '@/lib/domain-helpers';
import { useSearchParams } from 'next/navigation';
import { useDataActions } from '@/core/application/useDataActions';
import { notify } from '@/lib/notificationService';
import { cn } from '@/lib/utils';

const labelMetodo: Record<MetodoPagamento, string> = {
  pix: 'PIX',
  debito: 'Débito',
  credito: 'Crédito',
  boleto: 'Boleto',
};

const badgeMetodo: Record<MetodoPagamento, string> = {
  pix: 'bg-info/15 text-info border-info/30',
  debito: 'bg-success/15 text-success border-success/30',
  credito: 'bg-warning/15 text-warning border-warning/30',
  boleto: 'bg-muted text-muted-foreground border-border',
};

function getStatusBadge(status: Locacao['status']) {
  switch (status) {
    case 'entrega_pendente':
      return <Badge variant="info">Entrega Pendente</Badge>;
    case 'em_uso':
      return <Badge variant="warning">Em Uso</Badge>;
    case 'vencida':
      return <Badge variant="destructive">Vencida / Retirar</Badge>;
    case 'pago':
      return <Badge variant="success">Pago</Badge>;
    case 'concluida':
      return <Badge variant="success">Concluída</Badge>;
    case 'cancelada':
      return <Badge variant="secondary">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AlugueisPage() {
  const clientes = useClientes();
  const locacoes = useLocacoes();
  const cacambas = useCacambas();
  const configuracoes = useConfiguracoes();
  const perfil = usePerfil();
  const { removeLocacao, advanceRentalStatus } = useDataActions();

  const [filter, setFilter] = useState<'todos' | 'entrega_pendente' | 'em_uso' | 'vencida' | 'pago'>('todos');
  const searchParams = useSearchParams();
  const highlightId = searchParams ? searchParams.get('highlightId') : null;

  const [reciboLocacao, setReciboLocacao] = useState<Locacao | null>(null);
  const [locacaoModalState, setLocacaoModalState] = useState<Partial<Locacao> | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locacaoIdToDelete, setLocacaoIdToDelete] = useState<string | null>(null);

  const cacambaMap = useMemo(() => {
    const map = new Map<string, string>();
    cacambas.forEach((c) => map.set(c.id, c.codigo));
    return map;
  }, [cacambas]);

  const getCacambasLabel = (loc: Locacao) => {
    const ids = loc.cacambaIds?.length ? loc.cacambaIds : loc.cacambaId ? [loc.cacambaId] : [];
    const codes = ids.map((id) => cacambaMap.get(id)).filter(Boolean) as string[];
    if (codes.length > 0) return codes.join(', ');
    return `${loc.quantidadeCacambas ?? 1} un.`;
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    if (configuracoes.pularConfirmacaoExclusao) {
      removeLocacao(id);
      notify.success('Locação excluída.');
    } else {
      setLocacaoIdToDelete(id);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (locacaoIdToDelete) {
      removeLocacao(locacaoIdToDelete);
      setLocacaoIdToDelete(null);
      setIsDeleteModalOpen(false);
      notify.success('Locação excluída.');
    }
  };

  const filteredLocacoes = useMemo(() => {
    return [...locacoes]
      .filter((l) => (filter === 'todos' ? true : l.status === filter))
      .sort((a, b) => (b.dataRetirada || '').localeCompare(a.dataRetirada || ''));
  }, [locacoes, filter]);

  const renderAdvanceButton = (loc: Locacao, fullWidth = false) => {
    if (isLocacaoEncerrada(loc.status)) return null;
    const label =
      loc.status === 'entrega_pendente'
        ? 'Confirmar Entrega'
        : loc.status === 'em_uso'
          ? 'Marcar Vencida'
          : 'Receber Pagamento';

    return (
      <Button
        type="button"
        disabled={!loc.id}
        onClick={() => {
          if (loc.id) advanceRentalStatus(loc.id);
        }}
        variant="outline"
        size="sm"
        className={cn(
          'min-h-[40px] md:min-h-[34px] font-semibold whitespace-nowrap',
          fullWidth && 'w-full',
          loc.status === 'entrega_pendente'
            ? 'text-info border-info/30 hover:bg-info hover:text-white'
            : loc.status === 'em_uso'
              ? 'text-warning border-warning/30 hover:bg-warning hover:text-stone-950'
              : 'text-success border-success/30 hover:bg-success hover:text-white'
        )}
      >
        {loc.status === 'entrega_pendente' ? (
          <Truck className="h-3.5 w-3.5 mr-1.5" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        )}
        {label}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Locações</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Controle de entregas, caçambas em obra, vencimentos e recebimentos.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setLocacaoModalState({})}
          className="min-h-[44px] w-full sm:w-auto whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Locação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 pb-1 overflow-x-auto">
        {[
          { key: 'todos' as const, label: `Todos (${locacoes.length})` },
          { key: 'entrega_pendente' as const, label: 'Entrega Pendente' },
          { key: 'em_uso' as const, label: 'Em Uso' },
          { key: 'vencida' as const, label: 'Vencida / Retirar' },
          { key: 'pago' as const, label: 'Pagos' },
        ].map((f) => (
          <Button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            variant={filter === f.key ? 'default' : 'outline'}
            className="min-h-[40px] whitespace-nowrap rounded-lg shrink-0"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Lista Mobile */}
      <div className="space-y-3 md:hidden">
        {filteredLocacoes.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma locação encontrada neste filtro.
          </Card>
        ) : (
          filteredLocacoes.map((locacao) => (
            <Card
              key={locacao.id}
              className={cn(
                'p-4 space-y-3',
                locacao.id === highlightId && 'border-2 border-primary bg-primary/5'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {getClientName(locacao.clienteId, clientes)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {getCacambasLabel(locacao)}
                  </p>
                </div>
                {getStatusBadge(locacao.status)}
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{locacao.enderecoObra || 'Endereço não informado'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block">Período</span>
                  <span className="font-medium tabular-nums">
                    {formatLocalDateBR(locacao.dataRetirada)} → {formatLocalDateBR(locacao.dataDevolucaoPrevista)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block">Valor</span>
                  <span className="font-bold text-foreground tabular-nums">
                    R$ {(Number(locacao.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {renderAdvanceButton(locacao, true)}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocacaoModalState(locacao)}
                    className="min-h-[44px]"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReciboLocacao(locacao)}
                    className="min-h-[44px]"
                  >
                    <Receipt className="h-4 w-4 mr-1" />
                    Recibo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDelete(locacao.id)}
                    className="min-h-[44px] text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Tabela Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-base">Contratos e Locações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Caçamba(s)</TableHead>
                <TableHead>Local da Obra</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Datas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocacoes.map((locacao) => (
                <TableRow
                  key={locacao.id}
                  className={locacao.id === highlightId ? 'bg-primary/10' : ''}
                >
                  <TableCell className="font-semibold text-foreground">
                    {getClientName(locacao.clienteId, clientes)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground">
                      {getCacambasLabel(locacao)}
                    </span>
                  </TableCell>
                  <TableCell
                    className="truncate max-w-[200px] text-muted-foreground text-xs"
                    title={locacao.enderecoObra}
                  >
                    {locacao.enderecoObra}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    R$ {(Number(locacao.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {locacao.metodoPagamento ? (
                      <span
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full border',
                          badgeMetodo[locacao.metodoPagamento] || 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        {labelMetodo[locacao.metodoPagamento] || locacao.metodoPagamento}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    <div>Entrega: {formatLocalDateBR(locacao.dataRetirada)}</div>
                    <div className="text-muted-foreground">
                      Prevista: {formatLocalDateBR(locacao.dataDevolucaoPrevista)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(locacao.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 items-center">
                      {renderAdvanceButton(locacao)}
                      <Button
                        type="button"
                        onClick={() => setReciboLocacao(locacao)}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-primary hover:bg-primary/10"
                        title="Recibo"
                        aria-label="Gerar recibo"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setLocacaoModalState(locacao)}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-info hover:bg-info/10"
                        title="Editar locação"
                        aria-label="Editar locação"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDelete(locacao.id)}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                        title="Excluir locação"
                        aria-label="Excluir locação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLocacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma locação encontrada neste filtro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Instância única de Modal de Locação (criação e edição) */}
      <LocacaoModalWithGuard
        clientes={clientes}
        perfil={perfil}
        cacambas={cacambas}
        locacaoParaEditar={locacaoModalState}
        onOpenModal={setLocacaoModalState}
      />

      {reciboLocacao && (
        <ReciboModal locacao={reciboLocacao} onClose={() => setReciboLocacao(null)} />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Locação"
        description="Tem certeza que deseja excluir esta locação? Os dados financeiros associados serão removidos permanentemente."
        variant="destructive"
      />
    </div>
  );
}
