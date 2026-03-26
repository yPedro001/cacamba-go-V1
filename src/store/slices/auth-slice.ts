import { StateCreator } from 'zustand';
import { Usuario } from '@/core/domain/types';

export interface AuthSlice {
  usuarios: Usuario[];
  usuarioAtual: Usuario | null;
  
  setUsuarioAtual: (user: Usuario | null) => void;
  setUsuarios: (users: Usuario[]) => void;
  // Note: Complex actions like login/register will be orchestrated 
  // in application services or a main store to handle cross-slice logic
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  usuarios: [],
  usuarioAtual: null,

  setUsuarioAtual: (user) => set({ usuarioAtual: user }),
  setUsuarios: (users) => set({ usuarios: users }),
});
