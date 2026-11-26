import { useState, useCallback, useMemo } from 'react';
import { useCacambas, usePerfil, useUsuarioAtual, useConfiguracoes, useLocacoes } from '@/store/useAppStore';
import { useDataActions } from '@/core/application/useDataActions';
import { isLocacaoEncerrada } from '@/core/domain/business-logic';
import { Cacamba } from '@/core/domain/types';
import { suggestNextCacambaCode } from '@/lib/business-utils';
import { formatLocalDateBR } from '@/lib/domain-helpers';
import { geocodeService } from '@/infrastructure/api/geocode-service';
import { exportService } from '@/infrastructure/services/export-service';
import { notify } from '@/lib/notificationService';

export function useInventoryController() {
  const cacambas = useCacambas();
  const locacoes = useLocacoes();
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
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const filteredCacambas = useMemo(
    () =>
      cacambas.filter(
        (c) =>
          c.codigo.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
          (c.tamanho?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ?? false)
      ),
    [cacambas, searchTerm]
  );

  const handleOpenModal = useCallback(
    (cacamba?: Cacamba) => {
      setAlertMessage('');
      setBatchQuantity(1);
      if (cacamba) {
        setCurrentCacamba(cacamba);
        setIsEditing(true);
      } else {
        const sugestaoCodigo = suggestNextCacambaCode(
          cacambas,
          perfil.padroes?.prefixoCacamba || 'C-'
        );
        const novaCacamba: Partial<Cacamba> = {
          codigo: sugestaoCodigo,
          tamanho: perfil.padroes?.tamanhoCacamba || '5m',
          status: 'disponivel',
          lat: perfil.lat || -23.5505,
          lng: perfil.lng || -46.6333,
          enderecoAtual: perfil.endereco || '',
          historico: [],
        };
        setCurrentCacamba(novaCacamba);
        setIsEditing(false);
      }
      setShowUnsavedConfirm(false);
      setIsModalOpen(true);
    },
    [cacambas, perfil]
  );

  const handleCloseModal = useCallback(() => {
    setShowUnsavedConfirm(false);
    setAlertMessage('');
    setIsModalOpen(false);
    setCurrentCacamba({});
  }, []);

  const handleCepLookup = async (cep: string) => {
    setIsCepLoading(true);
    const data = await geocodeService.fetchByCep(cep);
    setIsCepLoading(false);
    if (!data) return;

    setCurrentCacamba((prev) => ({
      ...prev,
      enderecoAtual: data.rua ? `${data.rua}, ${data.cidade}` : prev.enderecoAtual,
      lat: data.lat || prev.lat,
      lng: data.lng || prev.lng,
    }));
  };

  const saveCacamba = () => {
    setAlertMessage('');
    const codigoTrimmed = (currentCacamba.codigo || '').trim();
    if (!codigoTrimmed || !currentCacamba.tamanho) {
      const msg = 'Preencha o Código e o Tamanho da caçamba.';
      setAlertMessage(msg);
      notify.error(msg);
      return;
    }

    const duplicate = cacambas.find(
      (c) =>
        c.id !== currentCacamba.id &&
        c.codigo.trim().toLowerCase() === codigoTrimmed.toLowerCase()
    );
    if (duplicate) {
      const msg = `Já existe uma caçamba cadastrada com o código "${duplicate.codigo}".`;
      setAlertMessage(msg);
      notify.error(msg);
      return;
    }

    const now = new Date().toISOString();
    const nomeUsuario = usuarioAtual?.nome || 'Sistema';
    const novaEntradaHistorico = {
      status: currentCacamba.status || 'disponivel',
      data: now,
      usuario: nomeUsuario,
      motivo: isEditing ? 'Edição manual' : 'Cadastro inicial',
    };

    if (isEditing && currentCacamba.id) {
      updateCacamba(currentCacamba.id, {
        ...(currentCacamba as Cacamba),
        codigo: codigoTrimmed,
        historico: [...(currentCacamba.historico || []), novaEntradaHistorico],
      });
    } else {
      const qty = Math.max(1, Math.min(50, batchQuantity || 1));
      const prefixo = perfil.padroes?.prefixoCacamba || 'C-';
      const novas: Cacamba[] = [];
      const tempCacambas = [...cacambas];

      for (let i = 0; i < qty; i++) {
        const codigoGerado = i === 0 ? codigoTrimmed : suggestNextCacambaCode(tempCacambas, prefixo);
        const nova: Cacamba = {
          ...currentCacamba,
          codigo: codigoGerado,
          id: crypto.randomUUID(),
          historico: [novaEntradaHistorico],
        } as Cacamba;
        novas.push(nova);
        tempCacambas.push(nova);
      }

      if (novas.length === 1) {
        addCacamba(novas[0]);
      } else {
        addCacambasBatch(novas);
      }
    }
    handleCloseModal();
  };

  const exportPDF = async () => {
    try {
      await exportService.exportPDF({
        title: 'Relatório de Frota - Caçambas',
        filename: `frota_cacambago_${Date.now()}`,
        headers: ['Código', 'Tamanho', 'Status', 'Localização'],
        data: filteredCacambas.map((c) => [
          c.codigo,
          c.tamanho,
          c.status.toUpperCase(),
          c.enderecoAtual || 'Não informado',
        ]),
      });
    } catch {
      notify.error('Falha ao gerar o PDF da frota.');
    }
  };

  const exportExcel = async () => {
    try {
      await exportService.exportExcel({
        title: 'Frota CaçambaGo',
        filename: `inventario_excel_${Date.now()}`,
        headers: ['Código', 'Tamanho', 'Status', 'Endereço Atual', 'Última Entrega'],
        data: filteredCacambas.map((c) => [
          c.codigo,
          c.tamanho,
          c.status.toUpperCase(),
          c.enderecoAtual || 'Pátio',
          c.dataEntrega ? formatLocalDateBR(c.dataEntrega) : '—',
        ]),
      });
    } catch {
      notify.error('Falha ao gerar a planilha Excel da frota.');
    }
  };

  const deleteCacamba = (id: string) => {
    const boundActive = locacoes.some(
      (l) => !isLocacaoEncerrada(l.status) && (l.cacambaId === id || l.cacambaIds?.includes(id))
    );
    if (boundActive) {
      notify.error('Esta caçamba está vinculada a uma locação ativa. Encerre ou edite a locação antes de excluir.');
      return;
    }

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
    exportExcel,
    showUnsavedConfirm,
  };
}
