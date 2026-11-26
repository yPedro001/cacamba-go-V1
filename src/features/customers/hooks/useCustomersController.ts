import { useState, useCallback, useMemo } from 'react';
import { useClientes, useConfiguracoes, useLocacoes } from '@/store/useAppStore';
import { Cliente, ClienteEndereco } from '@/core/domain/types';
import { isLocacaoEncerrada } from '@/core/domain/business-logic';
import { geocodeService } from '@/infrastructure/api/geocode-service';
import { useDataActions } from '@/core/application/useDataActions';
import { exportService } from '@/infrastructure/services/export-service';
import { getLocalTodayISO } from '@/lib/domain-helpers';
import { notify } from '@/lib/notificationService';

export function useCustomersController() {
  const clientes = useClientes();
  const locacoes = useLocacoes();
  const configuracoes = useConfiguracoes();
  const { addCliente, updateCliente, removeCliente } = useDataActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Cliente>>({});
  const [savedClient, setSavedClient] = useState<Partial<Cliente>>({});
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientIdToDelete, setClientIdToDelete] = useState<string | null>(null);

  const [enderecosForm, setEnderecosForm] = useState<Partial<ClienteEndereco>[]>([]);
  const [savedEnderecos, setSavedEnderecos] = useState<Partial<ClienteEndereco>[]>([]);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const filteredClientes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const qDigits = searchTerm.replace(/\D/g, '');
    return (clientes || [])
      .filter((c) => {
        if (!q) return true;
        const nome = c?.nome?.toLowerCase() || '';
        const email = c?.email?.toLowerCase() || '';
        const doc = c?.cpfCnpj?.toLowerCase() || '';
        const docDigits = (c?.cpfCnpj || '').replace(/\D/g, '');
        const tel = c?.telefone || '';
        const telDigits = tel.replace(/\D/g, '');
        const endLegado = c?.endereco?.toLowerCase() || '';

        return (
          nome.includes(q) ||
          email.includes(q) ||
          doc.includes(q) ||
          (qDigits.length >= 2 && (docDigits.includes(qDigits) || telDigits.includes(qDigits))) ||
          tel.includes(searchTerm) ||
          endLegado.includes(q) ||
          (c?.enderecos?.some(
            (e) =>
              e.rua?.toLowerCase().includes(q) ||
              e.cidade?.toLowerCase().includes(q) ||
              e.nome?.toLowerCase().includes(q)
          ) ??
            false)
        );
      })
      .sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || ''));
  }, [clientes, searchTerm]);

  const handleOpenModal = useCallback((cliente?: Cliente) => {
    if (cliente) {
      setCurrentClient(cliente);
      setSavedClient(cliente); // Salva estado para comparação
      // Migração rápida: se não tem endereços mas tem o campo antigo, converter
      if (!cliente.enderecos || cliente.enderecos.length === 0) {
        if (cliente.endereco) {
           const parts = cliente.endereco.split(' - ');
           const ruaNum = (parts[0] || '').split(',');
           const convertedEnderecos = [{
             id: crypto.randomUUID(),
             nome: 'Principal',
             rua: (ruaNum[0] || '').trim(),
             numero: (ruaNum[1] || '').trim() || 'S/N',
             cidade: (parts[1] || '').trim(),
             cep: (parts[2] || '').trim()
           }];
           setEnderecosForm(convertedEnderecos);
           setSavedEnderecos(convertedEnderecos);
        } else {
          setEnderecosForm([]);
          setSavedEnderecos([]);
        }
      } else {
        setEnderecosForm(cliente.enderecos);
        setSavedEnderecos(cliente.enderecos);
      }
      setIsEditing(true);
    } else {
      setCurrentClient({ nome: '', cpfCnpj: '', telefone: '', email: '' });
      setSavedClient({ nome: '', cpfCnpj: '', telefone: '', email: '' });
      const emptyEndereco = [{ id: crypto.randomUUID(), nome: 'Principal', rua: '', numero: '', cidade: '', cep: '' }];
      setEnderecosForm(emptyEndereco);
      setSavedEnderecos(emptyEndereco);
      setIsEditing(false);
    }
    setShowUnsavedConfirm(false);
    setIsModalOpen(true);
  }, []);

  // Função para verificar se há alterações não salvas
  const hasUnsavedChanges = useMemo(() => {
    if (!isModalOpen) return false;
    
    // Cliente novo (vazio) - sem alterações
    if (!savedClient.nome && !currentClient.nome && enderecosForm.length === 1) {
      const firstEnd = enderecosForm[0];
      if (!firstEnd?.nome && !firstEnd?.rua && !firstEnd?.cidade) {
        return false;
      }
    }
    
    // Verifica campos do cliente
    const hasClientChanges = 
      currentClient.nome !== savedClient.nome ||
      currentClient.cpfCnpj !== savedClient.cpfCnpj ||
      currentClient.telefone !== savedClient.telefone ||
      currentClient.email !== savedClient.email;
    
    // Verifica endereços
    const hasEnderecoChanges = JSON.stringify(enderecosForm) !== JSON.stringify(savedEnderecos);
    
    return hasClientChanges || hasEnderecoChanges;
  }, [isModalOpen, currentClient, savedClient, enderecosForm, savedEnderecos]);

  // Handler de fechamento com proteção contra alterações não salvas
  const handleCloseModal = useCallback((forceClose = false) => {
    if (!forceClose && hasUnsavedChanges) {
      setShowUnsavedConfirm(true);
      return;
    }
    setIsModalOpen(false);
    setCurrentClient({});
    setSavedClient({});
    setEnderecosForm([]);
    setSavedEnderecos([]);
    setShowUnsavedConfirm(false);
  }, [hasUnsavedChanges]);

  // Confirma o fechamento (descarta dados)
  const confirmCloseModal = useCallback(() => {
    setShowUnsavedConfirm(false);
    setIsModalOpen(false);
    setCurrentClient({});
    setSavedClient({});
    setEnderecosForm([]);
    setSavedEnderecos([]);
  }, []);

  // Cancela o fechamento (continua preenchendo)
  const cancelCloseModal = useCallback(() => {
    setShowUnsavedConfirm(false);
  }, []);

  const addEnderecoField = () => {
    setEnderecosForm([...enderecosForm, { id: crypto.randomUUID(), nome: '', rua: '', numero: '', cidade: '', cep: '' }]);
  };

  const removeEnderecoField = (index: number) => {
    setEnderecosForm(enderecosForm.filter((_, i) => i !== index));
  };

  const updateEnderecoField = (index: number, data: Partial<ClienteEndereco>) => {
    setEnderecosForm(enderecosForm.map((e, i) => i === index ? { ...e, ...data } : e));
  };

  const handleCepLookup = async (index: number, cep: string) => {
    setIsCepLoading(true);
    const data = await geocodeService.fetchByCep(cep);
    setIsCepLoading(false);
    if (!data) return;

    updateEnderecoField(index, {
      rua: data.rua || enderecosForm[index].rua,
      cidade: data.cidade || enderecosForm[index].cidade,
      cep: data.cep || enderecosForm[index].cep
    });
  };

  const saveClient = () => {
    setFormError(null);
    const nomeTrimmed = (currentClient.nome || '').trim();
    const telefoneTrimmed = (currentClient.telefone || '').trim();
    if (nomeTrimmed.length < 2 || !telefoneTrimmed) {
      const msg = 'Informe o Nome completo (mín. 2 caracteres) e o Telefone do cliente.';
      setFormError(msg);
      notify.error(msg);
      return;
    }

    const docDigits = (currentClient.cpfCnpj || '').replace(/\D/g, '');
    if (docDigits.length > 0 && docDigits.length !== 11 && docDigits.length !== 14) {
      const msg = 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.';
      setFormError(msg);
      notify.error(msg);
      return;
    }

    if (docDigits.length >= 11) {
      const duplicate = clientes.find(
        (c) => c.id !== currentClient.id && (c.cpfCnpj || '').replace(/\D/g, '') === docDigits
      );
      if (duplicate) {
        const msg = `Já existe outro cliente cadastrado com este CPF/CNPJ (${duplicate.nome}).`;
        setFormError(msg);
        notify.error(msg);
        return;
      }
    }

    // Preserva endereços preenchidos sem descartar silenciosamente por falta de apelido
    const incompleteAddress = enderecosForm.find((e) => (e.rua?.trim() || e.cep?.trim()) && !e.cidade?.trim());
    if (incompleteAddress) {
      const msg = 'Preencha a Cidade para todos os endereços informados.';
      setFormError(msg);
      notify.error(msg);
      return;
    }

    const enderecosValidos = enderecosForm
      .filter((e) => e.rua?.trim() && e.cidade?.trim())
      .map((e, idx) => ({
        id: e.id || crypto.randomUUID(),
        nome: e.nome?.trim() || (idx === 0 ? 'Principal' : `Obra ${idx + 1}`),
        rua: e.rua!.trim(),
        numero: e.numero?.trim() || 'S/N',
        cidade: e.cidade!.trim(),
        cep: e.cep?.trim() || '',
        lat: e.lat,
        lng: e.lng,
      })) as ClienteEndereco[];

    const legacyEndereco = enderecosValidos[0]
      ? `${enderecosValidos[0].rua}, ${enderecosValidos[0].numero || 'S/N'} - ${enderecosValidos[0].cidade} - ${enderecosValidos[0].cep || ''}`
      : currentClient.endereco || '';

    const payload = {
      ...currentClient,
      nome: nomeTrimmed,
      telefone: telefoneTrimmed,
      enderecos: enderecosValidos,
      endereco: legacyEndereco,
    } as Cliente;

    if (isEditing && currentClient.id) {
      updateCliente(currentClient.id, payload);
    } else {
      addCliente({
        ...payload,
        id: crypto.randomUUID(),
        dataCadastro: getLocalTodayISO(),
      });
    }

    setSavedClient(payload);
    setSavedEnderecos(enderecosValidos);
    handleCloseModal(true);
  };

  const deleteClient = (id: string) => {
    const activeRentals = locacoes.filter((l) => l.clienteId === id && !isLocacaoEncerrada(l.status));
    if (activeRentals.length > 0) {
      notify.error(
        `Este cliente possui ${activeRentals.length} locação(ões) ativa(s). Encerre ou cancele antes de excluir.`
      );
      return;
    }

    if (configuracoes.pularConfirmacaoExclusao) {
      removeCliente(id);
    } else {
      setClientIdToDelete(id);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (clientIdToDelete) {
      removeCliente(clientIdToDelete);
      setClientIdToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const exportPDF = async () => {
    try {
      await exportService.exportPDF({
        title: 'Relatório Geral de Clientes',
        filename: `clientes_cacambago_${Date.now()}`,
        headers: ['Nome', 'Documento', 'Telefone', 'E-mail', 'Endereços'],
        data: filteredClientes.map((c) => [
          c.nome,
          c.cpfCnpj || '-',
          c.telefone || '-',
          c.email || '-',
          (c.enderecos || []).map((e) => `${e.nome}: ${e.rua}, ${e.numero}`).join(' | ') ||
            (c.endereco ? c.endereco : '-'),
        ]),
      });
    } catch {
      notify.error('Falha ao gerar o PDF de clientes.');
    }
  };

  const exportExcel = async () => {
    try {
      await exportService.exportExcel({
        title: 'Clientes CaçambaGo',
        filename: `clientes_excel_${Date.now()}`,
        headers: ['Nome', 'CPF/CNPJ', 'Telefone', 'E-mail', 'Qtd Endereços'],
        data: filteredClientes.map((c) => [
          c.nome,
          c.cpfCnpj || '',
          c.telefone || '',
          c.email || '',
          (c.enderecos?.length || (c.endereco ? 1 : 0)).toString(),
        ]),
      });
    } catch {
      notify.error('Falha ao gerar a planilha Excel de clientes.');
    }
  };

  return {
    filteredClientes,
    searchTerm,
    setSearchTerm,
    formError,
    setFormError,
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
    currentClient,
    setCurrentClient,
    isEditing,
    isCepLoading,
    handleCepLookup,
    saveClient,
    deleteClient,
    confirmDelete,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    enderecosForm,
    addEnderecoField,
    removeEnderecoField,
    updateEnderecoField,
    exportPDF,
    exportExcel,
    hasUnsavedChanges,
    showUnsavedConfirm,
    confirmCloseModal,
    cancelCloseModal,
  };
}
