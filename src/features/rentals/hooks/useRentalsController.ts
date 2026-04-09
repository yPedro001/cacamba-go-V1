import { useState, useMemo } from 'react';
import { useLocacoes, useClientes, useCacambas, usePerfil } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { Locacao, Cliente } from '@/core/domain/types';
import { exportService } from '@/infrastructure/services/export-service';

export function useRentalsController() {
  const clientes = useClientes();
  const locacoes = useLocacoes();
  const cacambas = useCacambas();
  const perfil = usePerfil();
  const { addLocacao, updateLocacao, addCliente, updateCliente, addEnderecoAoCliente } = useDataActions();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocacao, setEditingLocacao] = useState<Partial<Locacao> | undefined>();

  const hoje = new Date().toISOString().split('T')[0];

  const financialSummary = useMemo(() => {
    // 1. Inadimplentes e Valores Pendentes - ÚNICA FONTE DE VERDADE
    // Definição: locações financeiramente ativas (não pagas e não canceladas) E com tempo expirado.
    const inadimplentes = locacoes.filter(l => {
      // Tem pendência financeira?
      const pendenciaFinanceira = l.status !== 'pago' && l.status !== 'concluida' && l.status !== 'cancelada';
      
      // Já passou do prazo? (Considera data de devolução se existir, senão considera a data de retirada base)
      const dataReferencia = l.dataDevolucaoPrevista ? l.dataDevolucaoPrevista : l.dataRetirada;
      const isVencida = l.status === 'vencida' || (dataReferencia && dataReferencia < hoje);
      
      return pendenciaFinanceira && isVencida;
    });

    const inadimplentesValor = inadimplentes.reduce((acc, curr) => acc + curr.valor, 0);
    const inadimplentesCount = inadimplentes.length;
    
    // 2. Vencidos para Retirar (Pagas mas com data de devolução no passado)
    const vencidos = locacoes.filter(l => 
      l.status === 'pago' && l.dataDevolucaoPrevista && l.dataDevolucaoPrevista < hoje
    );
    
    // 3. Pendentes de Entrega (Status explicitamente 'entrega_pendente')
    const pendentesEntrega = locacoes.filter(l => 
      l.status === 'entrega_pendente' || l.status === 'a_pagar'
    );

    // 4. Arrecadado (Efetivado no caixa)
    const arrecadado = locacoes
      .filter(l => l.status === 'pago' || l.status === 'concluida')
      .reduce((acc, curr) => acc + curr.valor, 0);

    // 5. Receita Esperada (Tudo que não foi pago nem cancelado)
    const receitaEsperada = locacoes
      .filter(l => l.status !== 'pago' && l.status !== 'concluida' && l.status !== 'cancelada')
      .reduce((acc, curr) => acc + curr.valor, 0);

    // 6. Contagem de Ações (Painel Logístico)
    const acoes = {
      entregas: locacoes.filter(l => l.status === 'entrega_pendente').length,
      retiradas: locacoes.filter(l => l.status === 'vencida' || (l.dataDevolucaoPrevista && l.dataDevolucaoPrevista < hoje)).length,
      financeiro: inadimplentesCount // Sincronizado estritamente com os inadimplentes reais
    };

    return { 
      inadimplentes, 
      inadimplentesValor,
      vencidos, 
      pendentesEntrega, 
      arrecadado, 
      receitaEsperada,
      acoes 
    };
  }, [locacoes, hoje]);

  const handleOpenModal = (loc?: Partial<Locacao>) => {
    setEditingLocacao(loc);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocacao(undefined);
  };

  const handleSave = async (data: Partial<Locacao> & { salvarEndereco?: boolean, nomeEndereco?: string, enderecoDetalhes?: any }) => {
    // Validação de estoque para novas locações
    if (!data.id) {
      const disponiveis = cacambas.filter(c => c.status === 'disponivel');
      const requisitadas = data.quantidadeCacambas || 1;
      if (disponiveis.length < requisitadas) {
        alert(`Caçambas insuficientes no pátio. Disponível: ${disponiveis.length}.`);
        return false;
      }
    }

    // Se solicitou salvar o endereço no cliente
    if (data.salvarEndereco && data.clienteId && data.enderecoObra) {
      const det = data.enderecoDetalhes;
      addEnderecoAoCliente(data.clienteId, {
        nome: data.nomeEndereco || 'Nova Obra',
        rua: det?.road || data.enderecoObra.split(',')[0],
        numero: det?.house_number || data.enderecoObra.split(',')[1]?.split('-')[0]?.trim() || 'S/N',
        cidade: det?.city || det?.town || det?.suburb || '',
        cep: det?.postcode || '',
        lat: data.lat,
        lng: data.lng
      });
    }

    // Limpar campos auxiliares do payload final
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { salvarEndereco, nomeEndereco, enderecoDetalhes, ...locacaoParaSalvar } = data;

    if (locacaoParaSalvar.id) {
      updateLocacao(locacaoParaSalvar.id, locacaoParaSalvar);
    } else {
      const newId = Date.now().toString();
      addLocacao({ 
        ...locacaoParaSalvar, 
        id: newId, 
        status: locacaoParaSalvar.status || 'entrega_pendente' 
      } as Locacao);
    }
    
    handleCloseModal();
    return true;
  };

  const handleAddClienteAndSave = async (
    clienteData: Partial<Cliente>, 
    locacaoData: Partial<Locacao>, 
    options?: { updateExisting?: boolean, useExistingId?: string }
  ) => {
    let finalClienteId = options?.useExistingId || '';

    if (options?.updateExisting && options.useExistingId) {
      updateCliente(options.useExistingId, clienteData);
    } else if (!options?.useExistingId) {
      const newId = `${Date.now()}-c`;
      // No novo cadastro rápido, o endereço da obra vira o primeiro endereço do cliente
      const primeiroEndereco = {
        id: crypto.randomUUID(),
        nome: 'Principal',
        rua: locacaoData.enderecoObra?.split(',')[0] || 'Não informada',
        numero: locacaoData.enderecoObra?.split(',')[1]?.split('-')[0]?.trim() || 'S/N',
        cidade: locacaoData.enderecoObra?.split('-')[1]?.trim() || '',
        cep: '',
        lat: locacaoData.lat,
        lng: locacaoData.lng
      };

      addCliente({ 
        ...clienteData, 
        id: newId,
        enderecos: [primeiroEndereco],
        endereco: locacaoData.enderecoObra || 'Endereço não informado' // Backup legibilidade
      } as Cliente);
      finalClienteId = newId;
    }

    // Agora salva a locação com o ID do cliente (novo ou existente)
    handleSave({ ...locacaoData, clienteId: finalClienteId });
  };

  const exportRentals = (list: Locacao[], title: string) => {
    const data = list.map(l => {
      const cliente = clientes.find(c => c.id === l.clienteId);
      return [
        l.id!.slice(-6).toUpperCase(),
        cliente?.nome || 'Desconhecido',
        new Date(l.dataRetirada).toLocaleDateString('pt-BR'),
        new Date(l.dataDevolucaoPrevista).toLocaleDateString('pt-BR'),
        l.status.toUpperCase(),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor)
      ];
    });

    exportService.exportPDF({
      title,
      filename: `relatorio_locacoes_${Date.now()}`,
      headers: ['Código', 'Cliente', 'Retirada', 'Devolução', 'Status', 'Valor'],
      data
    });
  };

  const exportRentalsExcel = (list: Locacao[], title: string) => {
    const data = list.map(l => {
      const cliente = clientes.find(c => c.id === l.clienteId);
      return [
        l.id!,
        cliente?.nome || 'Desconhecido',
        l.enderecoObra,
        l.dataRetirada,
        l.dataDevolucaoPrevista,
        l.status,
        l.valor,
        l.valorLiquido || 0
      ];
    });

    exportService.exportExcel({
      title,
      filename: `excel_locacoes_${Date.now()}`,
      headers: ['ID', 'Cliente', 'Endereço', 'Data Retirada', 'Data Devolução', 'Status', 'Valor Bruto', 'Valor Líquido'],
      data
    });
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
    exportRentalsExcel
  };
}
