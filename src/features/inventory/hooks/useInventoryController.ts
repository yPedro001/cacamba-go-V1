import { useState, useCallback } from 'react';
import { useCacambas, usePerfil, useUsuarioAtual, useConfiguracoes } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { Cacamba } from '@/core/domain/types';
import { suggestNextCacambaCode } from '@/lib/business-utils';
import { geocodeService } from '@/infrastructure/api/geocode-service';
import { exportService } from '@/infrastructure/services/export-service';

export function useInventoryController() {
  const cacambas = useCacambas();
  const perfil = usePerfil();
  const usuarioAtual = useUsuarioAtual();
  const configuracoes = useConfiguracoes();
  const { addCacamba, updateCacamba, removeCacamba, addCacambasBatch } = useDataActions(); 

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCacamba, setCurrentCacamba] = useState<Partial<Cacamba>>({});
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [selectedHistorico, setSelectedHistorico] = useState<Cacamba | null>(null);
  const [batchQuantity, setBatchQuantity] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cacambaIdToDelete, setCacambaIdToDelete] = useState<string | null>(null);

  const filteredCacambas = cacambas.filter(c => 
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.tamanho?.includes(searchTerm) ?? false)
  );

  const handleOpenModal = useCallback((cacamba?: Cacamba) => {
    setAlertMessage('');
    setBatchQuantity(1);
    if (cacamba) {
      setCurrentCacamba(cacamba);
      setIsEditing(true);
    } else {
      const sugestaoCodigo = suggestNextCacambaCode(cacambas, perfil.padroes?.prefixoCacamba || 'C-');
      setCurrentCacamba({
        codigo: sugestaoCodigo,
        tamanho: perfil.padroes?.tamanhoCacamba || '5m',
        status: 'disponivel',
        lat: perfil.lat || -23.5505,
        lng: perfil.lng || -46.6333,
        enderecoAtual: perfil.endereco || '',
        historico: []
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  }, [cacambas, perfil]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCacamba({});
  };

  const handleCepLookup = async (cep: string) => {
    setIsCepLoading(true);
    const data = await geocodeService.fetchByCep(cep);
    setIsCepLoading(false);
    if (!data) return;

    setCurrentCacamba(prev => ({
      ...prev,
      enderecoAtual: data.rua ? `${data.rua}, ${data.cidade}` : prev.enderecoAtual,
      lat: data.lat || prev.lat,
      lng: data.lng || prev.lng
    }));
  };

  const saveCacamba = () => {
    if (!currentCacamba.codigo || !currentCacamba.tamanho) {
      alert("Preencha Código e Tamanho.");
      return;
    }

    const now = new Date().toISOString();
    const nomeUsuario = usuarioAtual?.nome || 'Sistema';
    const novaEntradaHistorico = {
      status: currentCacamba.status || 'disponivel',
      data: now,
      usuario: nomeUsuario,
      motivo: isEditing ? 'Edição manual' : 'Cadastro inicial'
    };

    if (isEditing && currentCacamba.id) {
      updateCacamba(currentCacamba.id, {
        ...currentCacamba as Cacamba,
        historico: [...(currentCacamba.historico || []), novaEntradaHistorico]
      });
    } else {
      const qty = batchQuantity > 1 ? batchQuantity : 1;
      const prefixo = perfil.padroes?.prefixoCacamba || 'C-';
      const novas: Cacamba[] = [];
      let tempCacambas = [...cacambas];
      
      for (let i = 0; i < qty; i++) {
        const sugestao = suggestNextCacambaCode(tempCacambas, prefixo);
        const nova: Cacamba = {
          ...currentCacamba,
          codigo: i === 0 ? currentCacamba.codigo! : sugestao,
          id: (Date.now() + i).toString(),
          historico: [novaEntradaHistorico]
        } as Cacamba;
        novas.push(nova);
        tempCacambas.push(nova);
      }
      
      addCacambasBatch(novas);
    }
    handleCloseModal();
  };

  const exportPDF = () => {
    exportService.exportPDF({
      title: 'Relatório de Frota - Caçambas',
      filename: `frota_cacambago_${Date.now()}`,
      headers: ['Código', 'Tamanho', 'Status', 'Localização'],
      data: filteredCacambas.map(c => [
        c.codigo,
        c.tamanho,
        c.status.toUpperCase(),
        c.enderecoAtual || 'Não informado'
      ])
    });
  };

  const exportExcel = () => {
    exportService.exportExcel({
      title: 'Frota CaçambaGo',
      filename: `inventario_excel_${Date.now()}`,
      headers: ['Código', 'Tamanho', 'Status', 'Endereço Atual', 'Última Entrega'],
      data: filteredCacambas.map(c => [
        c.codigo,
        c.tamanho,
        c.status.toUpperCase(),
        c.enderecoAtual || 'Pátio',
        c.dataEntrega ? new Date(c.dataEntrega).toLocaleDateString('pt-BR') : '—'
      ])
    });
  };

  const deleteCacamba = (id: string) => {
    if (configuracoes.pularConfirmacaoExclusao) {
      removeCacamba(id);
    } else {
      setCacambaIdToDelete(id);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (cacambaIdToDelete) {
      removeCacamba(cacambaIdToDelete);
      setCacambaIdToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  return {
    cacambas,
    filteredCacambas,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
    currentCacamba,
    setCurrentCacamba,
    saveCacamba,
    isEditing,
    isCepLoading,
    handleCepLookup,
    alertMessage,
    batchQuantity,
    setBatchQuantity,
    isHistoricoOpen,
    setIsHistoricoOpen,
    selectedHistorico,
    setSelectedHistorico,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deleteCacamba,
    confirmDelete,
    exportPDF,
    exportExcel
  };
}
