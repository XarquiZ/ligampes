-- Backfill organization_id for market_listings based on the team's organization
UPDATE market_listings
SET organization_id = teams.organization_id
FROM teams
WHERE market_listings.team_id = teams.id
AND market_listings.organization_id IS NULL;
