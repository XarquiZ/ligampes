-- Add indices to improve performance for multi-tenant queries
-- We strictly filter by organization_id in almost every query now.

-- Players
CREATE INDEX IF NOT EXISTS idx_players_organization_id ON public.players(organization_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON public.teams(organization_id);

-- Profiles (Composite PK exists, but specific index on organization_id helps if queried independently)
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
-- (profiles.id is already indexed via PK/Unique)

-- Matches
CREATE INDEX IF NOT EXISTS idx_matches_organization_id ON public.matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON public.matches(away_team_id);

-- Market Listings (if exists)
CREATE INDEX IF NOT EXISTS idx_market_listings_organization_id ON public.market_listings(organization_id);

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_organization_id ON public.announcements(organization_id);

-- Organization Members
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON public.organization_members(user_id, organization_id);

-- Player Transfers
CREATE INDEX IF NOT EXISTS idx_player_transfers_organization_id ON public.player_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_player_transfers_from_team ON public.player_transfers(from_team_id);
CREATE INDEX IF NOT EXISTS idx_player_transfers_to_team ON public.player_transfers(to_team_id);
-- Composite index for filtering and sorting transfers
CREATE INDEX IF NOT EXISTS idx_player_transfers_org_date ON public.player_transfers(organization_id, created_at DESC);

-- Market Listings (Optimized composite indices)
-- Helps filtering by organization + active status + sorting
CREATE INDEX IF NOT EXISTS idx_market_listings_org_active_created ON public.market_listings(organization_id, is_active, created_at DESC);
-- Helps fetching "My Players" in market (team_id + active)
CREATE INDEX IF NOT EXISTS idx_market_listings_team_active_created ON public.market_listings(team_id, is_active, created_at DESC);

-- Players (Sorting by overall within a team)
CREATE INDEX IF NOT EXISTS idx_players_team_overall ON public.players(team_id, overall DESC);
