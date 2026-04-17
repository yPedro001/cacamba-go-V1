import { StateCreator } from 'zustand';
import { Usuario } from '@/core/domain/types';

export interface AuthSlice {
  usuarioAtual: Usuario | null;
  setUsuarioAtual: (user: Usuario | null) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  usuarioAtual: null,
  setUsuarioAtual: (user) => set({ usuarioAtual: user }),
});
