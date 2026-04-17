import { z } from 'zod';

export const CTRStatusEnum = z.enum(['rascunho', 'emitido']);
export type CTRStatus = z.infer<typeof CTRStatusEnum>;

export const TipoOperacaoEnum = z.enum([
  'coleta',
  'transporte',
  'transbordo',
  'tratamento',
  'destinacao_final'
]);
export type TipoOperacao = z.infer<typeof TipoOperacaoEnum>;

export const ResiduoClasseEnum = z.enum([
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'Inerte'
]);
export type ResiduoClasse = z.infer<typeof ResiduoClasseEnum>;

export const ResiduoUnidadeEnum = z.enum([
  'm3',
  'kg',
  'ton',
  'unidade',
  'litros'
]);
export type ResiduoUnidade = z.infer<typeof ResiduoUnidadeEnum>;

export const TipoLocalDescarteEnum = z.enum([
  'aterro_sanitario',
  'usina_reciclagem',
  'area_transbordo',
  'centro_tratamento',
  'disposicao_final',
  'outro'
]);
export type TipoLocalDescarte = z.infer<typeof TipoLocalDescarteEnum>;

export const UFEnum = z.enum([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]);
export type UF = z.infer<typeof UFEnum>;

export const LocalDescarteSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(2, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().optional().default(''),
  bairro: z.string().optional().default(''),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  uf: UFEnum,
  cep: z.string().optional(),
  tipoLocal: TipoLocalDescarteEnum.optional(),
  licenca: z.string().optional(),
  observacoes: z.string().optional(),
  isPadrao: z.boolean().default(false),
  createdAt: z.string().datetime(),
  usuarioId: z.string(),
});

export const CTRSchema = z.object({
  id: z.string().uuid(),
  numero: z.string().min(1, 'Número do CTR é obrigatório'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  horaSaida: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida'),
  tipoOperacao: TipoOperacaoEnum,
  
  origemEndereco: z.string().min(1, 'Endereço de origem é obrigatório'),
  origemBairro: z.string().optional().default(''),
  origemCidade: z.string().min(1, 'Cidade de origem é obrigatória'),
  origemUF: UFEnum,
  origemResponsavel: z.string().optional().default(''),
  origemTelefone: z.string().optional(),
  origemObservacao: z.string().optional(),
  
  geradorNome: z.string().min(1, 'Nome do gerador é obrigatório'),
  geradorCpfCnpj: z.string().min(1, 'CPF/CNPJ do gerador é obrigatório'),
  geradorEndereco: z.string().optional().default(''),
  geradorBairro: z.string().optional().default(''),
  geradorCidade: z.string().optional().default(''),
  geradorUF: UFEnum.optional(),
  geradorResponsavel: z.string().optional().default(''),
  geradorTelefone: z.string().optional(),
  
  transportadorNome: z.string().min(1, 'Nome do transportador é obrigatório'),
  transportadorCpfCnpj: z.string().min(1, 'CPF/CNPJ do transportador é obrigatório'),
  transportadorInscricao: z.string().optional(),
  transportadorMotorista: z.string().min(1, 'Nome do motorista é obrigatório'),
  transportadorPlaca: z.string().min(1, 'Placa do veículo é obrigatória'),
  transportadorTipoVeiculo: z.string().optional().default(''),
  transportadorLicenca: z.string().optional(),
  transportadorTelefone: z.string().optional(),
  
  destinatarioNome: z.string().min(1, 'Nome do destinatário é obrigatório'),
  destinatarioCpfCnpj: z.string().optional(),
  destinatarioEndereco: z.string().min(1, 'Endereço do destinatário é obrigatório'),
  destinatarioBairro: z.string().optional().default(''),
  destinatarioCidade: z.string().min(1, 'Cidade do destinatário é obrigatória'),
  destinatarioUF: UFEnum,
  destinatarioTipoLocal: TipoLocalDescarteEnum.optional(),
  destinatarioLicenca: z.string().optional(),
  
  residuoClasse: ResiduoClasseEnum.optional(),
  residuoDescricao: z.string().min(1, 'Descrição do resíduo é obrigatória'),
  residuoAcondicionamento: z.string().optional().default(''),
  residuoQuantidade: z.number().min(0.001, 'Quantidade deve ser maior que zero'),
  residuoUnidade: ResiduoUnidadeEnum,
  
  declaracaoGeradorNome: z.string().optional(),
  declaracaoGeradorAssinatura: z.string().optional(),
  declaracaoTransportadorNome: z.string().optional(),
  declaracaoTransportadorAssinatura: z.string().optional(),
  declaracaoRecebedorNome: z.string().optional(),
  declaracaoRecebedorAssinatura: z.string().optional(),
  declaracaoRecebedorDataHora: z.string().datetime().optional(),
  declaracaoRecebedorCarimbo: z.string().optional(),
  declaracaoRecebedorObservacao: z.string().optional(),
  
  status: CTRStatusEnum.default('emitido'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  usuarioId: z.string(),
});

export const CTRItemSchema = z.object({
  id: z.string().uuid(),
  ctrId: z.string().uuid(),
  aluguelId: z.string(),
  clienteId: z.string(),
  snapshotClienteNome: z.string(),
  snapshotClienteCpfCnpj: z.string().optional(),
  snapshotEnderecoObra: z.string(),
  snapshotDataRetirada: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const CTRPayloadSchema = z.object({
  identificacao: z.object({
    numero: z.string(),
    data: z.string(),
    horaSaida: z.string(),
    tipoOperacao: TipoOperacaoEnum,
  }),
  origem: z.object({
    endereco: z.string(),
    bairro: z.string(),
    cidade: z.string(),
    uf: UFEnum,
    responsavel: z.string(),
    telefone: z.string(),
    observacao: z.string().optional(),
  }),
  gerador: z.object({
    nome: z.string(),
    cpfCnpj: z.string(),
    endereco: z.string(),
    bairro: z.string(),
    cidade: z.string(),
    uf: UFEnum.optional(),
    responsavel: z.string(),
    telefone: z.string(),
  }),
  transportador: z.object({
    nome: z.string(),
    cpfCnpj: z.string(),
    inscricao: z.string().optional(),
    telefone: z.string(),
  }),
  destinatario: z.object({
    nome: z.string(),
    cpfCnpj: z.string(),
    endereco: z.string(),
    bairro: z.string(),
    cidade: z.string(),
    uf: UFEnum,
    tipoLocal: TipoLocalDescarteEnum.optional(),
    licenca: z.string(),
  }),
  residuo: z.object({
    classe: ResiduoClasseEnum.optional(),
    descricao: z.string(),
    acondicionamento: z.string(),
    quantidade: z.number(),
    unidade: ResiduoUnidadeEnum,
  }),
  declaracoes: z.object({
    transportador: z.object({
      nome: z.string(),
      assinatura: z.string().optional(),
    }),
    recebedor: z.object({
      nome: z.string(),
      assinatura: z.string().optional(),
      dataHora: z.string().optional(),
      carimbo: z.string().optional(),
      observacao: z.string().optional(),
    }),
  }),
  metadados: z.object({
    empresa: z.object({
      nome: z.string(),
      cnpj: z.string(),
      telefone: z.string(),
      endereco: z.string(),
      logoUrl: z.string().optional(),
    }),
    emitidasEm: z.string(),
    status: CTRStatusEnum,
  }),
});

export const CTRFormDataSchema = z.object({
  alugueisIds: z.array(z.string()).min(1, 'Selecione pelo menos um aluguel'),
  localDescarteId: z.string().uuid('Selecione um local de descarte'),
  
  numero: z.string().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  horaSaida: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  tipoOperacao: TipoOperacaoEnum,
  
  origem: z.object({
    endereco: z.string().min(1),
    bairro: z.string().optional(),
    cidade: z.string().min(1),
    uf: UFEnum,
    responsavel: z.string().optional(),
    telefone: z.string().optional(),
    observacao: z.string().optional(),
  }),
  
  gerador: z.object({
    nome: z.string().min(1),
    cpfCnpj: z.string().min(1),
    endereco: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: UFEnum.optional(),
    responsavel: z.string().optional(),
    telefone: z.string().optional(),
  }),
  
  transportador: z.object({
    nome: z.string().min(1),
    cpfCnpj: z.string().min(1),
    inscricao: z.string().optional(),
    telefone: z.string().optional(),
  }),
  
  destinatario: z.object({
    nome: z.string().min(1),
    cpfCnpj: z.string().optional(),
    endereco: z.string().min(1),
    bairro: z.string().optional(),
    cidade: z.string().min(1),
    uf: UFEnum,
    tipoLocal: TipoLocalDescarteEnum.optional(),
    licenca: z.string().optional(),
  }),
  
  residuo: z.object({
    classe: ResiduoClasseEnum.optional(),
    descricao: z.string().min(1),
    acondicionamento: z.string().optional(),
    quantidade: z.number().min(0.001),
    unidade: ResiduoUnidadeEnum,
  }),
  
  declaracoes: z.object({
    transportador: z.object({
      nome: z.string().optional(),
      assinatura: z.string().optional(),
    }),
    recebedor: z.object({
      nome: z.string().optional(),
      assinatura: z.string().optional(),
      dataHora: z.string().optional(),
      carimbo: z.string().optional(),
      observacao: z.string().optional(),
    }),
  }),
});

export function validarCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

export function validarCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  if (remainder < 2 ? 0 : 11 - remainder !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  if (remainder < 2 ? 0 : 11 - remainder !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
}

export function validarDocumento(doc: string): boolean {
  const cleanDoc = doc.replace(/\D/g, '');
  if (cleanDoc.length === 11) return validarCPF(doc);
  if (cleanDoc.length === 14) return validarCNPJ(doc);
  return false;
}

export function gerarNumeroCTR(sequencial?: number): string {
  if (sequencial !== undefined) {
    return sequencial.toString().padStart(6, '0');
  }
  const timestamp = Date.now().toString().slice(-6);
  return timestamp;
}

export function formatarNumeroCTR(sequencial: number, _ano: number): string {
  return sequencial.toString().padStart(6, '0');
}
