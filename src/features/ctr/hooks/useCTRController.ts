import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, useClientes, useLocacoes, usePerfil, useLocaisDescarte, useLocalDescartePadrao } from '@/store/useAppStore';
import { CTRService } from '@/core/application/ctr-service';
import { ctrDocumentService } from '@/infrastructure/services/ctr-document-service';
import { CTRFormData, CTRConflito, CTRPayload, LocalDescarte } from '@/core/domain/ctr-types';
import { gerarNumeroCTR } from '@/core/domain/ctr-schemas';
import { Locacao } from '@/core/domain/types';

export function useCTRController() {
  const usuarioAtual = useAppStore(s => s.usuarioAtual);
  const clientes = useClientes();
  const locacoes = useLocacoes();
  const perfil = usePerfil();
  const locaisDescarte = useLocaisDescarte();
  const localDescartePadrao = useLocalDescartePadrao();
  
  const {
    ctrs,
    ctrAtual,
    setCTRs,
    setCTRAtual,
    updateCTRAtual,
    generateNovoCTRForm,
    addCTR,
    removeCTR,
    setLocaisDescarte,
    addLocalDescarte,
    updateLocalDescarte,
    removeLocalDescarte,
    setLocalPadrao,
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflitos, setConflitos] = useState<CTRConflito[]>([]);
  const [alugueisSelecionados, setAlugueisSelecionados] = useState<Locacao[]>([]);
  const [localDescarteSelecionado, setLocalDescarteSelecionado] = useState<LocalDescarte | null>(null);
  const [payloadPreview, setPayloadPreview] = useState<CTRPayload | null>(null);

  const service = useMemo(() => {
    if (usuarioAtual?.id) {
      return new CTRService({ usuarioId: usuarioAtual.id });
    }
    return null;
  }, [usuarioAtual?.id]);

  useEffect(() => {
    if (service) {
      loadData();
    }
  }, [service]);

  const loadData = async () => {
    if (!service) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [locaisData, ctrsData] = await Promise.all([
        service.getLocaisDescarte(),
        service.getCTRs(),
      ]);
      
      setLocaisDescarte(locaisData);
      setCTRs(ctrsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const openEmitModal = useCallback(() => {
    const novoForm = generateNovoCTRForm();
    setCTRAtual(novoForm);
    setAlugueisSelecionados([]);
    setLocalDescarteSelecionado(localDescartePadrao || null);
    setConflitos([]);
    setPayloadPreview(null);
    setIsModalOpen(true);
  }, [generateNovoCTRForm, setCTRAtual, localDescartePadrao]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCTRAtual(null);
    setAlugueisSelecionados([]);
    setLocalDescarteSelecionado(null);
    setConflitos([]);
    setPayloadPreview(null);
    setError(null);
  }, [setCTRAtual]);

  const handleSelectAlugueis = useCallback((alugueis: Locacao[]) => {
    setAlugueisSelecionados(alugueis);
    
    if (service && alugueis.length > 0 && localDescarteSelecionado) {
      const conflitosDetectados = service.validateConflitos(alugueis, clientes);
      setConflitos(conflitosDetectados);
      
      if (conflitosDetectados.filter(c => c.tipo === 'bloqueio').length === 0) {
        const autoFill = service.autoFillFromAlugueis(alugueis, clientes, localDescarteSelecionado, perfil);
        updateCTRAtual(autoFill);
      }
    }
  }, [service, clientes, localDescarteSelecionado, perfil, updateCTRAtual]);

  const handleSelectLocalDescarte = useCallback((local: LocalDescarte | null) => {
    setLocalDescarteSelecionado(local);
    
    if (local && alugueisSelecionados.length > 0) {
      if (service) {
        const autoFill = service.autoFillFromAlugueis(alugueisSelecionados, clientes, local, perfil);
        updateCTRAtual({ ...autoFill, localDescarteId: local.id });
      }
    }
  }, [service, alugueisSelecionados, clientes, perfil, updateCTRAtual]);

  const updateFormData = useCallback((updates: Partial<CTRFormData>) => {
    updateCTRAtual(updates);
  }, [updateCTRAtual]);

  const updateIdentificacao = useCallback((updates: Partial<Pick<CTRFormData, 'data' | 'horaSaida' | 'tipoOperacao'>>) => {
    updateCTRAtual(updates);
  }, [updateCTRAtual]);

  const updateOrigem = useCallback((updates: Partial<CTRFormData['origem']>) => {
    if (ctrAtual) {
      updateCTRAtual({ origem: { ...ctrAtual.origem, ...updates } });
    }
  }, [ctrAtual, updateCTRAtual]);

  const updateGerador = useCallback((updates: Partial<CTRFormData['gerador']>) => {
    if (ctrAtual) {
      updateCTRAtual({ gerador: { ...ctrAtual.gerador, ...updates } });
    }
  }, [ctrAtual, updateCTRAtual]);

  const updateTransportador = useCallback((updates: Partial<CTRFormData['transportador']>) => {
    if (ctrAtual) {
      updateCTRAtual({ transportador: { ...ctrAtual.transportador, ...updates } });
    }
  }, [ctrAtual, updateCTRAtual]);

  const updateDestinatario = useCallback((updates: Partial<CTRFormData['destinatario']>) => {
    if (ctrAtual) {
      updateCTRAtual({ destinatario: { ...ctrAtual.destinatario, ...updates } });
    }
  }, [ctrAtual, updateCTRAtual]);

  const updateResiduo = useCallback((updates: Partial<CTRFormData['residuo']>) => {
    if (ctrAtual) {
      updateCTRAtual({ residuo: { ...ctrAtual.residuo, ...updates } });
    }
  }, [ctrAtual, updateCTRAtual]);

  const updateDeclaracoes = useCallback((updates: Partial<CTRFormData['declaracoes']>) => {
    if (ctrAtual) {
      updateCTRAtual({ declaracoes: { ...ctrAtual.declaracoes, ...updates } });
    }
  }, [ctrAtual, updateCTRAtual]);

  const previewDocument = useCallback(() => {
    if (ctrAtual && localDescarteSelecionado) {
      // Gerar número temporário para preview (6 dígitos do timestamp)
      const numeroTemp = Date.now().toString().slice(-6);
      const payload = ctrDocumentService.generatePayload(ctrAtual, localDescarteSelecionado, perfil, numeroTemp);
      setPayloadPreview(payload);
      return payload;
    }
    return null;
  }, [ctrAtual, localDescarteSelecionado, perfil]);

  const handleEmitCTR = useCallback(async () => {
    if (!service || !ctrAtual || !localDescarteSelecionado) {
      setError('Dados incompletos para emissão do CTR');
      return false;
    }

    const conflitosBloqueio = conflitos.filter(c => c.tipo === 'bloqueio');
    if (conflitosBloqueio.length > 0) {
      setError(conflitosBloqueio[0].mensagem);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const numeroCTR = gerarNumeroCTR();
      const novoCTR = await service.createCTR(
        ctrAtual,
        localDescarteSelecionado,
        alugueisSelecionados,
        clientes
      );

      addCTR(novoCTR);
      closeModal();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao emitir CTR');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [service, ctrAtual, localDescarteSelecionado, alugueisSelecionados, clientes, conflitos, addCTR, closeModal]);

  const downloadPDF = useCallback(async (payload: CTRPayload) => {
    try {
      await ctrDocumentService.downloadPDF(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar PDF');
    }
  }, []);

  const downloadWord = useCallback(async (payload: CTRPayload) => {
    try {
      await ctrDocumentService.downloadWord(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar Word');
    }
  }, []);

  const handlePrint = useCallback(async (payload: CTRPayload) => {
    try {
      await ctrDocumentService.print(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao imprimir');
    }
  }, []);

  const handleDeleteCTR = useCallback(async (id: string) => {
    if (!service) return;
    
    setIsLoading(true);
    try {
      await service.deleteCTR(id);
      removeCTR(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar CTR');
    } finally {
      setIsLoading(false);
    }
  }, [service, removeCTR]);

  const addNovoLocalDescarte = useCallback(async (local: Omit<LocalDescarte, 'id' | 'createdAt' | 'usuarioId'>) => {
    const novoLocal: LocalDescarte = {
      ...local,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      usuarioId: usuarioAtual?.id || 'local',
    };
    
    if (service) {
      setIsLoading(true);
      try {
        const savedLocal = await service.createLocalDescarte(local);
        addLocalDescarte(savedLocal);
        return savedLocal;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar local de descarte');
        addLocalDescarte(novoLocal);
        return novoLocal;
      } finally {
        setIsLoading(false);
      }
    } else {
      addLocalDescarte(novoLocal);
      return novoLocal;
    }
  }, [service, addLocalDescarte, usuarioAtual]);

  const updateLocalDescarteById = useCallback(async (id: string, updates: Partial<LocalDescarte>) => {
    if (service) {
      setIsLoading(true);
      try {
        const atualizado = await service.updateLocalDescarte(id, updates);
        updateLocalDescarte(id, updates);
        return atualizado;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar local de descarte');
      } finally {
        setIsLoading(false);
      }
    }
    updateLocalDescarte(id, updates);
    return locaisDescarte.find(l => l.id === id);
  }, [service, updateLocalDescarte, locaisDescarte]);

  const deleteLocalDescarteById = useCallback(async (id: string) => {
    if (service) {
      setIsLoading(true);
      try {
        await service.deleteLocalDescarte(id);
        removeLocalDescarte(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao deletar local de descarte');
      } finally {
        setIsLoading(false);
      }
    } else {
      removeLocalDescarte(id);
    }
  }, [service, removeLocalDescarte]);

  const setLocalDescartePadraoById = useCallback(async (id: string) => {
    if (service) {
      try {
        await service.setLocalPadrao(id);
        setLocalPadrao(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao definir local padrão');
        setLocalPadrao(id);
      }
    } else {
      setLocalPadrao(id);
    }
  }, [service, setLocalPadrao]);

  const hasBloqueioConflitos = useMemo(() => {
    return conflitos.some(c => c.tipo === 'bloqueio');
  }, [conflitos]);

  const locacoesAtivas = useMemo(() => {
    return locacoes.filter(l => l.status !== 'pago' && l.status !== 'concluida');
  }, [locacoes]);

  return {
    ctrs,
    ctrAtual,
    locaisDescarte,
    localDescartePadrao,
    localDescarteSelecionado,
    alugueisSelecionados,
    conflitos,
    payloadPreview,
    isModalOpen,
    isLoading,
    error,
    hasBloqueioConflitos,
    locacoesAtivas,
    
    openEmitModal,
    closeModal,
    handleSelectAlugueis,
    handleSelectLocalDescarte,
    updateFormData,
    updateIdentificacao,
    updateOrigem,
    updateGerador,
    updateTransportador,
    updateDestinatario,
    updateResiduo,
    updateDeclaracoes,
    previewDocument,
    handleEmitCTR,
    downloadPDF,
    downloadWord,
    handlePrint,
    handleDeleteCTR,
    addNovoLocalDescarte,
    updateLocalDescarteById,
    deleteLocalDescarteById,
    setLocalDescartePadraoById,
    loadData,
    setError,
  };
}
