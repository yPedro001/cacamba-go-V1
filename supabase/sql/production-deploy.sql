-- =====================================================
-- SQL PARA PRODUÇÃO: Executar no SQL Editor do Supabase
-- =====================================================

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE ctr_status AS ENUM ('rascunho', 'emitido');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ctr_tipo_operacao AS ENUM ('coleta', 'transporte', 'transbordo', 'tratamento', 'destinacao_final');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ctr_residuo_classe AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'Inerte');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ctr_residuo_unidade AS ENUM ('m3', 'kg', 'ton', 'unidade', 'litros');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ctr_tipo_local_descarte AS ENUM ('aterro_sanitario', 'usina_reciclagem', 'area_transbordo', 'centro_tratamento', 'disposicao_final', 'outro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ctr_uf AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela: Locais de Descarte
CREATE TABLE IF NOT EXISTS public.locais_descarte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cnpj TEXT,
    inscricao_estadual TEXT,
    rua TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    cep TEXT,
    telefone TEXT,
    email TEXT,
    tipo_local ctr_tipo_local_descarte DEFAULT 'outro',
    licenca TEXT,
    is_padrao BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela: CTRs
CREATE TABLE IF NOT EXISTS public.ctrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT NOT NULL,
    numero TEXT NOT NULL UNIQUE,
    data DATE NOT NULL,
    hora_saida TIME NOT NULL,
    tipo_operacao ctr_tipo_operacao NOT NULL,
    
    origem_cep TEXT,
    origem_endereco TEXT NOT NULL,
    origem_bairro TEXT,
    origem_cidade TEXT NOT NULL,
    origem_uf ctr_uf NOT NULL,
    origem_responsavel TEXT,
    origem_telefone TEXT,
    origem_observacao TEXT,
    
    gerador_nome TEXT NOT NULL,
    gerador_cpf_cnpj TEXT NOT NULL,
    gerador_cep TEXT,
    gerador_endereco TEXT,
    gerador_bairro TEXT,
    gerador_cidade TEXT,
    gerador_uf ctr_uf,
    gerador_responsavel TEXT,
    gerador_telefone TEXT,
    
    transportador_nome TEXT NOT NULL,
    transportador_cpf_cnpj TEXT NOT NULL,
    transportador_inscricao TEXT,
    transportador_telefone TEXT,
    
    destinatario_nome TEXT NOT NULL,
    destinatario_cpf_cnpj TEXT,
    destinatario_endereco TEXT NOT NULL,
    destinatario_bairro TEXT,
    destinatario_cidade TEXT NOT NULL,
    destinatario_uf ctr_uf NOT NULL,
    destinatario_tipo_local ctr_tipo_local_descarte DEFAULT 'outro',
    destinatario_licenca TEXT,
    
    residuo_classe ctr_residuo_classe NOT NULL,
    residuo_descricao TEXT NOT NULL,
    residuo_acondicionamento TEXT,
    residuo_quantidade NUMERIC NOT NULL,
    residuo_unidade ctr_residuo_unidade NOT NULL,
    
    declaracao_transportador_nome TEXT,
    declaracao_transportador_assinatura TEXT,
    declaracao_recebedor_nome TEXT,
    declaracao_recebedor_assinatura TEXT,
    declaracao_recebedor_data_hora TIMESTAMP,
    declaracao_recebedor_carimbo TEXT,
    declaracao_recebedor_observacao TEXT,
    
    status ctr_status DEFAULT 'emitido',
    local_descarte_id UUID REFERENCES public.locais_descarte(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela: CTR Itens
CREATE TABLE IF NOT EXISTS public.ctr_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ctr_id UUID NOT NULL REFERENCES public.ctrs(id) ON DELETE CASCADE,
    aluguel_id UUID,
    cliente_id UUID,
    snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela: CTR Sequenciais
CREATE TABLE IF NOT EXISTS public.ctr_sequenciais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT NOT NULL UNIQUE,
    sequencial INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Função: Gerar próximo número CTR
CREATE OR REPLACE FUNCTION gerar_proximo_numero_ctr(p_usuario_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_ano TEXT;
    v_proximo INTEGER;
    v_resultado TEXT;
BEGIN
    v_ano := EXTRACT(YEAR FROM NOW())::TEXT;
    
    INSERT INTO public.ctr_sequenciais (usuario_id, sequencial, created_at, updated_at)
    VALUES (p_usuario_id, 1, NOW(), NOW())
    ON CONFLICT (usuario_id) DO UPDATE 
    SET sequencial = ctr_sequenciais.sequencial + 1,
        updated_at = NOW()
    RETURNING sequencial INTO v_proximo;
    
    RETURN LPAD(v_proximo::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função: Emitir CTR Atômico
CREATE OR REPLACE FUNCTION emitir_ctr_atomico(
    p_usuario_id TEXT,
    p_data TEXT,
    p_hora_saida TEXT,
    p_tipo_operacao TEXT,
    
    p_origem_cep TEXT,
    p_origem_endereco TEXT,
    p_origem_bairro TEXT,
    p_origem_cidade TEXT,
    p_origem_uf TEXT,
    p_origem_responsavel TEXT,
    p_origem_telefone TEXT,
    p_origem_observacao TEXT,
    
    p_gerador_nome TEXT,
    p_gerador_cpf_cnpj TEXT,
    p_gerador_cep TEXT,
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
    v_now TIMESTAMP;
BEGIN
    v_now := NOW();
    
    -- Gerar número
    BEGIN
        SELECT gerar_proximo_numero_ctr(p_usuario_id) INTO v_numero;
    EXCEPTION WHEN OTHERS THEN
        v_numero := EXTRACT(EPOCH FROM v_now)::TEXT;
    END;
    
    -- Inserir CTR
    INSERT INTO ctrs (
        usuario_id, numero, data, hora_saida, tipo_operacao,
        origem_cep, origem_endereco, origem_bairro, origem_cidade, origem_uf, origem_responsavel, origem_telefone, origem_observacao,
        gerador_nome, gerador_cpf_cnpj, gerador_cep, gerador_endereco, gerador_bairro, gerador_cidade, gerador_uf, gerador_responsavel, gerador_telefone,
        transportador_nome, transportador_cpf_cnpj, transportador_inscricao, transportador_telefone,
        destinatario_nome, destinatario_cpf_cnpj, destinatario_endereco, destinatario_bairro, destinatario_cidade, destinatario_uf, destinatario_tipo_local, destinatario_licenca,
        residuo_classe, residuo_descricao, residuo_acondicionamento, residuo_quantidade, residuo_unidade,
        declaracao_transportador_nome, declaracao_transportador_assinatura, declaracao_recebedor_nome, declaracao_recebedor_assinatura, declaracao_recebedor_data_hora, declaracao_recebedor_carimbo, declaracao_recebedor_observacao,
        status, local_descarte_id, created_at, updated_at
    ) VALUES (
        p_usuario_id, v_numero, p_data::DATE, p_hora_saida::TIME, p_tipo_operacao::ctr_tipo_operacao,
        p_origem_cep, p_origem_endereco, p_origem_bairro, p_origem_cidade, p_origem_uf::ctr_uf, p_origem_responsavel, p_origem_telefone, p_origem_observacao,
        p_gerador_nome, p_gerador_cpf_cnpj, p_gerador_cep, p_gerador_endereco, p_gerador_bairro, p_gerador_cidade, p_gerador_uf::ctr_uf, p_gerador_responsavel, p_gerador_telefone,
        p_transportador_nome, p_transportador_cpf_cnpj, p_transportador_inscricao, p_transportador_telefone,
        p_destinatario_nome, p_destinatario_cpf_cnpj, p_destinatario_endereco, p_destinatario_bairro, p_destinatario_cidade, p_destinatario_uf::ctr_uf, p_destinatario_tipo_local::ctr_tipo_local_descarte, p_destinatario_licenca,
        p_residuo_classe::ctr_residuo_classe, p_residuo_descricao, p_residuo_acondicionamento, p_residuo_quantidade, p_residuo_unidade::ctr_residuo_unidade,
        p_declaracao_transportador_nome, p_declaracao_transportador_assinatura, p_declaracao_recebedor_nome, p_declaracao_recebedor_assinatura, p_declaracao_recebedor_data_hora, p_declaracao_recebedor_carimbo, p_declaracao_recebedor_observacao,
        'emitido', p_local_descarte_id, v_now, v_now
    )
    RETURNING * INTO v_ctr;
    
    RETURN QUERY SELECT v_ctr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar resultado
SELECT 'Tabelas e funções criadas com sucesso!' as mensagem;
