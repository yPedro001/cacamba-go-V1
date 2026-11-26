import { UserData } from '@/core/domain/types';
import { Notificacao } from '@/store/slices/ui-slice';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export const MAX_NOTIFICACOES_RETIDAS = 100;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(str?: string | null): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str.trim());
}

/** Estado neutro padrão ao criar usuário novo ou resetar sessão em memória. */
export function getDefaultUserData(
  perfilLat: number = -23.5505,
  perfilLng: number = -46.6333
): UserData {
  return {
    clientes: [],
    cacambas: [],
    locacoes: [],
    gastos: [],
    perfil: {
      nomeEmpresa: 'Minha Empresa de Caçambas',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      lat: perfilLat,
      lng: perfilLng,
      padroes: {
        valorAluguel: 300,
        tamanhoCacamba: '5m',
        prefixoCacamba: 'C-',
        taxaMaquininhaPadrao: 0,
        jurosParcelamento: 0,
        parcelasSemJuros: 1,
      },
    },
    notificacoes: [],
    configuracoes: { pularConfirmacaoExclusao: false },
    ctrs: [],
    ctrItems: [],
    locaisDescarte: [],
  };
}

/**
 * Remove duplicatas históricas acumuladas em `notificacoes` (preservando alertas únicos mais recentes).
 * Não altera clientes, locações, caçambas, gastos, CTRs ou perfil.
 */
export function deduplicateNotificacoes(notifs: Notificacao[] | undefined | null): Notificacao[] {
  if (!Array.isArray(notifs) || notifs.length === 0) return [];
  const sorted = [...notifs].sort((a, b) =>
    String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || ''))
  );
  const seenSig = new Set<string>();
  const seenId = new Set<string>();
  const result: Notificacao[] = [];

  for (const n of sorted) {
    if (!n || !n.titulo) continue;
    const sig = `${n.tipo || ''}|${n.titulo || ''}|${n.mensagem || ''}`;
    if (seenSig.has(sig) || (n.id && seenId.has(n.id))) continue;
    seenSig.add(sig);
    if (n.id) seenId.add(n.id);
    result.push(n);
    if (result.length >= MAX_NOTIFICACOES_RETIDAS) break;
  }

  return result;
}

/** Reseta completamente os dados operacionais em RAM (mantendo apenas `usersData` e `sidebarCollapsed`). */
export function resetOperationalStore(): void {
  const defaults = getDefaultUserData();
  useAppStore.setState({
    usuarioAtual: null,
    clientes: [],
    cacambas: [],
    locacoes: [],
    gastos: [],
    perfil: defaults.perfil,
    notificacoes: [],
    configuracoes: defaults.configuracoes,
    ctrs: [],
    ctrItems: [],
    ctrAtual: null,
    ctrAtualId: null,
    ctrNumeroPendente: null,
    locaisDescarte: [],
    localDescartePadraoId: null,
  });
}

// Proteção contra sobrescrita remota caso leitura inicial de `perfis` falhe (AUD-02)
let cloudWriteBlockedForUser: string | null = null;
let cloudSyncChain: Promise<void> = Promise.resolve();
let cloudSyncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function setCloudWriteBlocked(userId: string | null): void {
  cloudWriteBlockedForUser = userId;
}

export function isCloudWriteBlocked(userId: string | undefined): boolean {
  return Boolean(userId && cloudWriteBlockedForUser === userId);
}

/** Monta snapshot completo atual do usuário a partir do store Zustand. */
export function buildCurrentUserDataSnapshot(): UserData {
  const state = useAppStore.getState();
  return {
    clientes: state.clientes,
    cacambas: state.cacambas,
    locacoes: state.locacoes,
    gastos: state.gastos,
    perfil: state.perfil,
    notificacoes: deduplicateNotificacoes(state.notificacoes),
    configuracoes: state.configuracoes,
    ctrs: state.ctrs,
    ctrItems: state.ctrItems,
    locaisDescarte: state.locaisDescarte,
  };
}

/** Executa persistência serializada no Supabase (`perfis.upsert`) evitando corridas fora de ordem. */
export async function flushCloudSync(): Promise<{ synced: boolean; error?: string }> {
  const state = useAppStore.getState();
  const user = state.usuarioAtual;
  if (!user || !isSupabaseConfigured) {
    return { synced: false };
  }
  if (isCloudWriteBlocked(user.id)) {
    return {
      synced: false,
      error: 'Sincronização em nuvem pausada até restabelecer leitura segura do perfil.',
    };
  }

  let outcome: { synced: boolean; error?: string } = { synced: false };

  cloudSyncChain = cloudSyncChain.then(async () => {
    const latest = useAppStore.getState();
    const activeUser = latest.usuarioAtual;
    if (!activeUser || activeUser.id !== user.id || isCloudWriteBlocked(activeUser.id)) {
      return;
    }
    const dataToSync = buildCurrentUserDataSnapshot();
    latest.setUsersData({ ...latest.usersData, [activeUser.id]: dataToSync });

    try {
      const validUuid = isValidUUID(activeUser.id) ? activeUser.id : null;
      // 1. Tenta persistência via RPC SECURITY DEFINER (compatível com Supabase e Firebase Google Auth)
      const { data: rpcSuccess, error: rpcError } = await supabase.rpc('salvar_perfil_usuario', {
        p_id: validUuid,
        p_email: activeUser.email,
        p_nome: activeUser.nome || activeUser.email.split('@')[0],
        p_app_state: dataToSync,
      });

      if (!rpcError && rpcSuccess) {
        outcome = { synced: true };
      } else {
        // 2. Fallback: upsert direto tradicional caso RPC não esteja disponível
        const { error } = await supabase.from('perfis').upsert(
          {
            id: activeUser.id,
            nome: activeUser.nome || activeUser.email.split('@')[0],
            email: activeUser.email,
            app_state: dataToSync,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        if (error) {
          console.warn('[syncCloud] falha no upsert do perfil:', error.message);
          outcome = { synced: false, error: error.message };
        } else {
          outcome = { synced: true };
        }
      }
    } catch (err: any) {
      console.warn('[syncCloud] exceção:', err);
      outcome = { synced: false, error: err?.message || 'Erro de rede na sincronização' };
    }
  });

  await cloudSyncChain;
  return outcome;
}

/** Agenda envio coalescido para o Supabase após mutações locais rápidas. */
export function scheduleCloudSync(delayMs: number = 350): void {
  const state = useAppStore.getState();
  const userId = state.usuarioAtual?.id;
  if (!userId) return;

  const snapshot = buildCurrentUserDataSnapshot();
  state.setUsersData({ ...state.usersData, [userId]: snapshot });

  if (cloudSyncDebounceTimer) {
    clearTimeout(cloudSyncDebounceTimer);
  }
  cloudSyncDebounceTimer = setTimeout(() => {
    cloudSyncDebounceTimer = null;
    void flushCloudSync();
  }, delayMs);
}

/** Retorna URL de callback OAuth respeitando o domínio atual ou NEXT_PUBLIC_SITE_URL. */
export function getOAuthCallbackUrl(mode: 'login' | 'link'): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${origin.replace(/\/$/, '')}/auth/callback?mode=${mode}`;
}

/** Traduz erros comuns de OAuth/Auth do Supabase para mensagens claras em português. */
export function translateAuthError(message: string | undefined, fallback: string): string {
  const msg = (message || '').toLowerCase();
  if (!msg) return fallback;
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
    return 'Login com Google ainda não está ativado no Supabase deste projeto. Ative o provedor Google em Authentication > Providers no painel do Supabase.';
  }
  if (msg.includes('rate limit')) {
    return 'Limite de solicitações atingido. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (msg.includes('already registered')) {
    return 'Este e-mail já está cadastrado no sistema.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique o código enviado para sua caixa de entrada.';
  }
  return message || fallback;
}
