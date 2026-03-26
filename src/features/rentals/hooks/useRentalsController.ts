import { useState, useMemo } from 'react';
import { useLocacoes, useClientes } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { Locacao, Cliente } from '@/core/domain/types';
import { exportService } from '@/infrastructure/services/export-service';

export function useRentalsController() {
  const locacoes = useLocacoes();
  const clientes = useClientes();
  const { updateLocacao, addLocacao } = useDataActions();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocacao, setEditingLocacao] = useState<Partial<Locacao> | undefined>();

  const hoje = new Date().toISOString().split('T')[0];

  const financialSummary = useMemo(() => {
    const inadimplentes = locacoes.filter(l => 
      l.status === 'vencida' || (l.status === 'a_pagar' && l.dataRetirada < hoje)
    );
    
    const vencidos = locacoes.filter(l => 
      l.status === 'pago' && l.dataDevolucaoPrevista && l.dataDevolucaoPrevista < hoje
    );
    
    const pendentesEntrega = locacoes.filter(l => 
      l.status === 'a_pagar'
    );

    return { inadimplentes, vencidos, pendentesEntrega };
  }, [locacoes, hoje]);

  const handleOpenModal = (loc?: Partial<Locacao>) => {
    setEditingLocacao(loc);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocacao(undefined);
  };

  const handleSave = (data: Partial<Locacao>) => {
    if (data.id) {
      updateLocacao(data.id, data);
    } else {
      addLocacao(data as Locacao);
    }
    handleCloseModal();
  };

  const exportRentals = (list: Locacao[], title: string) => {
    const data = list.map(l => {
      const cliente = clientes.find(c => c.id === l.clienteId);
      return [
        l.id.slice(-6).toUpperCase(),
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
        l.id,
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
    updateLocacao,
    exportRentals,
    exportRentalsExcel
  };
}
