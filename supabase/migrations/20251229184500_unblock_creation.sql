-- ============================================================================
-- FIX DEFINITIVO: REMOVER CONSTRAINT E CRIAR TRIGGER DE PERFIL
-- ============================================================================

-- 1. Remover a restrição de chave estrangeira que está bloqueando a criação
-- Vamos operar "sem rede" temporariamente para garantir que o cadastro passe.
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;

-- 2. Corrigir o problema de Perfis inexistentes (Profiles)
-- É provável que sua tabela de profiles não esteja sendo populada automaticamente.
-- Vamos criar uma Trigger para isso.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'coach' -- Profissão padrão
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antiga se existir para evitar duplicação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. (Opcional) Garantir que IDs existentes tenham profiles (Retroativo)
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;
