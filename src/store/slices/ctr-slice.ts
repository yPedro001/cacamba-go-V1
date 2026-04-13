import { StateCreator } from 'zustand';
import { CTR, CTRItem, CTRListItem, CTRFormData } from '@/core/domain/ctr-types';

export interface CTRSlice {
  ctrs: CTR[];
  ctrItems: CTRItem[];
  ctrAtual: CTRFormData | null;
  ctrAtualId: string | null;
  
  setCTRs: (ctrs: CTR[]) => void;
  addCTR: (ctr: CTR) => void;
  updateCTR: (id: string, ctr: Partial<CTR>) => void;
  removeCTR: (id: string) => void;
  getCTRById: (id: string) => CTR | undefined;
  
  setCTRItems: (items: CTRItem[]) => void;
  addCTRItems: (items: CTRItem[]) => void;
  getCTRItems: (ctrId: string) => CTRItem[];
  
  setCTRAtual: (data: CTRFormData | null) => void;
  updateCTRAtual: (data: Partial<CTRFormData>) => void;
  
  generateNovoCTRForm: () => CTRFormData;
  
  getCTRListItems: (clientesMap: Map<string, string>, locaisMap: Map<string, string>) => CTRListItem[];
  
  getProximoNumeroCTR: (ano?: number) => string;
}

export const createCTRSlice: StateCreator<CTRSlice> = (set, get) => ({
  ctrs: [],
  ctrItems: [],
  ctrAtual: null,
  ctrAtualId: null,
  
  setCTRs: (ctrs) => set({ ctrs }),
  
  addCTR: (ctr) => {
    const { ctrs } = get();
    set({ ctrs: [...ctrs, ctr] });
  },
  
  updateCTR: (id, updates) => {
    const { ctrs } = get();
    set({
      ctrs: ctrs.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  },
  
  removeCTR: (id) => {
    const { ctrs, ctrItems } = get();
    set({
      ctrs: ctrs.filter(c => c.id !== id),
      ctrItems: ctrItems.filter(i => i.ctrId !== id)
    });
  },
  
  getCTRById: (id) => {
    const { ctrs } = get();
    return ctrs.find(c => c.id === id);
  },
  
  setCTRItems: (items) => set({ ctrItems: items }),
  
  addCTRItems: (items) => {
    const { ctrItems } = get();
    set({ ctrItems: [...ctrItems, ...items] });
  },
  
  getCTRItems: (ctrId) => {
    const { ctrItems } = get();
    return ctrItems.filter(i => i.ctrId === ctrId);
  },
  
  setCTRAtual: (data) => set({ ctrAtual: data, ctrAtualId: data ? Date.now().toString().slice(-6) : null }),
  
  updateCTRAtual: (data) => {
    const { ctrAtual } = get();
    if (ctrAtual) {
      set({ ctrAtual: { ...ctrAtual, ...data } as CTRFormData });
    }
  },
  
  generateNovoCTRForm: () => {
    const now = new Date();
    return {
      alugueisIds: [],
      localDescarteId: '',
      
      numero: '', // Será gerado no momento do preview/emissão
      data: now.toISOString().split('T')[0],
      horaSaida: now.toTimeString().slice(0, 5),
      tipoOperacao: 'coleta' as const,
      
      origem: {
        endereco: '',
        bairro: '',
        cidade: '',
        uf: 'SP' as const,
        responsavel: '',
        telefone: '',
        observacao: '',
      },
      
      gerador: {
        nome: '',
        cpfCnpj: '',
        endereco: '',
        bairro: '',
        cidade: '',
        uf: 'SP' as const,
        responsavel: '',
        telefone: '',
      },
      
      transportador: {
        nome: '',
        cpfCnpj: '',
        inscricao: '',
        telefone: '',
      },
      
      destinatario: {
        nome: '',
        cpfCnpj: '',
        endereco: '',
        bairro: '',
        cidade: '',
        uf: 'SP' as const,
        tipoLocal: 'aterro_sanitario' as const,
        licenca: '',
      },
      
      residuo: {
        classe: 'A' as const,
        descricao: '',
        acondicionamento: '',
        quantidade: 1,
        unidade: 'm3' as const,
      },
      
      declaracoes: {
        transportador: { nome: '', assinatura: '' },
        recebedor: { 
          nome: '', 
          assinatura: '', 
          dataHora: '', 
          carimbo: '', 
          observacao: '' 
        },
      },
    };
  },
  
  getCTRListItems: (clientesMap, locaisMap) => {
    const { ctrs } = get();
    return ctrs.map(ctr => ({
      id: ctr.id,
      numero: ctr.numero,
      data: ctr.data,
      horaSaida: ctr.horaSaida,
      clienteNome: ctr.geradorNome,
      localDescarteNome: ctr.destinatarioNome,
      status: ctr.status,
      createdAt: ctr.createdAt,
    }));
  },
  
  getProximoNumeroCTR: () => {
    const { ctrs } = get();
    const ultimoNumero = ctrs
      .map(c => parseInt(c.numero, 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a)[0] || 0;
    
    const proximo = ultimoNumero + 1;
    return proximo.toString().padStart(6, '0');
  },
});
