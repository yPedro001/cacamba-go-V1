-- =====================================================
-- MIGRATION: CTR - Criar função de transação atômica
-- Created: 2026-04-15
-- =====================================================

-- Função para emitir CTR com transação atômica
-- Insere CTR + Itens em uma única transação
CREATE OR REPLACE FUNCTION emitir_ctr_atomico(
  p_usuario_id TEXT,
  p_data TEXT,
  p_hora_saida TEXT,
  p_tipo_operacao TEXT,
  
  p_origem_endereco TEXT,
  p_origem_bairro TEXT,
  p_origem_cidade TEXT,
  p_origem_uf TEXT,
  p_origem_responsavel TEXT,
  p_origem_telefone TEXT,
  p_origem_observacao TEXT,
  
  p_gerador_nome TEXT,
  p_gerador_cpf_cnpj TEXT,
  p_gerador_endereco TEXT,
  p_gerador_bairro TEXT,
  p_gerador_cidade TEXT,
  p_gerador_uf TEXT,
  p_gerador_responsavel TEXT,
  p_gerador_telefone TEXT,
  
  p_transportador_nome TEXT,
  p_transportador_cpf_cnpj TEXT,
  p_transportador_inscricao TEXT,
  p_transportador_telefone TEXT,
  
  p_destinatario_nome TEXT,
  p_destinatario_cpf_cnpj TEXT,
  p_destinatario_endereco TEXT,
  p_destinatario_bairro TEXT,
  p_destinatario_cidade TEXT,
  p_destinatario_uf TEXT,
  p_destinatario_tipo_local TEXT,
  p_destinatario_licenca TEXT,
  
  p_residuo_classe TEXT,
  p_residuo_descricao TEXT,
  p_residuo_acondicionamento TEXT,
  p_residuo_quantidade NUMERIC,
  p_residuo_unidade TEXT,
  
  p_declaracao_transportador_nome TEXT,
  p_declaracao_transportador_assinatura TEXT,
  p_declaracao_recebedor_nome TEXT,
  p_declaracao_recebedor_assinatura TEXT,
  p_declaracao_recebedor_data_hora TIMESTAMP,
  p_declaracao_recebedor_carimbo TEXT,
  p_declaracao_recebedor_observacao TEXT,
  
  p_local_descarte_id UUID,
  p_itens JSONB
)
RETURNS SETOF ctrs AS $$
DECLARE
  v_ctr ctrs%ROWTYPE;
  v_numero TEXT;
  v_item JSONB;
  v_aluguel_id TEXT;
  v_cliente_id TEXT;
  v_snapshot JSONB;
  v_now TIMESTAMP;
BEGIN
  v_now := NOW();
  
  BEGIN
    SELECT gerar_proximo_numero_ctr(p_usuario_id) INTO v_numero;
  EXCEPTION WHEN OTHERS THEN
    v_numero := 'FALLBACK-' || EXTRACT(EPOCH FROM v_now)::TEXT || '-' || floor(random() * 10000)::TEXT;
  END;
  
  INSERT INTO ctrs (
    usuario_id, numero, data, hora_saida, tipo_operacao,
    origem_endereco, origem_bairro, origem_cidade, origem_uf, origem_responsavel, origem_telefone, origem_observacao,
    gerador_nome, gerador_cpf_cnpj, gerador_endereco, gerador_bairro, gerador_cidade, gerador_uf, gerador_responsavel, gerador_telefone,
    transportador_nome, transportador_cpf_cnpj, transportador_inscricao, transportador_telefone,
    destinatario_nome, destinatario_cpf_cnpj, destinatario_endereco, destinatario_bairro, destinatario_cidade, destinatario_uf, destinatario_tipo_local, destinatario_licenca,
    residuo_classe, residuo_descricao, residuo_acondicionamento, residuo_quantidade, residuo_unidade,
    declaracao_transportador_nome, declaracao_transportador_assinatura, declaracao_recebedor_nome, declaracao_recebedor_assinatura, declaracao_recebedor_data_hora, declaracao_recebedor_carimbo, declaracao_recebedor_observacao,
    status, local_descarte_id, created_at, updated_at
  ) VALUES (
    p_usuario_id, v_numero, p_data::DATE, p_hora_saida::TIME, p_tipo_operacao::ctr_tipo_operacao,
    p_origem_endereco, p_origem_bairro, p_origem_cidade, p_origem_uf::ctr_uf, p_origem_responsavel, p_origem_telefone, p_origem_observacao,
    p_gerador_nome, p_gerador_cpf_cnpj, p_gerador_endereco, p_gerador_bairro, p_gerador_cidade, p_gerador_uf::ctr_uf, p_gerador_responsavel, p_gerador_telefone,
    p_transportador_nome, p_transportador_cpf_cnpj, p_transportador_inscricao, p_transportador_telefone,
    p_destinatario_nome, p_destinatario_cpf_cnpj, p_destinatario_endereco, p_destinatario_bairro, p_destinatario_cidade, p_destinatario_uf::ctr_uf, p_destinatario_tipo_local::ctr_tipo_local_descarte, p_destinatario_licenca,
    p_residuo_classe::ctr_residuo_classe, p_residuo_descricao, p_residuo_acondicionamento, p_residuo_quantidade, p_residuo_unidade::ctr_residuo_unidade,
    p_declaracao_transportador_nome, p_declaracao_transportador_assinatura, p_declaracao_recebedor_nome, p_declaracao_recebedor_assinatura, p_declaracao_recebedor_data_hora, p_declaracao_recebedor_carimbo, p_declaracao_recebedor_observacao,
    'emitido', p_local_descarte_id, v_now, v_now
  )
  RETURNING * INTO v_ctr;
  
  IF p_itens IS NOT NULL AND jsonb_array_length(p_itens) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens) LOOP
      v_aluguel_id := v_item->>'aluguelId';
      v_cliente_id := v_item->>'clienteId';
      v_snapshot := v_item->>'snapshot';
      
      INSERT INTO ctr_itens (ctr_id, aluguel_id, cliente_id, snapshot_dados, created_at)
      VALUES (v_ctr.id, v_aluguel_id, v_cliente_id, v_snapshot, v_now);
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT v_ctr.*;
  
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;