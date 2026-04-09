import { z } from 'zod';

export const StatusHistoricoEntrySchema = z.object({
  status: z.string(),
  data: z.string().datetime() || z.string(), // ISO string
  usuario: z.string(),
  motivo: z.string().optional(),
});

export const ClienteEnderecoSchema = z.object({
  id: z.string().uuid().or(z.string()),
  nome: z.string().min(1, "Identificação do endereço é obrigatória"), // ex: "Matriz"
  rua: z.string().min(1, "Rua é obrigatória"),
  numero: z.string().optional().default('S/N'),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  cep: z.string().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

export const ClienteSchema = z.object({
  id: z.string().uuid().or(z.string()),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpfCnpj: z.string().min(11, "Documento inválido"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  endereco: z.string().optional(), // Mantido para compatibilidade, mas opcional
  enderecos: z.array(ClienteEnderecoSchema).default([]),
});

export const CacambaStatusSchema = z.enum(['disponivel', 'entrega_pendente', 'locada', 'vencida']);

export const CacambaSchema = z.object({
  id: z.string(),
  codigo: z.string().min(1, "Código obrigatório"),
  tamanho: z.string().optional(),
  status: CacambaStatusSchema,
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  enderecoAtual: z.string().optional(),
  dataEntrega: z.string().optional().nullable(),
  historico: z.array(StatusHistoricoEntrySchema).optional().default([]),
});

export const MetodoPagamentoSchema = z.enum(['pix', 'debito', 'credito', 'boleto']);

export const LocacaoStatusSchema = z.enum(['entrega_pendente', 'em_uso', 'vencida', 'pago', 'a_pagar', 'concluida', 'cancelada']);


export const LocacaoSchema = z.object({
  id: z.string().optional(),
  clienteId: z.string(),
  cacambaId: z.string().optional(),
  cacambaIds: z.array(z.string()).optional(),
  quantidadeCacambas: z.number().min(1).default(1),
  dataRetirada: z.string(),
  dataDevolucaoPrevista: z.string(),
  status: LocacaoStatusSchema,
  enderecoObra: z.string(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  valor: z.number().min(0),
  metodoPagamento: MetodoPagamentoSchema.optional(),
  taxaCartaoPercent: z.number().optional().default(0),
  valorTaxa: z.number().optional().default(0),
  valorLiquido: z.number().optional().default(0),
  dataPagamento: z.string().optional().nullable(),
  parcelas: z.number().min(1).max(12).optional().default(1),
  jurosPercent: z.number().optional().default(0),
});

export const GastoSchema = z.object({
  id: z.string(),
  data: z.string(),
  valor: z.number().min(0.01),
  categoria: z.string(),
  descricao: z.string(),
});

export const PerfilSchema = z.object({
  nomeEmpresa: z.string().min(2),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  endereco: z.string().optional(),
  chavePix: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  padroes: z.object({
    valorAluguel: z.number().default(300),
    tamanhoCacamba: z.string().default('5m'),
    prefixoCacamba: z.string().default('C-'),
    taxaMaquininhaPadrao: z.number().default(0),
    jurosParcelamento: z.number().default(0),
    parcelasSemJuros: z.number().default(1),
  }).optional(),
});

export const UsuarioSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
  senha: z.string().optional(), // Movido para Supabase Auth, nĂŁo transacionado visualmente no state local
});
