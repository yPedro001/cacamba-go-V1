import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  const { 
    p_usuario_id, p_data, p_hora_saida, p_tipo_operacao,
    p_origem_endereco, p_origem_bairro, p_origem_cidade, p_origem_uf, p_origem_responsavel, p_origem_telefone, p_origem_observacao,
    p_gerador_nome, p_gerador_cpf_cnpj, p_gerador_endereco, p_gerador_bairro, p_gerador_cidade, p_gerador_uf, p_gerador_responsavel, p_gerador_telefone,
    p_transportador_nome, p_transportador_cpf_cnpj, p_transportador_inscricao, p_transportador_telefone,
    p_destinatario_nome, p_destinatario_cpf_cnpj, p_destinatario_endereco, p_destinatario_bairro, p_destinatario_cidade, p_destinatario_uf, p_destinatario_tipo_local, p_destinatario_licenca,
    p_residuo_classe, p_residuo_descricao, p_residuo_acondicionamento, p_residuo_quantidade, p_residuo_unidade,
    p_declaracao_transportador_nome, p_declaracao_transportador_assinatura, p_declaracao_recebedor_nome, p_declaracao_recebedor_assinatura, p_declaracao_recebedor_data_hora, p_declaracao_recebedor_carimbo, p_declaracao_recebedor_observacao,
    p_local_descarte_id, p_itens
  } = await req.json()

  try {
    // Chamar função para gerar número
    const { data: numeroData } = await supabase.functions.invoke('gerar-numero-ctr', {
      body: { p_usuario_id }
    })
    const numero = numeroData || `FALLBACK-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
    const now = new Date().toISOString()

    // Inserir CTR
    const { data: ctr, error: ctrError } = await supabase
      .from('ctrs')
      .insert({
        usuario_id: p_usuario_id,
        numero,
        data: p_data,
        hora_saida: p_hora_saida,
        tipo_operacao: p_tipo_operacao,
        origem_endereco: p_origem_endereco,
        origem_bairro: p_origem_bairro || '',
        origem_cidade: p_origem_cidade,
        origem_uf: p_origem_uf,
        origem_responsavel: p_origem_responsavel || '',
        origem_telefone: p_origem_telefone || '',
        origem_observacao: p_origem_observacao || '',
        gerador_nome: p_gerador_nome,
        gerador_cpf_cnpj: p_gerador_cpf_cnpj,
        gerador_endereco: p_gerador_endereco || '',
        gerador_bairro: p_gerador_bairro || '',
        gerador_cidade: p_gerador_cidade || '',
        gerador_uf: p_gerador_uf || 'SP',
        gerador_responsavel: p_gerador_responsavel || '',
        gerador_telefone: p_gerador_telefone || '',
        transportador_nome: p_transportador_nome,
        transportador_cpf_cnpj: p_transportador_cpf_cnpj,
        transportador_inscricao: p_transportador_inscricao || '',
        transportador_telefone: p_transportador_telefone || '',
        destinatario_nome: p_destinatario_nome,
        destinatario_cpf_cnpj: p_destinatario_cpf_cnpj || '',
        destinatario_endereco: p_destinatario_endereco,
        destinatario_bairro: p_destinatario_bairro || '',
        destinatario_cidade: p_destinatario_cidade,
        destinatario_uf: p_destinatario_uf,
        destinatario_tipo_local: p_destinatario_tipo_local || null,
        destinatario_licenca: p_destinatario_licenca || '',
        residuo_classe: p_residuo_classe || null,
        residuo_descricao: p_residuo_descricao,
        residuo_acondicionamento: p_residuo_acondicionamento || '',
        residuo_quantidade: p_residuo_quantidade,
        residuo_unidade: p_residuo_unidade,
        declaracao_transportador_nome: p_declaracao_transportador_nome || '',
        declaracao_transportador_assinatura: p_declaracao_transportador_assinatura || null,
        declaracao_recebedor_nome: p_declaracao_recebedor_nome || '',
        declaracao_recebedor_assinatura: p_declaracao_recebedor_assinatura || null,
        declaracao_recebedor_data_hora: p_declaracao_recebedor_data_hora || null,
        declaracao_recebedor_carimbo: p_declaracao_recebedor_carimbo || null,
        declaracao_recebedor_observacao: p_declaracao_recebedor_observacao || null,
        status: 'emitido',
        local_descarte_id: p_local_descarte_id,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (ctrError) throw new Error(`Erro ao criar CTR: ${ctrError.message}`)
    if (!ctr) throw new Error('CTR não foi criado')

    // Inserir itens
    if (p_itens && Array.isArray(p_itens) && p_itens.length > 0) {
      const itensData = p_itens.map((item: any) => ({
        ctr_id: ctr.id,
        aluguel_id: item.aluguelId,
        cliente_id: item.clienteId,
        snapshot_dados: item.snapshot,
        created_at: now,
      }))

      const { error: itensError } = await supabase.from('ctr_itens').insert(itensData)
      if (itensError) throw new Error(`Erro ao criar itens: ${itensError.message}`)
    }

    return new Response(JSON.stringify(ctr), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})