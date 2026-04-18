import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  const { 
    p_usuario_id, p_data, p_hora_saida, p_tipo_operacao,
    p_origem_cep, p_origem_endereco, p_origem_bairro, p_origem_cidade, p_origem_uf, p_origem_responsavel, p_origem_telefone, p_origem_observacao,
    p_gerador_nome, p_gerador_cpf_cnpj, p_gerador_cep, p_gerador_endereco, p_gerador_bairro, p_gerador_cidade, p_gerador_uf, p_gerador_responsavel, p_gerador_telefone,
    p_transportador_nome, p_transportador_cpf_cnpj, p_transportador_inscricao, p_transportador_telefone,
    p_destinatario_nome, p_destinatario_cpf_cnpj, p_destinatario_endereco, p_destinatario_bairro, p_destinatario_cidade, p_destinatario_uf, p_destinatario_tipo_local, p_destinatario_licenca,
    p_residuo_classe, p_residuo_descricao, p_residuo_acondicionamento, p_residuo_quantidade, p_residuo_unidade,
    p_declaracao_transportador_nome, p_declaracao_transportador_assinatura, p_declaracao_recebedor_nome, p_declaracao_recebedor_assinatura, p_declaracao_recebedor_data_hora, p_declaracao_recebedor_carimbo, p_declaracao_recebedor_observacao,
    p_local_descarte_id, p_itens
  } = await req.json()

  try {
    // Usar função atômica do banco para garantir integridade
    // Isso evita race conditions na geração de número CTR
    const { data: ctr, error: ctrError } = await supabase.rpc('emitir_ctr_atomico', {
      p_usuario_id,
      p_data,
      p_hora_saida,
      p_tipo_operacao,
      
      p_origem_cep: p_origem_cep || null,
      p_origem_endereco,
      p_origem_bairro,
      p_origem_cidade,
      p_origem_uf,
      p_origem_responsavel,
      p_origem_telefone,
      p_origem_observacao,
      
      p_gerador_nome,
      p_gerador_cpf_cnpj,
      p_gerador_cep: p_gerador_cep || null,
      p_gerador_endereco,
      p_gerador_bairro,
      p_gerador_cidade,
      p_gerador_uf,
      p_gerador_responsavel,
      p_gerador_telefone,
      
      p_transportador_nome,
      p_transportador_cpf_cnpj,
      p_transportador_inscricao,
      p_transportador_telefone,
      
      p_destinatario_nome,
      p_destinatario_cpf_cnpj,
      p_destinatario_endereco,
      p_destinatario_bairro,
      p_destinatario_cidade,
      p_destinatario_uf,
      p_destinatario_tipo_local,
      p_destinatario_licenca,
      
      p_residuo_classe,
      p_residuo_descricao,
      p_residuo_acondicionamento,
      p_residuo_quantidade,
      p_residuo_unidade,
      
      p_declaracao_transportador_nome,
      p_declaracao_transportador_assinatura,
      p_declaracao_recebedor_nome,
      p_declaracao_recebedor_assinatura,
      p_declaracao_recebedor_data_hora: p_declaracao_recebedor_data_hora ? new Date(p_declaracao_recebedor_data_hora) : null,
      p_declaracao_recebedor_carimbo,
      p_declaracao_recebedor_observacao,
      
      p_local_descarte_id,
      p_itens: p_itens || null
    })

    if (ctrError) {
      console.error('Erro ao chamar função atômica:', ctrError)
      throw new Error(`Erro ao criar CTR: ${ctrError.message}`)
    }

    if (!ctr) {
      throw new Error('CTR não foi criado pela função atômica')
    }

    return new Response(JSON.stringify(ctr), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na Edge Function emitir-ctr:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})