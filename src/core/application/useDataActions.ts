import { useAppStore } from '@/store/useAppStore';
import { Locacao, Cliente, Cacamba, Perfil, Gasto } from '@/core/domain/types';

/**
 * useDataActions: Orquestrador central de mutações de dados do sistema.
 * Segue o padrão de Camada de Aplicação, desacoplando a UI do Store.
 */
export function useDataActions() {
  const { 
    cacambas, 
    locacoes, 
    clientes,
    setLocacoes, 
    setClientes,
    setCacambas,
    setPerfil,
    setGastos,
    gastos
  } = useAppStore();

  const sync = () => {
    // Espaço para futuras integrações com persistência Cloud
  };

  // --- AÇÕES DE LOCAÇÃO ---

  const addLocacao = (l: Locacao) => {
    const disponiveis = cacambas.filter(c => c.status === 'disponivel');
    const count = Math.min(l.quantidadeCacambas, disponiveis.length);
    const alocadas = disponiveis.slice(0, count);
    const ids = alocadas.map(c => c.id);
    
    // Status inicial padrão é entrega_pendente
    const novaLocacao = { ...l, cacambaIds: ids, status: l.status || 'entrega_pendente' as const };
    setLocacoes([...locacoes, novaLocacao]);
    sync();
  };

  const updateLocacao = (id: string, updated: Partial<Locacao>) => {
    setLocacoes(locacoes.map(l => l.id === id ? { ...l, ...updated } : l));
    sync();
  };

  const advanceRentalStatus = (id: string) => {
    const loc = locacoes.find(l => l.id === id);
    if (!loc) return;

    const statusFlow: Locacao['status'][] = ['entrega_pendente', 'em_uso', 'vencida', 'pago'];
    const currentIndex = statusFlow.indexOf(loc.status);
    
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      const updates: Partial<Locacao> = { status: nextStatus };
      
      if (nextStatus === 'pago') {
        updates.dataPagamento = new Date().toISOString().split('T')[0];
      }
      
      updateLocacao(id, updates);
    }
  };

  const removeLocacao = (id: string) => {
    setLocacoes(locacoes.filter(l => l.id !== id));
    sync();
  };

  // --- AÇÕES DE CLIENTES ---

  const addCliente = (c: Cliente) => {
    setClientes([...clientes, c]);
    sync();
  };

  const updateCliente = (id: string, updated: Partial<Cliente>) => {
    setClientes(clientes.map(c => c.id === id ? { ...c, ...updated } : c));
    sync();
  };

  const removeCliente = (id: string) => {
    setClientes(clientes.filter(c => c.id !== id));
    sync();
  };

  // --- AÇÕES DE INVENTÁRIO (CAÇAMBAS) ---

  const addCacamba = (c: Cacamba) => {
    setCacambas([...cacambas, c]);
    sync();
  };

  const updateCacamba = (id: string, updated: Partial<Cacamba>) => {
    setCacambas(cacambas.map(c => c.id === id ? { ...c, ...updated } : c));
    sync();
  };

  const removeCacamba = (id: string) => {
    setCacambas(cacambas.filter(c => c.id !== id));
    sync();
  };

  const addCacambasBatch = (novas: Cacamba[]) => {
    setCacambas([...cacambas, ...novas]);
    sync();
  };

  return { 
    addLocacao, updateLocacao, removeLocacao, advanceRentalStatus,
    addCliente, updateCliente, removeCliente,
    addCacamba, updateCacamba, removeCacamba,
    addCacambasBatch,
    updatePerfil: (p: Partial<Perfil>) => { 
      const current = useAppStore.getState().perfil;
      setPerfil({ ...current, ...p }); 
      sync(); 
    },
    addGasto: (g: Gasto) => { setGastos([...gastos, g]); sync(); },
    removeGasto: (id: string) => { setGastos(gastos.filter(g => g.id !== id)); sync(); },
    logout: () => { 
      useAppStore.getState().setUsuarioAtual(null); 
      window.location.href = '/login'; 
    },
    deleteAccount: () => {
      // Lógica de deleção (ex: limpar storage e redirecionar)
      localStorage.clear();
      window.location.href = '/login';
    }
  };
}
