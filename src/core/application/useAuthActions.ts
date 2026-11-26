import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { UserData } from '@/core/domain/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { firebaseAuth, googleAuthProvider } from '@/infrastructure/firebase/firebase';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  buildCurrentUserDataSnapshot,
  deduplicateNotificacoes,
  flushCloudSync,
  getDefaultUserData,
  getOAuthCallbackUrl,
  resetOperationalStore,
  setCloudWriteBlocked,
  translateAuthError,
} from '@/core/application/session-utils';

// Lock em memória por userId para evitar race condition entre login() e onAuthStateChange
const inFlightUserLoads = new Map<string, Promise<void>>();

function mergeArraysById<T extends { id?: string }>(arr1: T[], arr2: T[]): T[] {
  const map = new Map<string, T>();
  [...(arr1 || []), ...(arr2 || [])].forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  return Array.from(map.values());
}

export function useAuthActions() {
  const router = useRouter();

  const carregarDadosDoUsuario = async (userId: string, email: string, nome: string) => {
    const existingPromise = inFlightUserLoads.get(userId);
    if (existingPromise) {
      await existingPromise;
      return;
    }

    const loadTask = (async () => {
      let nomeFinal = nome;
      let cloudData: Partial<UserData> | null = null;
      let cloudReadFailed = false;
      let shouldPersistBack = false;

      if (isSupabaseConfigured) {
        try {
          const { data: dbPerfil, error } = await supabase
            .from('perfis')
            .select('nome, app_state')
            .eq('id', userId)
            .single();

          if (error) {
            const code = (error as { code?: string })?.code;
            if (code === 'PGRST116' || error.message?.includes('No rows')) {
              // Usuário recém-criado sem linha em perfis
              shouldPersistBack = true;
            } else {
              cloudReadFailed = true;
              console.warn(
                '[carregarDadosDoUsuario] falha ao buscar perfil; escrita remota bloqueada:',
                error
              );
            }
          } else if (dbPerfil) {
            nomeFinal = (dbPerfil as { nome?: string }).nome || nomeFinal;
            const rawState = (dbPerfil as { app_state?: Partial<UserData> | null }).app_state;
            if (rawState) {
              cloudData = rawState;
            } else {
              shouldPersistBack = true;
            }
          }
        } catch (err) {
          cloudReadFailed = true;
          console.warn('[carregarDadosDoUsuario] exceção na leitura remota:', err);
        }
      }

      setCloudWriteBlocked(cloudReadFailed ? userId : null);

      const storeState = useAppStore.getState();
      const localData = storeState.usersData[userId] || getDefaultUserData();

      const rawMergedNotifs = mergeArraysById(
        localData.notificacoes || [],
        cloudData?.notificacoes || []
      );
      const dedupedNotifs = deduplicateNotificacoes(rawMergedNotifs);
      if (rawMergedNotifs.length !== dedupedNotifs.length) {
        shouldPersistBack = true;
      }

      const mergedData: UserData = {
        clientes: mergeArraysById(localData.clientes || [], cloudData?.clientes || []),
        cacambas: mergeArraysById(localData.cacambas || [], cloudData?.cacambas || []),
        locacoes: mergeArraysById(localData.locacoes || [], cloudData?.locacoes || []),
        gastos: mergeArraysById(localData.gastos || [], cloudData?.gastos || []),
        notificacoes: dedupedNotifs,
        perfil: {
          ...localData.perfil,
          ...(cloudData?.perfil || {}),
          email: email || cloudData?.perfil?.email || localData.perfil.email || '',
        },
        configuracoes: {
          ...localData.configuracoes,
          ...(cloudData?.configuracoes || {}),
        },
        ctrs: mergeArraysById(localData.ctrs || [], cloudData?.ctrs || []),
        ctrItems: mergeArraysById(localData.ctrItems || [], cloudData?.ctrItems || []),
        locaisDescarte: mergeArraysById(
          localData.locaisDescarte || [],
          cloudData?.locaisDescarte || []
        ),
      };

      storeState.setUsuarioAtual({ id: userId, email, nome: nomeFinal });
      storeState.setClientes(mergedData.clientes);
      storeState.setCacambas(mergedData.cacambas);
      storeState.setLocacoes(mergedData.locacoes);
      storeState.setGastos(mergedData.gastos);
      storeState.setPerfil(mergedData.perfil);
      storeState.setNotificacoes(mergedData.notificacoes);
      storeState.updateConfiguracoes(mergedData.configuracoes);
      storeState.setCTRs(mergedData.ctrs || []);
      storeState.setCTRItems(mergedData.ctrItems || []);
      storeState.setLocaisDescarte(mergedData.locaisDescarte || []);
      storeState.resetCTRForm();

      const latestUsersData = useAppStore.getState().usersData;
      useAppStore.getState().setUsersData({
        ...latestUsersData,
        [userId]: { ...localData, ...mergedData },
      });

      // Nunca sobrescreve a nuvem se a leitura inicial falhou (correção AUD-02)
      if (!cloudReadFailed && (shouldPersistBack || (localData.locacoes?.length ?? 0) > 0)) {
        setTimeout(() => {
          void flushCloudSync();
        }, 400);
      }
    })();

    inFlightUserLoads.set(userId, loadTask);
    try {
      await loadTask;
    } finally {
      inFlightUserLoads.delete(userId);
    }
  };

  const syncCloud = async () => {
    return flushCloudSync();
  };

  const sync = () => {
    const state = useAppStore.getState();
    const user = state.usuarioAtual;
    if (!user) return;
    const data = buildCurrentUserDataSnapshot();
    state.setUsersData({ ...state.usersData, [user.id]: data });
  };

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: senha,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Usuário não retornado.');

      const userId = data.user.id;
      const nome =
        data.user.user_metadata?.nome ||
        data.user.user_metadata?.full_name ||
        cleanEmail.split('@')[0];

      await carregarDadosDoUsuario(userId, data.user.email || cleanEmail, nome);
      return { success: true };
    } catch (err: any) {
      console.error('Login Error:', err);
      return {
        success: false,
        error: translateAuthError(err?.message, 'E-mail ou senha incorretos.'),
      };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Autenticação direta com Google via Firebase Auth
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const user = result.user;
      if (!user || !user.email) {
        throw new Error('Não foi possível obter os dados da conta Google.');
      }

      const cleanEmail = user.email.toLowerCase().trim();
      const displayName = user.displayName || cleanEmail.split('@')[0] || 'Usuário';

      // Mapeamento canônico para o ID existente em produção caso seja borghelixcacambas@gmail.com
      const CANONICAL_BORGHELIX_ID = 'd80e7225-78eb-4bc1-9c3e-cb880e4ce228';
      const effectiveId = cleanEmail === 'borghelixcacambas@gmail.com' ? CANONICAL_BORGHELIX_ID : user.uid;

      await carregarDadosDoUsuario(effectiveId, cleanEmail, displayName);
      router.push('/');
      return { success: true };
    } catch (err: any) {
      console.error('Firebase Google Login Error:', err);
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'O login com Google foi cancelado.' };
      }
      if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'O provedor Google precisa ser ativado no Firebase Console (Authentication > Sign-in method > Google).',
        };
      }
      if (code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Requisição de login concorrente cancelada.' };
      }
      return {
        success: false,
        error: err?.message || 'Falha ao autenticar com a conta Google.',
      };
    }
  };

  const linkGoogleIdentity = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectTo = getOAuthCallbackUrl('link');
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Link Google Error:', err);
      return {
        success: false,
        error: translateAuthError(err?.message, 'Não foi possível vincular sua conta Google.'),
      };
    }
  };

  const register = async (
    nome: string,
    email: string,
    senha: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: { nome: nome.trim() },
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Register Error:', err);
      return {
        success: false,
        error: translateAuthError(err?.message, 'Erro ao criar conta.'),
      };
    }
  };

  const resendOtp = async (
    email: string,
    type: 'signup' | 'recovery'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim(),
        });
        if (error) throw error;
        return { success: true };
      }
      return sendPasswordReset(email);
    } catch (err: any) {
      console.error('Resend OTP Error:', err);
      return {
        success: false,
        error: translateAuthError(err?.message, 'Erro ao reenviar código.'),
      };
    }
  };

  const verifyOtp = async (
    email: string,
    token: string,
    type: 'signup' | 'recovery' | 'magiclink'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type,
      });

      if (error) throw error;

      if (type === 'signup' && data.user) {
        const userId = data.user.id;
        const nome = data.user.user_metadata?.nome || cleanEmail.split('@')[0];
        await carregarDadosDoUsuario(userId, data.user.email || cleanEmail, nome);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      return {
        success: false,
        error: translateAuthError(err?.message, 'Código inválido ou expirado.'),
      };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      return {
        success: false,
        error: translateAuthError(err?.message, 'Erro ao solicitar recuperação.'),
      };
    }
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Update Password Error:', err);
      return {
        success: false,
        error: translateAuthError(err?.message, 'Erro ao atualizar a senha.'),
      };
    }
  };

  const logout = async () => {
    sync();
    // Tentativa rápida de envio final à nuvem antes de invalidar sessão
    await Promise.race([
      flushCloudSync().catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    await Promise.all([
      supabase.auth.signOut().catch(() => undefined),
      fbSignOut(firebaseAuth).catch(() => undefined),
    ]);
    setCloudWriteBlocked(null);
    resetOperationalStore();
    router.push('/login');
  };

  return {
    login,
    loginWithGoogle,
    linkGoogleIdentity,
    register,
    verifyOtp,
    sendPasswordReset,
    resetPassword,
    resendOtp,
    logout,
    sync,
    syncCloud,
    carregarDadosDoUsuario,
  };
}
