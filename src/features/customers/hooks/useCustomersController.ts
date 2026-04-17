import { useState, useCallback, useMemo } from 'react';
import { useClientes, useConfiguracoes } from '@/store/useAppStore';
import { Cliente, ClienteEndereco } from '@/core/domain/types';
import { geocodeService } from '@/infrastructure/api/geocode-service';
import { useDataActions } from '@/core/application/useDataActions';
import { exportService } from '@/infrastructure/services/export-service';

export function useCustomersController() {
  const clientes = useClientes();
  const configuracoes = useConfiguracoes();
  const { addCliente, updateCliente, removeCliente } = useDataActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Cliente>>({});
  const [savedClient, setSavedClient] = useState<Partial<Cliente>>({}); // Último estado salvo
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientIdToDelete, setClientIdToDelete] = useState<string | null>(null);

  // Estado para gerenciar múltiplos endereços no formulário
  const [enderecosForm, setEnderecosForm] = useState<Partial<ClienteEndereco>[]>([]);
  const [savedEnderecos, setSavedEnderecos] = useState<Partial<ClienteEndereco>[]>([]);

  // Estado para o diálogo de confirmação
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const filteredClientes = (clientes || [])
    .filter(c => {
      const nome = c?.nome?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      const telefone = c?.telefone || '';
      const enderecoLegado = c?.endereco?.toLowerCase() || '';
      
      return nome.includes(search) || 
             telefone.includes(searchTerm) ||
             enderecoLegado.includes(search) ||
             (c?.enderecos?.some(e => e.rua?.toLowerCase().includes(search)) ?? false);
    })
    .sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || ''));

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
    if (!currentClient.nome || !currentClient.telefone) {
      alert("Nome e Telefone são obrigatórios.");
      return;
    }

    // Validação mínima de endereços
    const enderecosValidos = enderecosForm.filter(e => e.nome && e.rua && e.cidade) as ClienteEndereco[];
    
    // Manter o campo endereco legado como o primeiro endereço para compatibilidade
    const legacyEndereco = enderecosValidos[0] 
      ? `${enderecosValidos[0].rua}, ${enderecosValidos[0].numero || 'S/N'} - ${enderecosValidos[0].cidade} - ${enderecosValidos[0].cep || ''}`
      : '';

    const payload = { 
      ...currentClient, 
      enderecos: enderecosValidos,
      endereco: legacyEndereco // Snapshot para compatibilidade
    } as Cliente;

    if (isEditing && currentClient.id) {
      updateCliente(currentClient.id, payload);
    } else {
      addCliente({ ...payload, id: Date.now().toString(), dataCadastro: new Date().toISOString().split('T')[0] });
    }
    
    // Salva o estado como "último salvo" após sucesso
    setSavedClient(currentClient);
    setSavedEnderecos(enderecosForm);
    
    handleCloseModal(true); // Force close após salvar
  };

  const deleteClient = (id: string) => {
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

  const exportPDF = () => {
    exportService.exportPDF({
      title: 'Relatório Geral de Clientes',
      filename: `clientes_cacambago_${Date.now()}`,
      headers: ['Nome', 'Documento', 'Telefone', 'E-mail', 'Endereços'],
      data: filteredClientes.map(c => [
        c.nome,
        c.cpfCnpj || '-',
        c.telefone || '-',
        c.email || '-',
        (c.enderecos || []).map(e => `${e.nome}: ${e.rua}, ${e.numero}`).join(' | ') || (c.endereco ? `Legado: ${c.endereco}` : '-')
      ])
    });
  };

  const exportExcel = async () => {
    await exportService.exportExcel({
      title: 'Clientes CaçambaGo',
      filename: `clientes_excel_${Date.now()}`,
      headers: ['Nome', 'CPF/CNPJ', 'Telefone', 'E-mail', 'Qtd Endereços'],
      data: filteredClientes.map(c => [
        c.nome,
        c.cpfCnpj || '',
        c.telefone || '',
        c.email || '',
        (c.enderecos?.length || (c.endereco ? 1 : 0)).toString()
      ])
    });
  };

  return {
    filteredClientes,
    searchTerm,
    setSearchTerm,
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
    // Novos: proteção contra alterações não salvas
    hasUnsavedChanges,
    showUnsavedConfirm,
    confirmCloseModal,
    cancelCloseModal,
  };
}
