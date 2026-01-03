-- Remove game_type from organizations settings
UPDATE organizations
SET settings = settings - 'game_type'
WHERE settings ? 'game_type';
