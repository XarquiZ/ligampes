-- 1. Add the column if it doesn't exist
ALTER TABLE market_listings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2. Backfill organization_id for market_listings based on the team's organization
UPDATE market_listings
SET organization_id = teams.organization_id
FROM teams
WHERE market_listings.team_id = teams.id
AND market_listings.organization_id IS NULL;

-- 3. Optional: Add an index for performance
CREATE INDEX IF NOT EXISTS idx_market_listings_org ON market_listings(organization_id);
