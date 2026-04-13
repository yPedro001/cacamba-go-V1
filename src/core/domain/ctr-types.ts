import { z } from 'zod';
import { LocalDescarteSchema, CTRSchema, CTRItemSchema, CTRPayloadSchema, CTRStatusEnum, TipoOperacaoEnum, ResiduoClasseEnum, ResiduoUnidadeEnum, TipoLocalDescarteEnum } from './ctr-schemas';

export type LocalDescarte = z.infer<typeof LocalDescarteSchema>;
export type CTR = z.infer<typeof CTRSchema>;
export type CTRItem = z.infer<typeof CTRItemSchema>;
export type CTRPayload = z.infer<typeof CTRPayloadSchema>;
export type CTRStatus = z.infer<typeof CTRStatusEnum>;
export type TipoOperacao = z.infer<typeof TipoOperacaoEnum>;
export type ResiduoClasse = z.infer<typeof ResiduoClasseEnum>;
export type ResiduoUnidade = z.infer<typeof ResiduoUnidadeEnum>;
export type TipoLocalDescarte = z.infer<typeof TipoLocalDescarteEnum>;

export interface CTRConflito {
  tipo: 'bloqueio' | 'aviso' | 'ok';
  campo: string;
  mensagem: string;
  valores?: any[];
}

export interface CTRFormData {
  alugueisIds: string[];
  localDescarteId: string;
  
  numero: string;
  data: string;
  horaSaida: string;
  tipoOperacao: TipoOperacao;
  
  origem: {
    endereco: string;
    bairro: string;
    cidade: string;
    uf: string;
    responsavel: string;
    telefone: string;
    observacao?: string;
  };
  
  gerador: {
    nome: string;
    cpfCnpj: string;
    endereco: string;
    bairro: string;
    cidade: string;
    uf: string;
    responsavel: string;
    telefone: string;
  };
  
  transportador: {
    nome: string;
    cpfCnpj: string;
    inscricao?: string;
    telefone: string;
  };
  
  destinatario: {
    nome: string;
    cpfCnpj: string;
    endereco: string;
    bairro: string;
    cidade: string;
    uf: string;
    tipoLocal: TipoLocalDescarte;
    licenca: string;
  };
  
  residuo: {
    classe: ResiduoClasse;
    descricao: string;
    acondicionamento: string;
    quantidade: number;
    unidade: ResiduoUnidade;
  };
  
  declaracoes: {
    transportador: { nome: string; assinatura?: string };
    recebedor: { 
      nome: string; 
      assinatura?: string; 
      dataHora?: string;
      carimbo?: string;
      observacao?: string;
    };
  };
}

export interface CTRListItem {
  id: string;
  numero: string;
  data: string;
  horaSaida: string;
  clienteNome: string;
  localDescarteNome: string;
  status: CTRStatus;
  createdAt: string;
}

export interface CTRExportFormat {
  type: 'pdf' | 'word' | 'print';
}
