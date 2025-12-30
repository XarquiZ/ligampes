-- ============================================================================
-- SCRIPT DE REPARO E VERIFICAÇÃO TOTAL DO BANCO DE DADOS
-- ============================================================================

-- 1. Criar tabela de organizations se não existir
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  logo_url TEXT,
  settings JSONB DEFAULT '{
    "max_teams": 8, 
    "max_tournaments": 1, 
    "allow_custom_domain": false, 
    "remove_branding": false,
    "game_type": "EAFC"
  }'::jsonb,
  theme_config JSONB DEFAULT '{
    "primary_color": "#22c55e", 
    "mode": "dark"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Garantir que as colunas existam (caso a tabela já existisse mas incompleta)
DO $$
BEGIN
    ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
    ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 4. Criar Policies de Acesso (CRUD)

-- Permitir LEITURA PÚBLICA (Necessário para a Landing Page e Login funcionar)
DROP POLICY IF EXISTS "Public Organizations Access" ON public.organizations;
CREATE POLICY "Public Organizations Access" 
ON public.organizations FOR SELECT 
USING (true);

-- Permitir CRIAÇÃO por usuários autenticados (Para o fluxo de /criar funcionar)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Permitir ATUALIZAÇÃO apenas pelo dono (Admin Dashboard)
DROP POLICY IF EXISTS "Owners can update their organization" ON public.organizations;
CREATE POLICY "Owners can update their organization" 
ON public.organizations FOR UPDATE 
USING (auth.uid() = owner_id);

-- 5. Adicionar coluna organization_id nas tabelas relacionadas
-- Isso prepara o terreno para multi-tenancy real no futuro
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 6. Indices de Performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
