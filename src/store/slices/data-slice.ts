import { StateCreator } from 'zustand';
import { Cliente, Cacamba, Locacao, Gasto, Perfil, UserData } from '@/core/domain/types';

export interface DataSlice {
  clientes: Cliente[];
  cacambas: Cacamba[];
  locacoes: Locacao[];
  gastos: Gasto[];
  perfil: Perfil;
  usersData: Record<string, UserData>;

  setClientes: (c: Cliente[]) => void;
  setCacambas: (c: Cacamba[]) => void;
  setLocacoes: (l: Locacao[]) => void;
  setGastos: (g: Gasto[]) => void;
  setPerfil: (p: Perfil) => void;
  setUsersData: (ud: Record<string, UserData>) => void;
}

export const createDataSlice: StateCreator<DataSlice> = (set) => ({
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
    lat: -23.5505,
    lng: -46.6333,
    padroes: {
      valorAluguel: 300,
      tamanhoCacamba: '5m',
      prefixoCacamba: 'C-'
    }
  },
  usersData: {},

  setClientes: (clientes) => set({ clientes }),
  setCacambas: (cacambas) => set({ cacambas }),
  setLocacoes: (locacoes) => set({ locacoes }),
  setGastos: (gastos) => set({ gastos }),
  setPerfil: (perfil) => set({ perfil }),
  setUsersData: (usersData) => set({ usersData }),
});
