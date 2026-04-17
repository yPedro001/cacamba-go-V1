import { StateCreator } from 'zustand';

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem?: string;
  locacaoId?: string;
  lida: boolean;
  dataCriacao: string;
  tipo?: 'info' | 'success' | 'warning' | 'error';
};

export type Configuracoes = {
  pularConfirmacaoExclusao: boolean;
};

export interface UISlice {
  notificacoes: Notificacao[];
  configuracoes: Configuracoes;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  setNotificacoes: (n: Notificacao[]) => void;
  updateConfiguracoes: (c: Partial<Configuracoes>) => void;
  addNotificacao: (n: Omit<Notificacao, 'id' | 'dataCriacao'>) => void;
  marcarNotificacaoLida: (id: string) => void;
  marcarTodasLidas: () => void;
  removeNotificacao: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  notificacoes: [],
  configuracoes: {
    pularConfirmacaoExclusao: false,
  },
  sidebarOpen: false,
  sidebarCollapsed: false,

  setNotificacoes: (notificacoes) => set({ notificacoes }),
  updateConfiguracoes: (c) => set((state) => ({ 
    configuracoes: { ...state.configuracoes, ...c } 
  })),
  addNotificacao: (n) => set((state) => ({
    notificacoes: [{ 
      ...n, 
      id: Date.now().toString() + Math.random().toString(), 
      dataCriacao: new Date().toISOString(),
      lida: false,
    }, ...state.notificacoes]
  })),
  
  // Marca como lida e agenda remoção após 30 segundos
  marcarNotificacaoLida: (id) => {
    // Primeiro marca como lida
    set((state) => ({
      notificacoes: state.notificacoes.map(n => 
        n.id === id ? { ...n, lida: true } : n
      )
    }));
    
    // Após 30 segundos, remove permanentemente
    setTimeout(() => {
      set((state) => ({
        notificacoes: state.notificacoes.filter(n => n.id !== id)
      }));
    }, 30000);
  },
  
  marcarTodasLidas: () => set((state) => {
    const now = Date.now();
    // Agenda remoção de todas após 30 segundos
    setTimeout(() => {
      set({ notificacoes: [] });
    }, 30000);
    
    return {
      notificacoes: state.notificacoes.map(n => ({ ...n, lida: true }))
    };
  }),
  
  removeNotificacao: (id) => set((state) => ({
    notificacoes: state.notificacoes.filter(n => n.id !== id)
  })),
  
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
});
