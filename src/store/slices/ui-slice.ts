import { StateCreator } from 'zustand';

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  locacaoId?: string;
  lida: boolean;
  dataCriacao: string;
};

export type Configuracoes = {
  pularConfirmacaoExclusao: boolean;
};

export interface UISlice {
  notificacoes: Notificacao[];
  configuracoes: Configuracoes;

  setNotificacoes: (n: Notificacao[]) => void;
  updateConfiguracoes: (c: Partial<Configuracoes>) => void;
  addNotificacao: (n: Omit<Notificacao, 'id' | 'dataCriacao'>) => void;
  marcarNotificacaoLida: (id: string) => void;
  marcarTodasLidas: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  notificacoes: [],
  configuracoes: {
    pularConfirmacaoExclusao: false,
  },

  setNotificacoes: (notificacoes) => set({ notificacoes }),
  updateConfiguracoes: (c) => set((state) => ({ 
    configuracoes: { ...state.configuracoes, ...c } 
  })),
  addNotificacao: (n) => set((state) => ({
    notificacoes: [{ 
      ...n, 
      id: Date.now().toString() + Math.random().toString(), 
      dataCriacao: new Date().toISOString() 
    }, ...state.notificacoes]
  })),
  marcarNotificacaoLida: (id) => set((state) => ({
    notificacoes: state.notificacoes.map(n => n.id === id ? { ...n, lida: true } : n)
  })),
  marcarTodasLidas: () => set((state) => ({
    notificacoes: state.notificacoes.map(n => ({ ...n, lida: true }))
  })),
});
