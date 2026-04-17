-- =====================================================
-- MIGRATION: CTR - Controle de Transporte de Resíduos
-- Created: 2026-04-12
-- =====================================================

-- Enable UUID extension (se ainda não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums específicos do CTR
CREATE TYPE ctr_status AS ENUM ('rascunho', 'emitido');
CREATE TYPE ctr_tipo_operacao AS ENUM ('coleta', 'transporte', 'transbordo', 'tratamento', 'destinacao_final');
CREATE TYPE ctr_residuo_classe AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'Inerte');
CREATE TYPE ctr_residuo_unidade AS ENUM ('m3', 'kg', 'ton', 'unidade', 'litros');
CREATE TYPE ctr_tipo_local_descarte AS ENUM ('aterro_sanitario', 'usina_reciclagem', 'area_transbordo', 'centro_tratamento', 'disposicao_final', 'outro');
CREATE TYPE ctr_uf AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- =====================================================
-- TABELA: Locais de Descarte
-- =====================================================
CREATE TABLE IF NOT EXISTS public.locais_descarte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cnpj TEXT,
    telefone TEXT,
    rua TEXT NOT NULL,
    numero TEXT DEFAULT '',
    bairro TEXT DEFAULT '',
    cidade TEXT NOT NULL,
    uf ctr_uf NOT NULL DEFAULT 'SP',
    cep TEXT,
    tipo_local ctr_tipo_local_descarte,
    licenca TEXT,
    observacoes TEXT,
    is_padrao BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: CTRs Emitidos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ctrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id TEXT NOT NULL,
    
    -- Numeração
    numero TEXT NOT NULL UNIQUE,
    
    -- Identificação
    data DATE NOT NULL,
    hora_saida TIME NOT NULL,
    tipo_operacao ctr_tipo_operacao NOT NULL DEFAULT 'coleta',
    
    -- Origem do Resíduo
    origem_endereco TEXT NOT NULL,
    origem_bairro TEXT DEFAULT '',
    origem_cidade TEXT NOT NULL,
    origem_uf ctr_uf NOT NULL DEFAULT 'SP',
    origem_responsavel TEXT DEFAULT '',
    origem_telefone TEXT,
    origem_observacao TEXT,
    
    -- Gerador
    gerador_nome TEXT NOT NULL,
    gerador_cpf_cnpj TEXT NOT NULL,
    gerador_endereco TEXT DEFAULT '',
    gerador_bairro TEXT DEFAULT '',
    gerador_cidade TEXT DEFAULT '',
    gerador_uf ctr_uf,
    gerador_responsavel TEXT DEFAULT '',
    gerador_telefone TEXT,
    
    -- Transportador
    transportador_nome TEXT NOT NULL,
    transportador_cpf_cnpj TEXT NOT NULL,
    transportador_inscricao TEXT,
    transportador_motorista TEXT NOT NULL,
    transportador_placa TEXT NOT NULL,
    transportador_tipo_veiculo TEXT DEFAULT '',
    transportador_licenca TEXT,
    transportador_telefone TEXT,
    
    -- Destinatário
    destinatario_nome TEXT NOT NULL,
    destinatario_cpf_cnpj TEXT,
    destinatario_endereco TEXT NOT NULL,
    destinatario_bairro TEXT DEFAULT '',
    destinatario_cidade TEXT NOT NULL,
    destinatario_uf ctr_uf NOT NULL DEFAULT 'SP',
    destinatario_tipo_local ctr_tipo_local_descarte,
    destinatario_licenca TEXT,
    
    -- Resíduo
    residuo_classe ctr_residuo_classe,
    residuo_descricao TEXT NOT NULL,
    residuo_acondicionamento TEXT DEFAULT '',
    residuo_quantidade NUMERIC(10,3) NOT NULL DEFAULT 1,
    residuo_unidade ctr_residuo_unidade NOT NULL DEFAULT 'm3',
    
    -- Declarações
    declaracao_gerador_nome TEXT,
    declaracao_gerador_assinatura TEXT,
    declaracao_transportador_nome TEXT,
    declaracao_transportador_assinatura TEXT,
    declaracao_recebedor_nome TEXT,
    declaracao_recebedor_assinatura TEXT,
    declaracao_recebedor_data_hora TIMESTAMP WITH TIME ZONE,
    declaracao_recebedor_carimbo TEXT,
    declaracao_recebedor_observacao TEXT,
    
    -- Metadados
    status ctr_status NOT NULL DEFAULT 'emitido',
    local_descarte_id UUID REFERENCES public.locais_descarte(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Itens do CTR (vínculo com aluguéis + snapshots)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ctr_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ctr_id UUID NOT NULL REFERENCES public.ctrs(id) ON DELETE CASCADE,
    aluguel_id TEXT NOT NULL,
    cliente_id TEXT NOT NULL,
    
    -- Snapshot dos dados no momento da emissão (JSONB para flexibilidade)
    snapshot_dados JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SEQUÊNCIA: Contador de CTRs por usuário/ano
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ctr_sequenciais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id TEXT NOT NULL,
    ano INTEGER NOT NULL,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    UNIQUE(usuario_id, ano)
);

-- =====================================================
-- ÍNDICES para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_locais_descarte_usuario ON public.locais_descarte(usuario_id);
CREATE INDEX IF NOT EXISTS idx_locais_descarte_padrao ON public.locais_descarte(usuario_id, is_padrao) WHERE is_padrao = TRUE;
CREATE INDEX IF NOT EXISTS idx_ctrs_usuario ON public.ctrs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ctrs_numero ON public.ctrs(numero);
CREATE INDEX IF NOT EXISTS idx_ctrs_data ON public.ctrs(data);
CREATE INDEX IF NOT EXISTS idx_ctrs_status ON public.ctrs(status);
CREATE INDEX IF NOT EXISTS idx_ctr_itens_ctr ON public.ctr_itens(ctr_id);
CREATE INDEX IF NOT EXISTS idx_ctr_sequenciais_lookup ON public.ctr_sequenciais(usuario_id, ano);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.locais_descarte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctr_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctr_sequenciais ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança: cada usuário acessa APENAS seus próprios dados
CREATE POLICY "Usuários gerenciam próprios locais de descarte"
ON public.locais_descarte
FOR ALL
TO authenticated
USING (usuario_id = auth.uid());

CREATE POLICY "Usuários gerenciam próprios CTRs"
ON public.ctrs
FOR ALL
TO authenticated
USING (usuario_id = auth.uid());

CREATE POLICY "Usuários acessam itens de CTR via propriedade do CTR"
ON public.ctr_itens
FOR ALL
TO authenticated
USING (
    ctr_id IN (
        SELECT id FROM public.ctrs
        WHERE usuario_id = auth.uid()
    )
);

CREATE POLICY "Usuários gerenciam próprios sequenciais"
ON public.ctr_sequenciais
FOR ALL
TO authenticated
USING (usuario_id = auth.uid());

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- 1. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_locais_descarte_updated_at
    BEFORE UPDATE ON public.locais_descarte
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ctrs_updated_at
    BEFORE UPDATE ON public.ctrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Função para garantir apenas um padrão por usuário
CREATE OR REPLACE FUNCTION garantir_unico_local_padrao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_padrao = TRUE THEN
        UPDATE public.locais_descarte
        SET is_padrao = FALSE
        WHERE usuario_id = NEW.usuario_id
          AND id != NEW.id
          AND is_padrao = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_garantir_unico_padrao
    BEFORE INSERT OR UPDATE ON public.locais_descarte
    FOR EACH ROW
    EXECUTE FUNCTION garantir_unico_local_padrao();

-- 3. Função para gerar próximo número de CTR
CREATE OR REPLACE FUNCTION gerar_proximo_numero_ctr(p_usuario_id TEXT, p_ano INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_proximo INTEGER;
BEGIN
    -- Tenta inserir ou atualizar o sequencial
    INSERT INTO public.ctr_sequenciais (usuario_id, ano, ultimo_numero)
    VALUES (p_usuario_id, p_ano, 1)
    ON CONFLICT (usuario_id, ano)
    DO UPDATE SET ultimo_numero = ctr_sequenciais.ultimo_numero + 1
    RETURNING ultimo_numero INTO v_proximo;
    
    -- Retorna o número formatado: CTR-ANO-XXXXXX
    RETURN 'CTR-' || p_ano || '-' || LPAD(v_proximo::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SETUP
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.locais_descarte;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ctrs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ctr_itens;
