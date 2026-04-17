import { useAppStore } from '@/store/useAppStore';
import { UserData } from '@/core/domain/types';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useAuthActions() {
  const router = useRouter();
  const usersData = useAppStore(s => s.usersData);
  const { 
    setUsuarioAtual, 
    setUsersData,
    setClientes,
    setCacambas,
    setLocacoes,
    setGastos,
    setPerfil,
    setNotificacoes
  } = useAppStore();

  const getDefaultUserData = (perfilLat: number = -23.5505, perfilLng: number = -46.6333): UserData => ({
    clientes: [],
    cacambas: [
      { id: '1', codigo: 'C-001', tamanho: '5m', status: 'disponivel', lat: perfilLat, lng: perfilLng, enderecoAtual: 'Pátio Central', historico: [] },
      { id: '2', codigo: 'C-002', tamanho: '5m', status: 'disponivel', lat: perfilLat, lng: perfilLng, enderecoAtual: 'Pátio Central', historico: [] },
    ],
    locacoes: [],
    gastos: [],
    perfil: {
      nomeEmpresa: 'Minha Empresa de Caçambas',
      cnpj: '', telefone: '', email: '', endereco: '',
      lat: perfilLat, lng: perfilLng,
      padroes: { 
        valorAluguel: 300, 
        tamanhoCacamba: '5m', 
        prefixoCacamba: 'C-',
        taxaMaquininhaPadrao: 0,
        jurosParcelamento: 0,
        parcelasSemJuros: 1
      }
    },
    notificacoes: [],
    configuracoes: { pularConfirmacaoExclusao: false }
  });

  const carregarDadosDoUsuario = async (userId: string, email: string, nome: string) => {
    let nomeFinal = nome;
    let cloudData: Partial<UserData> | null = null;
    
    try {
      const { data: dbPerfil, error } = await supabase
        .from('perfis')
        .select('nome, app_state')
        .eq('id', userId)
        .single();
        
      if (dbPerfil) {
        nomeFinal = dbPerfil.nome || nomeFinal;
        if (dbPerfil.app_state) {
          cloudData = dbPerfil.app_state as Partial<UserData>;
        }
      }
    } catch (e) {
      console.warn("Aviso: Falha ao buscar perfil DB, usando mock (Migration pode não ter rodado ainda).");
    }

    const localData = usersData[userId] || getDefaultUserData();
    
    // Função utilitária para FUNDIR (merge) arrays por ID sem duplicar
    const mergeArrays = <T extends {id?: string}>(arr1: T[], arr2: T[]) => {
      const map = new Map<string, T>();
      [...(arr1 || []), ...(arr2 || [])].forEach(item => {
        if (item.id) map.set(item.id, item);
      });
      return Array.from(map.values());
    };

    // Funde dados Cloud (Supabase) + Dados Locais (LocalStorage)
    const mergedData = {
      clientes: mergeArrays(localData.clientes, cloudData?.clientes || []),
      cacambas: mergeArrays(localData.cacambas, cloudData?.cacambas || []),
      locacoes: mergeArrays(localData.locacoes, cloudData?.locacoes || []),
      gastos: mergeArrays(localData.gastos, cloudData?.gastos || []),
      notificacoes: mergeArrays(localData.notificacoes, cloudData?.notificacoes || []),
      perfil: { ...localData.perfil, ...(cloudData?.perfil || {}), email },
    };

    setUsuarioAtual({ id: userId, email, nome: nomeFinal });
    setClientes(mergedData.clientes);
    setCacambas(mergedData.cacambas);
    setLocacoes(mergedData.locacoes);
    setGastos(mergedData.gastos);
    setPerfil(mergedData.perfil);
    setNotificacoes(mergedData.notificacoes);

    // Salva o merge consolidado no mapa global
    setUsersData({ ...usersData, [userId]: { ...localData, ...mergedData } });
    
    // Força um envio do dado fundido para a nuvem
    setTimeout(() => syncCloud(), 1000);
  };
  
  const syncCloud = async () => {
    const user = useAppStore.getState().usuarioAtual;
    if (!user) return;
    
    const state = useAppStore.getState();
    const dataToSync = {
      clientes: state.clientes,
      cacambas: state.cacambas,
      locacoes: state.locacoes,
      gastos: state.gastos,
      perfil: state.perfil,
      notificacoes: state.notificacoes,
      configuracoes: state.configuracoes,
      ctrs: state.ctrs,
      ctrItems: state.ctrItems,
      locaisDescarte: state.locaisDescarte,
    };
    
    await supabase.from('perfis').update({ 
      app_state: dataToSync,
      last_synced_at: new Date().toISOString()
    }).eq('id', user.id);
  };

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Usuário não retornado.");

      const userId = data.user.id;
      const nome = data.user.user_metadata?.nome || email.split('@')[0];

      await carregarDadosDoUsuario(userId, email, nome);

      return { success: true };
    } catch (err: any) {
      console.error("Login Error:", err);
      return { success: false, error: err.message || "E-mail ou senha incorretos." };
    }
  };

  const register = async (nome: string, email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome } // Salva o nome nos metadados do usuário
        }
      });

      if (error) throw error;
      
      // Se a confirmação de email estiver ativada, user não estará logado imediatamente
      return { success: true };
    } catch (err: any) {
      console.error("Register Error:", err);
      let errorMsg = err.message || "Erro ao criar conta.";
      
      if (err.message?.includes("rate limit")) {
        errorMsg = "Limite de e-mails atingido. Por favor, aguarde alguns minutos ou verifique as configurações do Supabase.";
      } else if (err.message?.includes("already registered")) {
        errorMsg = "Este e-mail já está em uso.";
      }
      
      return { success: false, error: errorMsg };
    }
  };

  const resendOtp = async (email: string, type: 'signup' | 'recovery'): Promise<{ success: boolean; error?: string }> => {
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (error) throw error;
      } else {
        // Para recovery, chamamos novamente a função de reset
        return sendPasswordReset(email);
      }
      return { success: true };
    } catch (err: any) {
      console.error("Resend OTP Error:", err);
      let errorMsg = "Erro ao reenviar código.";
      if (err.message?.includes("rate limit")) {
        errorMsg = "Limite de reenvio atingido. Aguarde alguns minutos.";
      }
      return { success: false, error: errorMsg };
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'magiclink'): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (error) throw error;

      if (type === 'signup' && data.user) {
        // Loga o usuário logo após confirmar e carrega os arquivos
        const userId = data.user.id;
        const nome = data.user.user_metadata?.nome || email.split('@')[0];
        await carregarDadosDoUsuario(userId, email, nome);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      return { success: false, error: err.message || "Código inválido ou expirado." };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      return { success: false, error: err.message || "Erro ao solicitar recuperação." };
    }
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Update Password Error:", err);
      return { success: false, error: err.message || "Erro ao atualizar a senha." };
    }
  };

  const sync = () => {
    const user = useAppStore.getState().usuarioAtual;
    if (user) {
      const state = useAppStore.getState();
      const data: UserData = {
        clientes: state.clientes,
        cacambas: state.cacambas,
        locacoes: state.locacoes,
        gastos: state.gastos,
        perfil: state.perfil,
        notificacoes: state.notificacoes,
        configuracoes: state.configuracoes,
      };
      setUsersData({ ...state.usersData, [user.id]: data });
    }
  };

  const logout = async () => {
    sync(); // Salva o state da sessão atual localmente antes de deslogar
    await supabase.auth.signOut();
    setUsuarioAtual(null);
    router.push('/login');
  };

  return { 
    login, 
    register, 
    verifyOtp, 
    sendPasswordReset, 
    resetPassword,
    resendOtp,
    logout, 
    sync 
  };
}
