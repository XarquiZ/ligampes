-- ============================================================================
-- SCHEMA COMPLETO - LIGA MPES
-- ============================================================================

-- Criar tabela de profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  coach_name TEXT,
  role TEXT DEFAULT 'coach' CHECK (role IN ('admin', 'coach')),
  team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coach_name TEXT,
  logo_url TEXT,
  balance NUMERIC DEFAULT 100000000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de players
CREATE TABLE IF NOT EXISTS public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  alternative_positions TEXT[],
  real_club TEXT,
  club TEXT,
  nationality TEXT,
  age INTEGER,
  preferred_foot TEXT,
  playstyle TEXT,
  photo_url TEXT,
  value NUMERIC,
  base_price NUMERIC,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  
  -- Estatísticas gerais
  overall INTEGER,
  total_matches INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  total_yellow_cards INTEGER DEFAULT 0,
  total_red_cards INTEGER DEFAULT 0,
  average_rating NUMERIC,
  
  -- Atributos técnicos
  ball_control INTEGER,
  dribbling INTEGER,
  tight_possession INTEGER,
  low_pass INTEGER,
  lofted_pass INTEGER,
  finishing INTEGER,
  heading INTEGER,
  place_kicking INTEGER,
  curl INTEGER,
  
  -- Atributos físicos
  speed INTEGER,
  acceleration INTEGER,
  kicking_power INTEGER,
  jump INTEGER,
  physical_contact INTEGER,
  balance INTEGER,
  stamina INTEGER,
  
  -- Atributos defensivos
  defensive_awareness INTEGER,
  ball_winning INTEGER,
  aggression INTEGER,
  
  -- Atributos de goleiro
  gk_awareness INTEGER,
  gk_catching INTEGER,
  gk_clearing INTEGER,
  gk_reflexes INTEGER,
  gk_reach INTEGER,
  
  -- Atributos especiais
  form INTEGER,
  injury_resistance INTEGER,
  weak_foot_usage INTEGER,
  weak_foot_accuracy INTEGER,
  offensive_talent INTEGER,
  inspiring_ball_carry INTEGER,
  inspiring_low_pass INTEGER,
  inspiring_lofted_pass INTEGER,
  skills TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de matches
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  home_score INTEGER,
  away_score INTEGER,
  match_date DATE,
  status VARCHAR(20) DEFAULT 'scheduled',
  round VARCHAR(50),
  competition VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de player_match_stats
CREATE TABLE IF NOT EXISTS public.player_match_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de auctions
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  start_price NUMERIC NOT NULL,
  current_bid NUMERIC NOT NULL,
  current_bidder UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de bids
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de player_transfers
CREATE TABLE IF NOT EXISTS public.player_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  from_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL NOT NULL,
  to_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL NOT NULL,
  value NUMERIC NOT NULL,
  transfer_type TEXT DEFAULT 'sale' CHECK (transfer_type IN ('sale', 'exchange')),
  is_exchange BOOLEAN DEFAULT false,
  exchange_value NUMERIC,
  exchange_players UUID[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by_seller BOOLEAN DEFAULT false,
  approved_by_buyer BOOLEAN DEFAULT false,
  approved_by_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de balance_transactions
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  transfer_type TEXT,
  player_name TEXT,
  related_team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de team_transactions (legado/backup)
CREATE TABLE IF NOT EXISTS public.team_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  player_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- FOREIGN KEYS ADICIONAIS
-- ============================================================================

-- Adicionar FK de profiles para teams (se não existir)
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_team 
  FOREIGN KEY (team_id) 
  REFERENCES public.teams(id) 
  ON DELETE SET NULL;

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON public.matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON public.player_match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON public.player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON public.bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_transfers_teams ON public.player_transfers(from_team_id, to_team_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES
-- ============================================================================

-- Profiles: usuários veem seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Teams: todos podem ver todos os times
CREATE POLICY "Todos podem ver todos os times"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar seu próprio time"
  ON public.teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Donos podem atualizar seu próprio time"
  ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.team_id = teams.id
    )
  );

-- Players: todos podem ver
CREATE POLICY "Todos podem ver jogadores"
  ON public.players FOR SELECT
  USING (true);

-- Matches: todos podem ver
CREATE POLICY "Todos podem ver partidas"
  ON public.matches FOR SELECT
  USING (true);

-- Player Match Stats: todos podem ver
CREATE POLICY "Todos podem ver estatísticas"
  ON public.player_match_stats FOR SELECT
  USING (true);

-- Auctions: todos podem ver leilões ativos
CREATE POLICY "Todos podem ver leilões"
  ON public.auctions FOR SELECT
  USING (true);

-- Bids: todos podem ver lances
CREATE POLICY "Todos podem ver lances"
  ON public.bids FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem fazer lances"
  ON public.bids FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.team_id = bids.team_id
    )
  );

-- Player Transfers: todos podem ver
CREATE POLICY "Todos podem ver transferências"
  ON public.player_transfers FOR SELECT
  USING (true);

-- Balance Transactions: usuários veem transações do próprio time
CREATE POLICY "Usuários veem transações do próprio time"
  ON public.balance_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.team_id = balance_transactions.team_id
    )
  );

-- Team Transactions: usuários veem transações do próprio time
CREATE POLICY "Usuários veem transações do próprio time"
  ON public.team_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.team_id = team_transactions.team_id
    )
  );

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.player_match_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

