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

export type AddNotificacaoInput = Omit<Notificacao, 'id' | 'dataCriacao'> & {
  id?: string;
  dataCriacao?: string;
};

export interface UISlice {
  notificacoes: Notificacao[];
  configuracoes: Configuracoes;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  setNotificacoes: (n: Notificacao[]) => void;
  updateConfiguracoes: (c: Partial<Configuracoes>) => void;
  addNotificacao: (n: AddNotificacaoInput) => void;
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
  addNotificacao: (n) => set((state) => {
    const incomingId = (n as { id?: string }).id?.trim();
    const fallbackId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const resolvedId = incomingId || fallbackId;
    const signature = `${n.tipo}|${n.titulo}|${n.mensagem}`;

    const alreadyExists = state.notificacoes.some(
      (existing) =>
        existing.id === resolvedId ||
        `${existing.tipo}|${existing.titulo}|${existing.mensagem}` === signature
    );
    if (alreadyExists) {
      return state;
    }

    const next = [
      {
        ...n,
        id: resolvedId,
        dataCriacao: (n as { dataCriacao?: string }).dataCriacao || new Date().toISOString(),
        lida: false,
      },
      ...state.notificacoes,
    ].slice(0, 100);

    return { notificacoes: next };
  }),
  
  // Marca como lida preservando o item (evita que SyncEngine recrie alerta já visto)
  marcarNotificacaoLida: (id) => set((state) => ({
    notificacoes: state.notificacoes.map((n) =>
      n.id === id ? { ...n, lida: true } : n
    ),
  })),

  marcarTodasLidas: () => set((state) => ({
    notificacoes: state.notificacoes.map((n) => ({ ...n, lida: true })),
  })),
  
  removeNotificacao: (id) => set((state) => ({
    notificacoes: state.notificacoes.filter(n => n.id !== id)
  })),
  
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
});
