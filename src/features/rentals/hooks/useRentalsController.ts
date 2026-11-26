import { useState, useMemo, useCallback } from 'react';
import { useLocacoes, useClientes, useCacambas } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { isLocacaoEncerrada, isLocacaoReceitaRealizada } from '@/core/domain/business-logic';
import { Locacao, Cliente } from '@/core/domain/types';
import { exportService } from '@/infrastructure/services/export-service';
import { formatLocalDateBR, getLocalTodayISO } from '@/lib/domain-helpers';
import { notify } from '@/lib/notificationService';

function extractCityFromText(raw: string): string {
  if (!raw) return '';
  if (raw.includes(' - ')) {
    const segs = raw.split(' - ');
    return segs[1]?.split(',')[0]?.trim() || '';
  }
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 1].replace(/\d{5}-?\d{3}/, '').trim();
  }
  return '';
}

export function useRentalsController() {
  const clientes = useClientes();
  const locacoes = useLocacoes();
  const cacambas = useCacambas();
  const { addLocacao, updateLocacao, addCliente, updateCliente, addEnderecoAoCliente } = useDataActions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocacao, setEditingLocacao] = useState<Partial<Locacao> | undefined>();

  const hoje = getLocalTodayISO();

  const financialSummary = useMemo(() => {
    const inadimplentes = locacoes.filter((l) => {
      const pendenciaFinanceira = !isLocacaoEncerrada(l.status);
      const dataReferencia = l.dataDevolucaoPrevista || l.dataRetirada;
      const isVencida = l.status === 'vencida' || Boolean(dataReferencia && dataReferencia < hoje);
      return pendenciaFinanceira && isVencida;
    });

    const inadimplentesValor = inadimplentes.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const inadimplentesCount = inadimplentes.length;

    const vencidos = locacoes.filter(
      (l) => l.status === 'pago' && l.dataDevolucaoPrevista && l.dataDevolucaoPrevista < hoje
    );

    const pendentesEntrega = locacoes.filter(
      (l) => l.status === 'entrega_pendente' || l.status === 'a_pagar'
    );

    const arrecadado = locacoes
      .filter((l) => isLocacaoReceitaRealizada(l.status))
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);

    const receitaEsperada = locacoes
      .filter((l) => !isLocacaoEncerrada(l.status))
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);

    const acoes = {
      entregas: locacoes.filter((l) => l.status === 'entrega_pendente').length,
      retiradas: locacoes.filter(
        (l) =>
          !isLocacaoEncerrada(l.status) &&
          (l.status === 'vencida' || Boolean(l.dataDevolucaoPrevista && l.dataDevolucaoPrevista < hoje))
      ).length,
      financeiro: inadimplentesCount,
    };

    return {
      inadimplentes,
      inadimplentesValor,
      vencidos,
      pendentesEntrega,
      arrecadado,
      receitaEsperada,
      acoes,
    };
  }, [locacoes, hoje]);

  const handleOpenModal = useCallback((loc?: Partial<Locacao>) => {
    setEditingLocacao(loc);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLocacao(undefined);
  }, []);

  const handleSave = async (
    data: Partial<Locacao> & { salvarEndereco?: boolean; nomeEndereco?: string; enderecoDetalhes?: any }
  ) => {
    if (!data.id) {
      const disponiveis = cacambas.filter((c) => c.status === 'disponivel');
      const requisitadas = data.quantidadeCacambas || 1;
      if (disponiveis.length < requisitadas) {
        notify.error(`Caçambas insuficientes no pátio. Disponível: ${disponiveis.length}.`);
        return false;
      }
    }

    if (data.salvarEndereco && data.clienteId && data.enderecoObra) {
      const det = data.enderecoDetalhes;
      addEnderecoAoCliente(data.clienteId, {
        nome: data.nomeEndereco || 'Nova Obra',
        rua: det?.road || data.enderecoObra.split(',')[0],
        numero: det?.house_number || data.enderecoObra.split(',')[1]?.split('-')[0]?.trim() || 'S/N',
        cidade: det?.city || det?.town || det?.suburb || extractCityFromText(data.enderecoObra),
        cep: det?.postcode || data.cep || '',
        lat: data.lat,
        lng: data.lng,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { salvarEndereco, nomeEndereco, enderecoDetalhes, ...locacaoParaSalvar } = data;

    if (locacaoParaSalvar.id) {
      updateLocacao(locacaoParaSalvar.id, locacaoParaSalvar);
    } else {
      addLocacao({
        ...locacaoParaSalvar,
        id: crypto.randomUUID(),
        status: locacaoParaSalvar.status || 'entrega_pendente',
      } as Locacao);
    }

    handleCloseModal();
    return true;
  };

  const handleAddClienteAndSave = async (
    clienteData: Partial<Cliente>,
    locacaoData: Partial<Locacao> & { enderecoDetalhes?: any },
    options?: { updateExisting?: boolean; useExistingId?: string }
  ) => {
    let finalClienteId = options?.useExistingId || '';

    if (options?.updateExisting && options.useExistingId) {
      updateCliente(options.useExistingId, clienteData);
    } else if (!options?.useExistingId) {
      const newId = crypto.randomUUID();
      const det = locacaoData.enderecoDetalhes;
      const primeiroEndereco = {
        id: crypto.randomUUID(),
        nome: 'Principal',
        rua: det?.road || locacaoData.enderecoObra?.split(',')[0]?.trim() || 'Não informada',
        numero: det?.house_number || locacaoData.enderecoObra?.split(',')[1]?.split('-')[0]?.trim() || 'S/N',
        cidade: det?.city || det?.town || det?.suburb || extractCityFromText(locacaoData.enderecoObra || ''),
        cep: det?.postcode || locacaoData.cep || '',
        lat: locacaoData.lat,
        lng: locacaoData.lng,
      };

      addCliente({
        ...clienteData,
        id: newId,
        dataCadastro: getLocalTodayISO(),
        enderecos: [primeiroEndereco],
        endereco: locacaoData.enderecoObra || 'Endereço não informado',
      } as Cliente);
      finalClienteId = newId;
    }

    return handleSave({ ...locacaoData, clienteId: finalClienteId });
  };

  const exportRentals = async (list: Locacao[], title: string) => {
    try {
      const data = list.map((l) => {
        const cliente = clientes.find((c) => c.id === l.clienteId);
        return [
          l.id!.slice(-6).toUpperCase(),
          cliente?.nome || 'Desconhecido',
          formatLocalDateBR(l.dataRetirada),
          formatLocalDateBR(l.dataDevolucaoPrevista),
          l.status.toUpperCase(),
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor || 0),
        ];
      });

      await exportService.exportPDF({
        title,
        filename: `relatorio_locacoes_${Date.now()}`,
        headers: ['Código', 'Cliente', 'Retirada', 'Devolução', 'Status', 'Valor'],
        data,
      });
    } catch {
      notify.error('Falha ao gerar o PDF de locações.');
    }
  };

  const exportRentalsExcel = async (list: Locacao[], title: string) => {
    try {
      const data = list.map((l) => {
        const cliente = clientes.find((c) => c.id === l.clienteId);
        return [
          l.id!,
          cliente?.nome || 'Desconhecido',
          l.enderecoObra,
          l.dataRetirada,
          l.dataDevolucaoPrevista,
          l.status,
          l.valor,
          l.valorLiquido || 0,
        ];
      });

      await exportService.exportExcel({
        title,
        filename: `excel_locacoes_${Date.now()}`,
        headers: [
          'ID',
          'Cliente',
          'Endereço',
          'Data Retirada',
          'Data Devolução',
          'Status',
          'Valor Bruto',
          'Valor Líquido',
        ],
        data,
      });
    } catch {
      notify.error('Falha ao gerar a planilha Excel de locações.');
    }
  };

  return {
    locacoes,
    clientes,
    ...financialSummary,
    isModalOpen,
    editingLocacao,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    handleAddClienteAndSave,
    updateLocacao,
    exportRentals,
    exportRentalsExcel,
  };
}
