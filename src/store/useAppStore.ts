import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/auth-slice';
import { DataSlice, createDataSlice } from './slices/data-slice';
import { UISlice, createUISlice } from './slices/ui-slice';
import { DescarteSlice, createDescarteSlice } from './slices/descarte-slice';
import { CTRSlice, createCTRSlice } from './slices/ctr-slice';
import { Locacao, CacambaStatus, Cacamba } from '@/core/domain/types';

// Tipagem do Store Combinado
export type AppState = AuthSlice & DataSlice & UISlice & DescarteSlice & CTRSlice;

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (...a) => ({
        ...createAuthSlice(...a),
        ...createDataSlice(...a),
        ...createUISlice(...a),
        ...createDescarteSlice(...a),
        ...createCTRSlice(...a),
      }),
      {
        name: 'cacambago-storage-v2',
        partialize: (state) => ({
          ...state,
          ctrs: state.ctrs,
          ctrItems: state.ctrItems,
          locaisDescarte: state.locaisDescarte,
          localDescartePadraoId: state.localDescartePadraoId,
        }),
      }
    )
  )
);

/**
 * Middleware de Reação: Sincronização automática entre Locações e Caçambas.
 * Garante que mudanças em contratos reflitam nos ativos físicos sem intervenção manual.
 */
useAppStore.subscribe(
  (state) => state.locacoes,
  (locacoes, prevLocacoes) => {
    if (locacoes === prevLocacoes) return;
    
    const state = useAppStore.getState();
    const cacambas = state.cacambas;
    const perfil = state.perfil;
    
    let modified = false;
    const novasCacambas = cacambas.map(cabItem => {
      const c = cabItem as Cacamba;
      // Encontra a locação ativa para esta caçamba (qualquer uma que não esteja paga)
      const locAtiva = locacoes.find(l => 
        (l.status !== 'pago') && 
        (l.cacambaIds?.includes(c.id) || l.cacambaId === c.id)
      );

      if (locAtiva) {
        // Lógica de Status Automatizada baseada no novo fluxo
        let statusAlvo: CacambaStatus = 'locada';
        if (locAtiva.status === 'vencida') statusAlvo = 'vencida';
        else if (locAtiva.status === 'entrega_pendente') statusAlvo = 'entrega_pendente';
        else if (locAtiva.status === 'em_uso') statusAlvo = 'locada';

        if (c.status !== statusAlvo || c.lat !== locAtiva.lat || c.lng !== locAtiva.lng) {
          modified = true;
          return { 
            ...c, 
            status: statusAlvo, 
            lat: locAtiva.lat, 
            lng: locAtiva.lng, 
            enderecoAtual: locAtiva.enderecoObra,
            // Se mudou para em_uso, garante que tem data de entrega
            dataEntrega: locAtiva.status === 'em_uso' && !c.dataEntrega ? new Date().toISOString().split('T')[0] : c.dataEntrega
          } as Cacamba;
        }
      } else if (c.status === 'locada' || c.status === 'vencida' || c.status === 'entrega_pendente') {
        // Se não há locação ativa (ou a locação foi para 'pago'), volta para o pátio
        modified = true;
        return { 
          ...c, 
          status: 'disponivel' as CacambaStatus, 
          lat: perfil.lat || -23.5505, 
          lng: perfil.lng || -46.6333, 
          enderecoAtual: perfil.endereco || 'Pátio Principal',
          dataEntrega: null
        } as Cacamba;
      }
      return c;
    });

    if (modified) {
      state.setCacambas(novasCacambas);
    }
  }
);

/**
 * Seletores Granulares (Backward Compatibility)
 * Mantemos estes seletores para que os componentes existentes continuem funcionando sem alterações.
 */
export const useUsuarioAtual = () => useAppStore(s => s.usuarioAtual);
export const useClientes = () => useAppStore(s => s.clientes);
export const useCacambas = () => useAppStore(s => s.cacambas);
export const useLocacoes = () => useAppStore(s => s.locacoes);
export const useGastos = () => useAppStore(s => s.gastos);
export const usePerfil = () => useAppStore(s => s.perfil);
export const useConfiguracoes = () => useAppStore(s => s.configuracoes);
export const useNotificacoes = () => useAppStore(s => s.notificacoes);

/**
 * Seletores para CTR - Controle de Transporte de Resíduos
 */
export const useCTRs = () => useAppStore(s => s.ctrs);
export const useCTRItems = () => useAppStore(s => s.ctrItems);
export const useCTRAtual = () => useAppStore(s => s.ctrAtual);

/**
 * Seletores para Locais de Descarte
 */
export const useLocaisDescarte = () => useAppStore(s => s.locaisDescarte);
export const useLocalDescartePadrao = () => {
  const locais = useLocaisDescarte();
  return locais.find(l => l.isPadrao);
};
export const useLocalDescartePadraoId = () => useAppStore(s => s.localDescartePadraoId);
