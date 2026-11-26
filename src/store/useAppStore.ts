import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/auth-slice';
import { DataSlice, createDataSlice } from './slices/data-slice';
import { UISlice, createUISlice, Notificacao } from './slices/ui-slice';
import { DescarteSlice, createDescarteSlice } from './slices/descarte-slice';
import { CTRSlice, createCTRSlice } from './slices/ctr-slice';
import { CacambaStatus, Cacamba } from '@/core/domain/types';
import { isLocacaoEncerrada } from '@/core/domain/business-logic';
import { getLocalTodayISO } from '@/lib/domain-helpers';

export type AppState = AuthSlice & DataSlice & UISlice & DescarteSlice & CTRSlice;

function compactNotificacoes(list: unknown): Notificacao[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: Notificacao[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const n = item as Notificacao;
    const sig = `${n.tipo || ''}|${n.titulo || ''}|${n.mensagem || ''}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(n);
    if (out.length >= 100) break;
  }
  return out;
}

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
          usersData: state.usersData,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
        version: 4,
        migrate: (persistedState) => {
          try {
            const persisted = persistedState as Partial<AppState> | undefined;
            const rawUsersData = { ...(persisted?.usersData || {}) };
            const activeUserId = persisted?.usuarioAtual?.id;
            if (activeUserId && persisted) {
              rawUsersData[activeUserId] = {
                clientes: Array.isArray(persisted.clientes) ? persisted.clientes : [],
                cacambas: Array.isArray(persisted.cacambas) ? persisted.cacambas : [],
                locacoes: Array.isArray(persisted.locacoes) ? persisted.locacoes : [],
                gastos: Array.isArray(persisted.gastos) ? persisted.gastos : [],
                perfil: (persisted.perfil as any) || undefined,
                notificacoes: compactNotificacoes(persisted.notificacoes),
                configuracoes: (persisted.configuracoes as any) || { pularConfirmacaoExclusao: false },
                ctrs: Array.isArray((persisted as any).ctrs) ? (persisted as any).ctrs : [],
                ctrItems: Array.isArray((persisted as any).ctrItems) ? (persisted as any).ctrItems : [],
                locaisDescarte: Array.isArray((persisted as any).locaisDescarte) ? (persisted as any).locaisDescarte : [],
              };
            }
            for (const uid of Object.keys(rawUsersData)) {
              if (rawUsersData[uid]?.notificacoes) {
                rawUsersData[uid] = {
                  ...rawUsersData[uid],
                  notificacoes: compactNotificacoes(rawUsersData[uid].notificacoes),
                };
              }
            }
            return {
              usersData: rawUsersData,
              sidebarCollapsed: Boolean(persisted?.sidebarCollapsed),
            } as AppState;
          } catch (e) {
            console.warn('[persist migrate] falha, resetando storage:', e);
            return { usersData: {}, sidebarCollapsed: false } as AppState;
          }
        },
        onRehydrateStorage: () => (_state, error) => {
          if (error) {
            console.error('[persist] rehydrate error:', error);
          }
        },
      }
    )
  )
);

/**
 * Middleware de Reação: Sincronização automática entre Locações e Caçambas.
 * Somente locações NÃO encerradas (`!isLocacaoEncerrada`) ocupam caçambas.
 */
useAppStore.subscribe(
  (state) => state.locacoes,
  (locacoes, prevLocacoes) => {
    if (locacoes === prevLocacoes) return;

    const state = useAppStore.getState();
    const cacambas = state.cacambas;
    const perfil = state.perfil;

    let modified = false;
    const novasCacambas = cacambas.map((cabItem) => {
      const c = cabItem as Cacamba;
      const locAtiva = locacoes.find(
        (l) => !isLocacaoEncerrada(l.status) && (l.cacambaIds?.includes(c.id) || l.cacambaId === c.id)
      );

      if (locAtiva) {
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
            dataEntrega:
              locAtiva.status === 'em_uso' && !c.dataEntrega ? getLocalTodayISO() : c.dataEntrega,
          } as Cacamba;
        }
      } else if (c.status === 'locada' || c.status === 'vencida' || c.status === 'entrega_pendente') {
        modified = true;
        return {
          ...c,
          status: 'disponivel' as CacambaStatus,
          lat: perfil.lat || -23.5505,
          lng: perfil.lng || -46.6333,
          enderecoAtual: perfil.endereco || 'Pátio Principal',
          dataEntrega: null,
        } as Cacamba;
      }
      return c;
    });

    if (modified) {
      state.setCacambas(novasCacambas);
    }
  }
);

export const useUsuarioAtual = () => useAppStore((s) => s.usuarioAtual);
export const useClientes = () => useAppStore((s) => s.clientes);
export const useCacambas = () => useAppStore((s) => s.cacambas);
export const useLocacoes = () => useAppStore((s) => s.locacoes);
export const useGastos = () => useAppStore((s) => s.gastos);
export const usePerfil = () => useAppStore((s) => s.perfil);
export const useConfiguracoes = () => useAppStore((s) => s.configuracoes);
export const useNotificacoes = () => useAppStore((s) => s.notificacoes);
export const useCTRs = () => useAppStore((s) => s.ctrs);
export const useCTRItems = () => useAppStore((s) => s.ctrItems);
export const useCTRAtual = () => useAppStore((s) => s.ctrAtual);
export const useCtrNumeroPendente = () => useAppStore((s) => s.ctrNumeroPendente);
export const useSetCtrNumeroPendente = () => useAppStore((s) => s.setCtrNumeroPendente);
export const useResetCTRForm = () => useAppStore((s) => s.resetCTRForm);
export const useLocaisDescarte = () => useAppStore((s) => s.locaisDescarte);
export const useLocalDescartePadrao = () => {
  const locais = useLocaisDescarte();
  const padraoId = useAppStore((s) => s.localDescartePadraoId);
  return locais.find((l) => l.id === padraoId) || locais.find((l) => l.isPadrao) || locais[0];
};
export const useLocalDescartePadraoId = () => useAppStore((s) => s.localDescartePadraoId);
