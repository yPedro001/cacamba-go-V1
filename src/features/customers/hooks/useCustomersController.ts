import { useState, useCallback } from 'react';
import { useClientes, useConfiguracoes } from '@/store/useAppStore';
import { Cliente } from '@/core/domain/types';
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
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientIdToDelete, setClientIdToDelete] = useState<string | null>(null);

  const [enderecoForm, setEnderecoForm] = useState({ rua: '', numero: '', cidade: '', cep: '' });

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.telefone?.includes(searchTerm) ?? false) ||
    (c.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleOpenModal = useCallback((cliente?: Cliente) => {
    if (cliente) {
      setCurrentClient(cliente);
      const parts = (cliente.endereco || '').split(' - ');
      const ruaNum = (parts[0] || '').split(',');
      setEnderecoForm({
        rua: (ruaNum[0] || '').trim() || cliente.endereco,
        numero: (ruaNum[1] || '').trim(),
        cidade: (parts[1] || '').trim(),
        cep: (parts[2] || '').trim()
      });
      setIsEditing(true);
    } else {
      setCurrentClient({ nome: '', cpfCnpj: '', telefone: '', email: '', endereco: '' });
      setEnderecoForm({ rua: '', numero: '', cidade: '', cep: '' });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClient({});
  };

  const handleCepLookup = async (cep: string) => {
    setIsCepLoading(true);
    const data = await geocodeService.fetchByCep(cep);
    setIsCepLoading(false);
    if (!data) return;

    setEnderecoForm(prev => ({
      ...prev,
      rua: data.rua || prev.rua,
      cidade: data.cidade || prev.cidade,
      cep: data.cep || prev.cep
    }));
  };

  const saveClient = () => {
    if (!currentClient.nome || !currentClient.telefone) {
      alert("Nome e Telefone são obrigatórios.");
      return;
    }

    const { rua, numero, cidade, cep } = enderecoForm;
    const finalEndereco = rua ? `${rua}, ${numero || 'S/N'} - ${cidade || 'Sem Cidade'} - ${cep || 'Sem CEP'}` : '';
    const payload = { ...currentClient, endereco: finalEndereco } as Cliente;

    if (isEditing && currentClient.id) {
      updateCliente(currentClient.id, payload);
    } else {
      addCliente({ ...payload, id: Date.now().toString() });
    }
    handleCloseModal();
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
      headers: ['Nome', 'Documento', 'Telefone', 'E-mail', 'Endereço'],
      data: filteredClientes.map(c => [
        c.nome,
        c.cpfCnpj || '-',
        c.telefone || '-',
        c.email || '-',
        c.endereco || '-'
      ])
    });
  };

  const exportExcel = () => {
    exportService.exportExcel({
      title: 'Clientes CaçambaGo',
      filename: `clientes_excel_${Date.now()}`,
      headers: ['Nome', 'CPF/CNPJ', 'Telefone', 'E-mail', 'Endereço'],
      data: filteredClientes.map(c => [
        c.nome,
        c.cpfCnpj || '',
        c.telefone || '',
        c.email || '',
        c.endereco || ''
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
    enderecoForm,
    setEnderecoForm,
    exportPDF,
    exportExcel
  };
}
