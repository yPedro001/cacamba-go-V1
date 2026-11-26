import { useAppStore } from '@/store/useAppStore';
import { Locacao, Cliente, Cacamba, Perfil, Gasto, ClienteEndereco } from '@/core/domain/types';
import { isLocacaoEncerrada } from '@/core/domain/business-logic';
import { getLocalTodayISO } from '@/lib/domain-helpers';
import {
  resetOperationalStore,
  scheduleCloudSync,
  setCloudWriteBlocked,
} from '@/core/application/session-utils';
import { supabase } from '@/lib/supabase';

/**
 * useDataActions: Orquestrador central de mutações de dados do sistema.
 * Usa `useAppStore.getState()` dentro das ações para evitar closures desatualizadas (stale state)
 * e agendando sincronização coalescida em nuvem.
 */
export function useDataActions() {
  const sync = () => {
    scheduleCloudSync(300);
  };

  // --- AÇÕES DE LOCAÇÃO ---

  const addLocacao = (l: Locacao) => {
    const state = useAppStore.getState();
    const disponiveis = state.cacambas.filter((c) => c.status === 'disponivel');

    const requestedQty = Math.max(1, l.quantidadeCacambas || 1);
    const chosenIds: string[] = [];

    // Respeita a caçamba selecionada manualmente pelo usuário (se disponível)
    if (l.cacambaId) {
      const preferred = disponiveis.find((c) => c.id === l.cacambaId);
      if (preferred) {
        chosenIds.push(preferred.id);
      }
    }

    // Respeita lista pré-alocada explícita caso exista
    if (Array.isArray(l.cacambaIds)) {
      for (const cid of l.cacambaIds) {
        if (chosenIds.length >= requestedQty) break;
        if (!chosenIds.includes(cid) && disponiveis.some((d) => d.id === cid)) {
          chosenIds.push(cid);
        }
      }
    }

    // Completa o restante da quantidade com caçambas disponíveis
    for (const cab of disponiveis) {
      if (chosenIds.length >= requestedQty) break;
      if (!chosenIds.includes(cab.id)) {
        chosenIds.push(cab.id);
      }
    }

    const novaLocacao: Locacao = {
      ...l,
      cacambaId: chosenIds[0] || l.cacambaId,
      cacambaIds: chosenIds,
      status: l.status || 'entrega_pendente',
    };

    state.setLocacoes([...state.locacoes, novaLocacao]);
    sync();
  };

  const updateLocacao = (id: string, updated: Partial<Locacao>) => {
    const state = useAppStore.getState();
    const nextLocacoes = state.locacoes.map((l) => {
      if (l.id !== id) return l;

      const merged: Locacao = { ...l, ...updated };

      // Se editou a caçamba específica numa locação simples e não informou cacambaIds novos, realinha o array
      if (
        updated.cacambaId &&
        updated.cacambaId !== l.cacambaId &&
        !updated.cacambaIds &&
        (merged.quantidadeCacambas || 1) === 1
      ) {
        merged.cacambaIds = [updated.cacambaId];
      }

      if (updated.status === 'pago' && !merged.dataPagamento) {
        merged.dataPagamento = getLocalTodayISO();
      }

      return merged;
    });

    state.setLocacoes(nextLocacoes);
    sync();
  };

  const advanceRentalStatus = (id: string) => {
    const state = useAppStore.getState();
    const loc = state.locacoes.find((l) => l.id === id);
    if (!loc || isLocacaoEncerrada(loc.status)) return;

    const statusFlow: Locacao['status'][] = ['entrega_pendente', 'em_uso', 'vencida', 'pago'];
    const currentIndex = statusFlow.indexOf(loc.status);

    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      const updates: Partial<Locacao> = { status: nextStatus };

      if (nextStatus === 'pago') {
        updates.dataPagamento = getLocalTodayISO();
      }

      updateLocacao(id, updates);
    }
  };

  const removeLocacao = (id: string) => {
    const state = useAppStore.getState();
    state.setLocacoes(state.locacoes.filter((l) => l.id !== id));
    sync();
  };

  // --- AÇÕES DE CLIENTES ---

  const addCliente = (c: Cliente) => {
    const state = useAppStore.getState();
    const novoCliente: Cliente = {
      ...c,
      enderecos:
        c.enderecos && c.enderecos.length > 0
          ? c.enderecos
          : c.endereco
            ? [
                {
                  id: crypto.randomUUID(),
                  nome: 'Principal',
                  rua: c.endereco.split(',')[0]?.trim() || c.endereco,
                  numero: c.endereco.split(',')[1]?.split('-')[0]?.trim() || 'S/N',
                  cidade: c.endereco.split('-')[1]?.trim() || '',
                  cep: c.endereco.split('-')[2]?.trim() || '',
                },
              ]
            : [],
    };
    state.setClientes([...state.clientes, novoCliente]);
    sync();
  };

  const updateCliente = (id: string, updated: Partial<Cliente>) => {
    const state = useAppStore.getState();
    state.setClientes(state.clientes.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    sync();
  };

  const addEnderecoAoCliente = (clienteId: string, endereco: Omit<ClienteEndereco, 'id'> | ClienteEndereco) => {
    const state = useAppStore.getState();
    const cliente = state.clientes.find((c) => c.id === clienteId);
    if (!cliente) return;

    const novoEndereco: ClienteEndereco = {
      ...endereco,
      id: 'id' in endereco && endereco.id ? endereco.id : crypto.randomUUID(),
    };

    updateCliente(clienteId, {
      enderecos: [...(cliente.enderecos || []), novoEndereco],
    });
  };

  const removeCliente = (id: string) => {
    const state = useAppStore.getState();
    state.setClientes(state.clientes.filter((c) => c.id !== id));
    sync();
  };

  // --- AÇÕES DE INVENTÁRIO (CAÇAMBAS) ---

  const addCacamba = (c: Cacamba) => {
    const state = useAppStore.getState();
    state.setCacambas([...state.cacambas, c]);
    sync();
  };

  const updateCacamba = (id: string, updated: Partial<Cacamba>) => {
    const state = useAppStore.getState();
    state.setCacambas(state.cacambas.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    sync();
  };

  const removeCacamba = (id: string) => {
    const state = useAppStore.getState();
    state.setCacambas(state.cacambas.filter((c) => c.id !== id));
    sync();
  };

  const addCacambasBatch = (novas: Cacamba[]) => {
    const state = useAppStore.getState();
    state.setCacambas([...state.cacambas, ...novas]);
    sync();
  };

  // --- PERFIL & GASTOS ---

  const updatePerfil = (p: Partial<Perfil>) => {
    const state = useAppStore.getState();
    state.setPerfil({ ...state.perfil, ...p });
    sync();
  };

  const addGasto = (g: Gasto) => {
    const state = useAppStore.getState();
    state.setGastos([...state.gastos, g]);
    sync();
  };

  const removeGasto = (id: string) => {
    const state = useAppStore.getState();
    state.setGastos(state.gastos.filter((g) => g.id !== id));
    sync();
  };

  const logout = async () => {
    sync();
    await supabase.auth.signOut().catch(() => undefined);
    setCloudWriteBlocked(null);
    resetOperationalStore();
    window.location.href = '/login';
  };

  const deleteAccount = async () => {
    await supabase.auth.signOut().catch(() => undefined);
    setCloudWriteBlocked(null);
    localStorage.removeItem('cacambago-storage-v2');
    resetOperationalStore();
    window.location.href = '/login';
  };

  return {
    addLocacao,
    updateLocacao,
    removeLocacao,
    advanceRentalStatus,
    addCliente,
    updateCliente,
    removeCliente,
    addEnderecoAoCliente,
    addCacamba,
    updateCacamba,
    removeCacamba,
    addCacambasBatch,
    updatePerfil,
    addGasto,
    removeGasto,
    logout,
    deleteAccount,
  };
}
