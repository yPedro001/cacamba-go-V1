import { useAppStore, hashPassword } from '@/store/useAppStore';
import { Usuario, UserData } from '@/core/domain/types';
import { useRouter } from 'next/navigation';

export function useAuthActions() {
  const router = useRouter();
  const usuarios = useAppStore(s => s.usuarios);
  const usersData = useAppStore(s => s.usersData);
  const { 
    setUsuarioAtual, 
    setUsuarios, 
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

  const login = async (email: string, senha: string) => {
    const hashedInput = await hashPassword(senha);
    const user = usuarios.find(u => u.email === email && (u.senha === hashedInput || u.senha === senha));
    
    if (user) {
      if (user.senha === senha) {
        setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, senha: hashedInput } : u));
      }

      const data = usersData[user.id] || getDefaultUserData();
      setUsuarioAtual({ ...user, senha: '' });
      setClientes(data.clientes);
      setCacambas(data.cacambas);
      setLocacoes(data.locacoes);
      setGastos(data.gastos);
      setPerfil(data.perfil);
      setNotificacoes(data.notificacoes);
      return true;
    }
    return false;
  };

  const register = async (nome: string, email: string, senha: string) => {
    if (usuarios.some(u => u.email === email)) return false;
    
    const hashedSenha = await hashPassword(senha);
    const newUser: Usuario = { id: Date.now().toString(), nome, email, senha: hashedSenha };
    const newUsersData = { ...usersData, [newUser.id]: getDefaultUserData() };
    
    setUsuarios([...usuarios, newUser]);
    setUsersData(newUsersData);
    return true;
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

  const logout = () => {
    sync();
    setUsuarioAtual(null);
    router.push('/login');
  };

  return { login, register, logout, sync };
}
