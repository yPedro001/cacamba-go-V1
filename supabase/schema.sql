-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE cacamba_status AS ENUM ('disponivel', 'em_uso', 'manutencao');
CREATE TYPE aluguel_status AS ENUM ('pendente_pagamento', 'pago_pendente_entrega', 'ativo', 'vencido', 'finalizado');

-- Tables
CREATE TABLE public.cacambas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identificador TEXT NOT NULL UNIQUE,
    status cacamba_status NOT NULL DEFAULT 'disponivel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    telefone_fixo TEXT,
    celular TEXT,
    whatsapp TEXT,
    endereco_principal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.alugueis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    cacamba_id UUID REFERENCES public.cacambas(id) ON DELETE RESTRICT,
    local_endereco TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    valor_aluguel NUMERIC(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim_prevista DATE NOT NULL,
    data_fim_real DATE,
    status aluguel_status NOT NULL DEFAULT 'pendente_pagamento',
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    valor_pago NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data DATE NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.cacambas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alugueis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to cacambas" ON public.cacambas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to clientes" ON public.clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to alugueis" ON public.alugueis FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to gastos" ON public.gastos FOR ALL TO authenticated USING (true);

-- Functions and Triggers

-- 1. Automate Caçamba Status updates
CREATE OR REPLACE FUNCTION update_cacamba_status_on_aluguel()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o aluguel foi criado/alterado para 'ativo', a caçamba fica 'em_uso'
  IF NEW.status = 'ativo' AND (TG_OP = 'INSERT' OR OLD.status != 'ativo') THEN
    UPDATE public.cacambas SET status = 'em_uso' WHERE id = NEW.cacamba_id;
  END IF;

  -- Se o aluguel foi finalizado (retirada marcada), a caçamba fica 'disponivel'
  IF NEW.status = 'finalizado' AND (TG_OP = 'INSERT' OR OLD.status != 'finalizado') THEN
    UPDATE public.cacambas SET status = 'disponivel' WHERE id = NEW.cacamba_id;
    -- Preenche a data_fim_real
    NEW.data_fim_real := CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_update_cacamba
BEFORE INSERT OR UPDATE ON public.alugueis
FOR EACH ROW EXECUTE FUNCTION update_cacamba_status_on_aluguel();

-- Realtime Setup
alter publication supabase_realtime add table public.cacambas;
alter publication supabase_realtime add table public.alugueis;
