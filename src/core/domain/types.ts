import { z } from 'zod';
import * as schemas from './schemas';

export type ClienteEndereco = z.infer<typeof schemas.ClienteEnderecoSchema>;
export type Cliente = z.infer<typeof schemas.ClienteSchema>;
export type StatusHistoricoEntry = z.infer<typeof schemas.StatusHistoricoEntrySchema>;
export type Cacamba = z.infer<typeof schemas.CacambaSchema>;
export type CacambaStatus = z.infer<typeof schemas.CacambaStatusSchema>;
export type MetodoPagamento = z.infer<typeof schemas.MetodoPagamentoSchema>;
export type Locacao = z.infer<typeof schemas.LocacaoSchema>;
export type LocacaoStatus = z.infer<typeof schemas.LocacaoStatusSchema>;
export type Gasto = z.infer<typeof schemas.GastoSchema>;
export type Perfil = z.infer<typeof schemas.PerfilSchema>;
export type Usuario = z.infer<typeof schemas.UsuarioSchema>;

export type MapColor = 'verde' | 'amarelo' | 'vermelho' | 'cinza' | 'azul';

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  dataCriacao: string;
  lida: boolean;
  locacaoId?: string;
};

export type UserData = {
  clientes: Cliente[];
  cacambas: Cacamba[];
  locacoes: Locacao[];
  gastos: Gasto[];
  perfil: Perfil;
  notificacoes: any[]; // To be defined
  configuracoes: any;  // To be defined
};
