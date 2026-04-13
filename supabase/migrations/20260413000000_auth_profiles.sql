-- Dropar a tabela profiles para unificar na perfis (caso exista num reset local)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Criar a tabela perfis
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e Policies
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário pode ver o próprio perfil" ON public.perfis;
CREATE POLICY "Usuário pode ver o próprio perfil" 
ON public.perfis FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuário pode atualizar o próprio perfil" ON public.perfis;
CREATE POLICY "Usuário pode atualizar o próprio perfil" 
ON public.perfis FOR UPDATE TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuário pode inserir o próprio perfil" ON public.perfis;
CREATE POLICY "Usuário pode inserir o próprio perfil" 
ON public.perfis FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Criar a trigger para recém-cadastrados
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atachar a trigger nativa ao banco
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
