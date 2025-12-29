-- ============================================================================
-- MIGRAÇÃO MULTI-TENANT (SaaS)
-- ============================================================================

-- 1. Criar tabela de Organizações (Ligas)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES auth.users(id),
    theme_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar tabela de Membros da Organização
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- BACKFILL: CRIAR ORGANIZAÇÃO PADRÃO PARA DADOS LEGADOS
-- ============================================================================

DO $$
DECLARE
    v_default_org_id UUID;
    v_owner_id UUID;
BEGIN
    -- Tenta pegar o primeiro usuário admins (se existir) para ser o dono, senão deixa NULL
    SELECT id INTO v_owner_id FROM auth.users LIMIT 1;

    -- Cria a organização padrão se não existir
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES ('Liga Principal', 'liga-principal', v_owner_id)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_default_org_id;

    -- ========================================================================
    -- MIGRAR TABELAS EXISTENTES
    -- ========================================================================

    -- Lista de tabelas para migrar
    -- profiles, teams, players, matches, player_match_stats, auctions, bids, 
    -- player_transfers, balance_transactions, team_transactions
    -- notifications/announcements (se existirem, tratar abaixo)

    -- PROFILES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.profiles SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
    END IF;

    -- TEAMS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'organization_id') THEN
        ALTER TABLE public.teams ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.teams SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_teams_org ON public.teams(organization_id);
    END IF;

    -- PLAYERS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'organization_id') THEN
        ALTER TABLE public.players ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.players SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_players_org ON public.players(organization_id);
    END IF;

    -- MATCHES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'organization_id') THEN
        ALTER TABLE public.matches ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.matches SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_matches_org ON public.matches(organization_id);
    END IF;

    -- PLAYER_MATCH_STATS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_match_stats' AND column_name = 'organization_id') THEN
        ALTER TABLE public.player_match_stats ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.player_match_stats SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_player_match_stats_org ON public.player_match_stats(organization_id);
    END IF;

    -- AUCTIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auctions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.auctions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.auctions SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_auctions_org ON public.auctions(organization_id);
    END IF;

    -- BIDS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'organization_id') THEN
        ALTER TABLE public.bids ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.bids SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_bids_org ON public.bids(organization_id);
    END IF;

    -- PLAYER_TRANSFERS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_transfers' AND column_name = 'organization_id') THEN
        ALTER TABLE public.player_transfers ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.player_transfers SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_player_transfers_org ON public.player_transfers(organization_id);
    END IF;

    -- BALANCE_TRANSACTIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'balance_transactions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.balance_transactions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.balance_transactions SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        CREATE INDEX idx_balance_transactions_org ON public.balance_transactions(organization_id);
    END IF;

    -- TEAM_TRANSACTIONS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_transactions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_transactions' AND column_name = 'organization_id') THEN
            ALTER TABLE public.team_transactions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
            UPDATE public.team_transactions SET organization_id = v_default_org_id WHERE organization_id IS NULL;
            CREATE INDEX idx_team_transactions_org ON public.team_transactions(organization_id);
        END IF;
    END IF;

     -- ANNOUNCEMENTS (Verificando se existe, pois é de outra migration)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'organization_id') THEN
            ALTER TABLE public.announcements ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
            UPDATE public.announcements SET organization_id = v_default_org_id WHERE organization_id IS NULL;
            CREATE INDEX idx_announcements_org ON public.announcements(organization_id);
        END IF;
    END IF;
    
END $$;

-- ============================================================================
-- HABILITAR RLS NAS NOVAS TABELAS
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ATUALIZAR POLICIES EXISTENTES (Exemplo genérico - DEVE SER AJUSTADO NA APLICAÇÃO)
-- ============================================================================

-- IMPORTANTE:
-- As policies abaixo são exemplos para filtrar dados por Organização.
-- O front-end precisará passar o 'organization_id' de alguma forma segura ou
-- o usuário deve estar vinculado à organização para ver os dados.

-- Função helper para verificar acesso à organização
CREATE OR REPLACE FUNCTION public.has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Se o usuário é admin global ou membro da org
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = org_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = org_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Exemplo: Atualizar Policy de Teams para filtrar por Organização
-- DROP POLICY IF EXISTS "Todos podem ver todos os times" ON public.teams;
-- CREATE POLICY "Membros veem times da org" ON public.teams
-- FOR SELECT USING (
--   organization_id IN (
--     SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
--   )
--   OR 
--   organization_id IN (
--      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
--   )
-- );

-- NOTA: Como solicitado, estamos preparando o terreno. 
-- As Policies efetivas de isolamento devem ser aplicadas com cuidado para não quebrar o site atual.
-- A estratégia "Backfill" acima garante que tudo tem um organization_id.
-- O próximo passo no código (Next.js) será filtrar by organization_id.
