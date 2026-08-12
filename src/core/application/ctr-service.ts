import { supabase } from '@/lib/supabase';
import { CTR, CTRItem, CTRFormData, CTRConflito, LocalDescarte } from '@/core/domain/ctr-types';
import { CTRFormDataSchema, CTRSchema, CTRItemSchema, LocalDescarteSchema } from '@/core/domain/ctr-schemas';
import { Locacao, Cliente } from '@/core/domain/types';

export interface CTRServiceConfig {
  usuarioId: string;
}

export class CTRService {
  private usuarioId: string;

  constructor(config: CTRServiceConfig) {
    this.usuarioId = config.usuarioId;
  }

  async getLocaisDescarte(): Promise<LocalDescarte[]> {
    const usuarioId = this.usuarioId;
    
    const { data, error } = await supabase
      .from('locais_descarte')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('is_padrao', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Erro ao buscar locais de descarte: ${error.message}`);
    
    return (data || []).map(this.mapDBToLocalDescarte);
  }

  async createLocalDescarte(local: Omit<LocalDescarte, 'id' | 'createdAt' | 'usuarioId'>): Promise<LocalDescarte> {
    const usuarioId = this.usuarioId;
    
    // Criar objeto de insert apenas com campos必需
    const insertData: any = {
      nome: local.nome,
      rua: local.rua || '',
      numero: local.numero || '',
      cidade: local.cidade || '',
      uf: local.uf || 'SP',
      usuario_id: usuarioId,
    };
    
    // Só adicionar campos opcionais se tiverem valor
    if (local.cnpj) insertData.cnpj = local.cnpj;
    if (local.telefone) insertData.telefone = local.telefone;
    if (local.bairro) insertData.bairro = local.bairro;
    if (local.cep) insertData.cep = local.cep;
    if (local.tipoLocal) insertData.tipo_local = local.tipoLocal;
    if (local.licenca) insertData.licenca = local.licenca;
    if (local.observacoes) insertData.observacoes = local.observacoes;
    if (local.isPadrao) insertData.is_padrao = local.isPadrao;
    
    const { data, error } = await supabase
      .from('locais_descarte')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar local de descarte: ${error.message}`);
    }
    
    return this.mapDBToLocalDescarte(data);
  }

  async updateLocalDescarte(id: string, updates: Partial<LocalDescarte>): Promise<LocalDescarte> {
    const { data, error } = await supabase
      .from('locais_descarte')
      .update(this.mapLocalDescarteToDB(updates))
      .eq('id', id)
      .eq('usuario_id', this.usuarioId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar local de descarte: ${error.message}`);
    
    return this.mapDBToLocalDescarte(data);
  }

  async deleteLocalDescarte(id: string): Promise<void> {
    const { error } = await supabase
      .from('locais_descarte')
      .delete()
      .eq('id', id)
      .eq('usuario_id', this.usuarioId);

    if (error) throw new Error(`Erro ao deletar local de descarte: ${error.message}`);
  }

  async setLocalPadrao(id: string): Promise<void> {
    const { error } = await supabase
      .from('locais_descarte')
      .update({ is_padrao: true })
      .eq('id', id)
      .eq('usuario_id', this.usuarioId);

    if (error) throw new Error(`Erro ao definir local padrão: ${error.message}`);
  }

  async getCTRs(): Promise<CTR[]> {
    const { data, error } = await supabase
      .from('ctrs')
      .select('*')
      .eq('usuario_id', this.usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar CTRs: ${error.message}`);
    
    return (data || []).map(this.mapDBToCTR);
  }

  async getCTRById(id: string): Promise<CTR | null> {
    const { data, error } = await supabase
      .from('ctrs')
      .select('*')
      .eq('id', id)
      .eq('usuario_id', this.usuarioId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar CTR: ${error.message}`);
    }
    
    return data ? this.mapDBToCTR(data) : null;
  }

  async getProximoNumeroCTR(): Promise<string> {
    // Gerar número CTR diretamente no código (sem依赖 função RPC problemática)
    const ano = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const numero = `${ano}${timestamp}`;
    
    console.log('Número CTR gerado:', numero);
    return numero;
  }

  async getCTRItems(ctrId: string): Promise<CTRItem[]> {
    const { data, error } = await supabase
      .from('ctr_itens')
      .select('*')
      .eq('ctr_id', ctrId);

    if (error) throw new Error(`Erro ao buscar itens do CTR: ${error.message}`);
    
    return (data || []).map(this.mapDBToCTRItem);
  }

  async createCTR(
    formData: CTRFormData,
    localDescarte: LocalDescarte,
    alugueis: Locacao[],
    clientes: Cliente[],
    numeroCTR?: string // Parâmetro opcional para usar número específico (evita gerar novo número)
  ): Promise<CTR> {
    const validation = CTRFormDataSchema.safeParse(formData);
    if (!validation.success) {
      throw new Error(`Dados inválidos: ${validation.error.message}`);
    }

    // Se não passou número, gerar um novo
    const numeroFinal = numeroCTR || await this.getProximoNumeroCTR();

    const itens = alugueis.map(aluguel => {
      const cliente = clientes.find(c => c.id === aluguel.clienteId);
      return {
        aluguelId: aluguel.id!,
        clienteId: aluguel.clienteId,
        snapshot: {
          clienteNome: cliente?.nome || 'Não identificado',
          clienteCpfCnpj: cliente?.cpfCnpj || '',
          enderecoObra: aluguel.enderecoObra,
          dataRetirada: aluguel.dataRetirada,
        },
      };
    });

    // Inserir CTR diretamente via Supabase client (sem função RPC)
    const { data: ctrResult, error: ctrError } = await supabase
      .from('ctrs')
      .insert({
        usuario_id: this.usuarioId,
        numero: numeroFinal,
        data: formData.data,
        hora_saida: formData.horaSaida,
        tipo_operacao: formData.tipoOperacao,
        
        origem_cep: formData.origem.cep || '',
        origem_endereco: formData.origem.endereco,
        origem_bairro: formData.origem.bairro || '',
        origem_cidade: formData.origem.cidade,
        origem_uf: formData.origem.uf,
        origem_responsavel: formData.origem.responsavel || '',
        origem_telefone: formData.origem.telefone || '',
        origem_observacao: formData.origem.observacao || '',
        
        gerador_nome: formData.gerador.nome,
        gerador_cpf_cnpj: formData.gerador.cpfCnpj,
        gerador_cep: formData.gerador.cep || '',
        gerador_endereco: formData.gerador.endereco || '',
        gerador_bairro: formData.gerador.bairro || '',
        gerador_cidade: formData.gerador.cidade || '',
        gerador_uf: formData.gerador.uf || 'SP',
        gerador_responsavel: formData.gerador.responsavel || '',
        gerador_telefone: formData.gerador.telefone || '',
        
        transportador_nome: formData.transportador.nome,
        transportador_cpf_cnpj: formData.transportador.cpfCnpj,
        transportador_inscricao: formData.transportador.inscricao || '',
        transportador_telefone: formData.transportador.telefone || '',
        
        destinatario_nome: localDescarte.nome,
        destinatario_cpf_cnpj: localDescarte.cnpj || '',
        destinatario_endereco: `${localDescarte.rua}${localDescarte.numero ? ', ' + localDescarte.numero : ''}`,
        destinatario_bairro: localDescarte.bairro || '',
        destinatario_cidade: localDescarte.cidade,
        destinatario_uf: localDescarte.uf,
        destinatario_tipo_local: localDescarte.tipoLocal || 'outro',
        destinatario_licenca: localDescarte.licenca || '',
        
        residuo_classe: formData.residuo.classe || 'A',
        residuo_descricao: formData.residuo.descricao,
        residuo_acondicionamento: formData.residuo.acondicionamento || '',
        residuo_quantidade: formData.residuo.quantidade,
        residuo_unidade: formData.residuo.unidade,
        
        declaracao_transportador_nome: formData.declaracoes.transportador.nome || '',
        declaracao_transportador_assinatura: formData.declaracoes.transportador.assinatura || '',
        declaracao_recebedor_nome: formData.declaracoes.recebedor.nome || '',
        declaracao_recebedor_assinatura: formData.declaracoes.recebedor.assinatura || '',
        declaracao_recebedor_data_hora: formData.declaracoes.recebedor.dataHora || null,
        declaracao_recebedor_carimbo: formData.declaracoes.recebedor.carimbo || '',
        declaracao_recebedor_observacao: formData.declaracoes.recebedor.observacao || '',
        
        status: 'emitido',
        local_descarte_id: localDescarte.id,
      })
      .select()
      .single();

    if (ctrError) throw new Error(`Erro ao criar CTR: ${ctrError.message}`);
    if (!ctrResult) throw new Error('CTR não foi criado');

    if (itens.length > 0) {
      const { error: itensError } = await supabase.from('ctr_itens').insert(
        itens.map(item => ({
          ctr_id: ctrResult.id,
          aluguel_id: item.aluguelId,
          cliente_id: item.clienteId,
          snapshot_dados: item.snapshot,
        }))
      );

      if (itensError) {
        // A FK com ON DELETE CASCADE remove qualquer item parcial.
        await supabase.from('ctrs').delete().eq('id', ctrResult.id).eq('usuario_id', this.usuarioId);
        throw new Error(`Erro ao vincular os aluguéis ao CTR: ${itensError.message}`);
      }
    }
    
    return this.mapDBToCTR(ctrResult);
  }

  async deleteCTR(id: string): Promise<void> {
    const { error } = await supabase
      .from('ctrs')
      .delete()
      .eq('id', id)
      .eq('usuario_id', this.usuarioId);

    if (error) throw new Error(`Erro ao deletar CTR: ${error.message}`);
  }

  validateConflitos(alugueis: Locacao[], clientes: Cliente[]): CTRConflito[] {
    const conflitos: CTRConflito[] = [];
    
    if (alugueis.length <= 1) return conflitos;

    const clienteIds = Array.from(new Set(alugueis.map(a => a.clienteId)));
    if (clienteIds.length > 1) {
      conflitos.push({
        tipo: 'bloqueio',
        campo: 'cliente',
        mensagem: 'Aluguéis com clientes diferentes. Selecione aluguéis do mesmo cliente.',
        valores: clienteIds,
      });
    }

    const clientesDoCTR = clienteIds.map(id => clientes.find(c => c.id === id)).filter(Boolean);
    if (clientesDoCTR.length > 0) {
      const nomesClientes = clientesDoCTR.map(c => c!.nome).join(', ');
      conflitos.push({
        tipo: 'aviso',
        campo: 'cliente_nomes',
        mensagem: `Clientes selecionados: ${nomesClientes}`,
        valores: clientesDoCTR.map(c => c!.nome),
      });
    }

    return conflitos;
  }

  autoFillFromCliente(
    cliente: Cliente,
    localDescarte: LocalDescarte,
    perfil: any
  ): Partial<CTRFormData> {
    const enderecoPrincipal = cliente.enderecos?.[0];
    const endereco = enderecoPrincipal
      ? `${enderecoPrincipal.rua}${enderecoPrincipal.numero ? `, ${enderecoPrincipal.numero}` : ''}`
      : cliente.endereco || '';
    const cidade = enderecoPrincipal?.cidade || this.extrairCidade(cliente.endereco || '') || 'São Paulo';

    return {
      alugueisIds: [],
      localDescarteId: localDescarte.id,
      data: new Date().toISOString().split('T')[0],
      horaSaida: new Date().toTimeString().slice(0, 5),
      tipoOperacao: 'coleta',
      origem: {
        cep: enderecoPrincipal?.cep || '',
        endereco,
        bairro: '',
        cidade,
        uf: 'SP',
        responsavel: cliente.nome,
        telefone: cliente.telefone || '',
        observacao: '',
      },
      gerador: {
        nome: cliente.nome,
        cpfCnpj: cliente.cpfCnpj,
        cep: enderecoPrincipal?.cep || '',
        endereco,
        bairro: '',
        cidade,
        uf: 'SP',
        responsavel: cliente.nome,
        telefone: cliente.telefone || '',
      },
      transportador: {
        nome: perfil.nomeEmpresa || '',
        cpfCnpj: perfil.cnpj || '',
        inscricao: '',
        telefone: perfil.telefone || '',
      },
      destinatario: {
        nome: localDescarte.nome,
        cpfCnpj: localDescarte.cnpj || '',
        endereco: `${localDescarte.rua}${localDescarte.numero ? `, ${localDescarte.numero}` : ''}`,
        bairro: localDescarte.bairro || '',
        cidade: localDescarte.cidade,
        uf: localDescarte.uf,
        tipoLocal: localDescarte.tipoLocal || 'aterro_sanitario',
        licenca: localDescarte.licenca || '',
      },
      residuo: {
        classe: 'A',
        descricao: 'Resíduos de construção civil e demolição',
        acondicionamento: 'Caçamba',
        quantidade: 1,
        unidade: 'm3',
      },
      declaracoes: {
        transportador: { nome: perfil.nomeEmpresa || '', assinatura: '' },
        recebedor: { nome: '', assinatura: '', dataHora: '', carimbo: '', observacao: '' },
      },
    };
  }

  autoFillFromAlugueis(
    alugueis: Locacao[],
    clientes: Cliente[],
    localDescarte: LocalDescarte,
    perfil: any
  ): Partial<CTRFormData> {
    const cliente = clientes.find(c => c.id === alugueis[0].clienteId);
    
    const totalQuantidade = alugueis.reduce((acc, a) => acc + (a.quantidadeCacambas || 1), 0);
    
    const primeiroAluguel = alugueis[0];

    const cidadeExtraida = this.extrairCidade(primeiroAluguel.enderecoObra);
    const cidadeCliente = this.extrairCidade(cliente?.endereco || '');
    const cidadeOrigem = cidadeExtraida || cidadeCliente || 'São Paulo';

    return {
      alugueisIds: alugueis.map(a => a.id!),
      localDescarteId: localDescarte.id,
      
      data: new Date().toISOString().split('T')[0],
      horaSaida: new Date().toTimeString().slice(0, 5),
      tipoOperacao: 'coleta',
      
      origem: {
        cep: primeiroAluguel.cep || localDescarte.cep || '',
        endereco: primeiroAluguel.enderecoObra || '',
        bairro: '',
        cidade: cidadeOrigem,
        uf: 'SP',
        responsavel: cliente?.nome || '',
        telefone: cliente?.telefone || '',
        observacao: '',
      },
      
      gerador: {
        nome: cliente?.nome || '',
        cpfCnpj: cliente?.cpfCnpj || '',
        cep: localDescarte.cep || '',
        endereco: cliente?.endereco || primeiroAluguel.enderecoObra || '',
        bairro: '',
        cidade: cidadeCliente || cidadeOrigem,
        uf: 'SP',
        responsavel: cliente?.nome || '',
        telefone: cliente?.telefone || '',
      },
      
      transportador: {
        nome: perfil.nomeEmpresa || '',
        cpfCnpj: perfil.cnpj || '',
        inscricao: '',
        telefone: perfil.telefone || '',
      },
      
      destinatario: {
        nome: localDescarte.nome,
        cpfCnpj: localDescarte.cnpj || '',
        endereco: `${localDescarte.rua}${localDescarte.numero ? ', ' + localDescarte.numero : ''}`,
        bairro: localDescarte.bairro || '',
        cidade: localDescarte.cidade,
        uf: localDescarte.uf,
        tipoLocal: localDescarte.tipoLocal || 'aterro_sanitario',
        licenca: localDescarte.licenca || '',
      },
      
      residuo: {
        classe: 'A',
        descricao: 'Resíduos de construção civil e demolição',
        acondicionamento: 'Caçamba',
        quantidade: totalQuantidade || 1,
        unidade: 'm3',
      },
      
      declaracoes: {
        transportador: { nome: perfil.nomeEmpresa || '', assinatura: '' },
        recebedor: { nome: '', assinatura: '', dataHora: '', carimbo: '', observacao: '' },
      },
    };
  }

  private extrairCidade(endereco: string): string {
    if (!endereco) return '';
    const partes = endereco.split('-');
    if (partes.length >= 2) {
      const ultimaParte = partes[partes.length - 1].trim();
      if (ultimaParte.length <= 30) {
        return ultimaParte;
      }
    }
    if (endereco.includes(',')) {
      const partesVirgula = endereco.split(',');
      return partesVirgula[partesVirgula.length - 1].trim().split('-')[0].trim();
    }
    return '';
  }

  private mapDBToLocalDescarte(db: any): LocalDescarte {
    return {
      id: db.id,
      nome: db.nome,
      cnpj: db.cnpj || undefined,
      telefone: db.telefone || undefined,
      rua: db.rua,
      numero: db.numero || '',
      bairro: db.bairro || '',
      cidade: db.cidade,
      uf: db.uf,
      cep: db.cep || undefined,
      tipoLocal: db.tipo_local || undefined,
      licenca: db.licenca || undefined,
      observacoes: db.observacoes || undefined,
      isPadrao: db.is_padrao,
      createdAt: db.created_at,
      usuarioId: db.usuario_id,
    };
  }

  private mapLocalDescarteToDB(local: Partial<LocalDescarte>): any {
    const result: Record<string, unknown> = {};
    const mappings: Array<[keyof LocalDescarte, string]> = [
      ['nome', 'nome'], ['cnpj', 'cnpj'], ['telefone', 'telefone'],
      ['rua', 'rua'], ['numero', 'numero'], ['bairro', 'bairro'],
      ['cidade', 'cidade'], ['uf', 'uf'], ['cep', 'cep'],
      ['tipoLocal', 'tipo_local'], ['licenca', 'licenca'],
      ['observacoes', 'observacoes'], ['isPadrao', 'is_padrao'],
    ];
    mappings.forEach(([source, target]) => {
      if (local[source] !== undefined) result[target] = local[source];
    });
    return result;
  }

  private mapDBToCTR(db: any): CTR {
    return {
      id: db.id,
      numero: db.numero,
      data: db.data,
      horaSaida: db.hora_saida,
      tipoOperacao: db.tipo_operacao,
      
      origemCep: db.origem_cep || '',
      origemEndereco: db.origem_endereco,
      origemBairro: db.origem_bairro || '',
      origemCidade: db.origem_cidade,
      origemUF: db.origem_uf,
      origemResponsavel: db.origem_responsavel || '',
      origemTelefone: db.origem_telefone || '',
      origemObservacao: db.origem_observacao || '',
      
      geradorNome: db.gerador_nome,
      geradorCpfCnpj: db.gerador_cpf_cnpj,
      geradorCep: db.gerador_cep || '',
      geradorEndereco: db.gerador_endereco || '',
      geradorBairro: db.gerador_bairro || '',
      geradorCidade: db.gerador_cidade || '',
      geradorUF: db.gerador_uf || undefined,
      geradorResponsavel: db.gerador_responsavel || '',
      geradorTelefone: db.gerador_telefone || '',
      
      // Transportador - campos que existem na tabela
      transportadorNome: db.transportador_nome,
      transportadorCpfCnpj: db.transportador_cpf_cnpj,
      transportadorInscricao: db.transportador_inscricao || undefined,
      // Campos que NÃO existem na tabela - usar string vazia
      transportadorMotorista: db.transportador_motorista || '',
      transportadorPlaca: db.transportador_placa || '',
      transportadorTipoVeiculo: db.transportador_tipo_veiculo || '',
      transportadorLicenca: db.transportador_licenca || '',
      transportadorTelefone: db.transportador_telefone || '',
      
      destinatarioNome: db.destinatario_nome,
      destinatarioCpfCnpj: db.destinatario_cpf_cnpj || '',
      destinatarioEndereco: db.destinatario_endereco,
      destinatarioBairro: db.destinatario_bairro || '',
      destinatarioCidade: db.destinatario_cidade,
      destinatarioUF: db.destinatario_uf,
      destinatarioTipoLocal: db.destinatario_tipo_local || undefined,
      destinatarioLicenca: db.destinatario_licenca || '',
      
      residuoClasse: db.residuo_classe || undefined,
      residuoDescricao: db.residuo_descricao,
      residuoAcondicionamento: db.residuo_acondicionamento || '',
      residuoQuantidade: db.residuo_quantidade,
      residuoUnidade: db.residuo_unidade,
      
      // Declarações - campos que existem na tabela
      declaracaoGeradorNome: '', // Campo não existe na tabela
      declaracaoGeradorAssinatura: undefined,
      declaracaoTransportadorNome: db.declaracao_transportador_nome || '',
      declaracaoTransportadorAssinatura: db.declaracao_transportador_assinatura || undefined,
      declaracaoRecebedorNome: db.declaracao_recebedor_nome || '',
      declaracaoRecebedorAssinatura: db.declaracao_recebedor_assinatura || undefined,
      declaracaoRecebedorDataHora: db.declaracao_recebedor_data_hora || undefined,
      declaracaoRecebedorCarimbo: db.declaracao_recebedor_carimbo || undefined,
      declaracaoRecebedorObservacao: db.declaracao_recebedor_observacao || undefined,
      
      status: db.status,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
      usuarioId: db.usuario_id,
    };
  }

  private mapDBToCTRItem(db: any): CTRItem {
    return {
      id: db.id,
      ctrId: db.ctr_id,
      aluguelId: db.aluguel_id,
      clienteId: db.cliente_id,
      snapshotClienteNome: db.snapshot_dados?.clienteNome || '',
      snapshotClienteCpfCnpj: db.snapshot_dados?.clienteCpfCnpj || '',
      snapshotEnderecoObra: db.snapshot_dados?.enderecoObra || '',
      snapshotDataRetirada: db.snapshot_dados?.dataRetirada || '',
      createdAt: db.created_at,
    };
  }
}
