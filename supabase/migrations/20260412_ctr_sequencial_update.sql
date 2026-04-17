-- =====================================================
-- MIGRATION: CTR - Ajustes de Numeração (apenas 6 dígitos)
-- Created: 2026-04-12
-- =====================================================

-- 1. Alterar a coluna ultimo_numero para não ter limite (usar BIGINT)
ALTER TABLE public.ctr_sequenciais 
ALTER COLUMN ultimo_numero TYPE BIGINT;

-- 2. Atualizar a função para usar sequencial global (não por ano) e apenas 6 dígitos
CREATE OR REPLACE FUNCTION gerar_proximo_numero_ctr(p_usuario_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_proximo BIGINT;
    v_ano INTEGER;
BEGIN
    v_ano := EXTRACT(YEAR FROM NOW());
    
    -- Tenta inserir ou atualizar o sequencial (agora global, sem ano)
    INSERT INTO public.ctr_sequenciais (usuario_id, ano, ultimo_numero)
    VALUES (p_usuario_id, v_ano, 1)
    ON CONFLICT (usuario_id, ano)
    DO UPDATE SET ultimo_numero = ctr_sequenciais.ultimo_numero + 1
    RETURNING ultimo_numero INTO v_proximo;
    
    -- Retorna apenas os 6 dígitos (sem prefixo)
    RETURN LPAD(v_proximo::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar constraint unique para permitir apenas um sequencial por usuário (global)
-- Primeiro, remover as linhas duplicadas se existirem
DELETE FROM public.ctr_sequenciais 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM public.ctr_sequenciais 
    GROUP BY usuario_id
);

-- 4. Criar índice adicional para performance
CREATE INDEX IF NOT EXISTS idx_ctrs_numero_unique ON public.ctrs(numero);