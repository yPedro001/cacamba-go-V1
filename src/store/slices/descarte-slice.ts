import { StateCreator } from 'zustand';
import { LocalDescarte } from '@/core/domain/ctr-types';

export interface DescarteSlice {
  locaisDescarte: LocalDescarte[];
  localDescartePadraoId: string | null;
  
  setLocaisDescarte: (locais: LocalDescarte[]) => void;
  addLocalDescarte: (local: LocalDescarte) => void;
  updateLocalDescarte: (id: string, local: Partial<LocalDescarte>) => void;
  removeLocalDescarte: (id: string) => void;
  setLocalPadrao: (id: string) => void;
  getLocalPadrao: () => LocalDescarte | undefined;
  getLocalById: (id: string) => LocalDescarte | undefined;
}

export const createDescarteSlice: StateCreator<DescarteSlice> = (set, get) => ({
  locaisDescarte: [],
  localDescartePadraoId: null,
  
  setLocaisDescarte: (locais) => {
    const padraoId = locais.find(l => l.isPadrao)?.id || null;
    set({ locaisDescarte: locais, localDescartePadraoId: padraoId });
  },
  
  addLocalDescarte: (local) => {
    const { locaisDescarte } = get();
    
    if (local.isPadrao) {
      const updatedLocais = locaisDescarte.map(l => ({ ...l, isPadrao: false }));
      set({ 
        locaisDescarte: [...updatedLocais, local],
        localDescartePadraoId: local.id 
      });
    } else {
      set({ locaisDescarte: [...locaisDescarte, local] });
    }
  },
  
  updateLocalDescarte: (id, updates) => {
    const { locaisDescarte } = get();
    
    if (updates.isPadrao) {
      const updatedLocais = locaisDescarte.map(l => ({
        ...l,
        isPadrao: l.id === id
      }));
      set({ 
        locaisDescarte: updatedLocais,
        localDescartePadraoId: id
      });
    } else {
      set({
        locaisDescarte: locaisDescarte.map(l => 
          l.id === id ? { ...l, ...updates } : l
        )
      });
    }
  },
  
  removeLocalDescarte: (id) => {
    const { locaisDescarte, localDescartePadraoId } = get();
    const novoLocal = locaisDescarte.filter(l => l.id !== id);
    
    let novoPadraoId = localDescartePadraoId;
    if (localDescartePadraoId === id) {
      novoPadraoId = novoLocal[0]?.id || null;
      if (novoPadraoId && novoLocal[0]) {
        novoLocal[0] = { ...novoLocal[0], isPadrao: true };
      }
    }
    
    set({ 
      locaisDescarte: novoLocal,
      localDescartePadraoId: novoPadraoId
    });
  },
  
  setLocalPadrao: (id) => {
    const { locaisDescarte } = get();
    const updatedLocais = locaisDescarte.map(l => ({
      ...l,
      isPadrao: l.id === id
    }));
    set({ 
      locaisDescarte: updatedLocais,
      localDescartePadraoId: id
    });
  },
  
  getLocalPadrao: () => {
    const { locaisDescarte } = get();
    return locaisDescarte.find(l => l.isPadrao);
  },
  
  getLocalById: (id) => {
    const { locaisDescarte } = get();
    return locaisDescarte.find(l => l.id === id);
  },
});
