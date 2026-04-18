-- =====================================================
-- MIGRATION: CTR - Adicionar Campos CEP
-- Created: 2026-04-18
-- =====================================================

-- Adicionar colunas CEP na tabela ctrs (origem e gerador)
ALTER TABLE ctrs 
ADD COLUMN IF NOT EXISTS origem_cep TEXT,
ADD COLUMN IF NOT EXISTS gerador_cep TEXT;

-- Atualizar função emitir_ctr_atomico para incluir os novos parâmetros
-- (A função já foi atualizada no código, esta migration é para o banco existente)

COMMENT ON COLUMN ctrs.origem_cep IS 'CEP do endereço de origem do resíduo';
COMMENT ON COLUMN ctrs.gerador_cep IS 'CEP do endereço do gerador';