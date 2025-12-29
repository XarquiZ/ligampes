-- 1. Ensure columns exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;

-- 2. Update MPES Organization Branding
UPDATE organizations
SET 
  logo_url = '/logos/favicon.ico',
  theme_config = '{
    "primaryColor": "#22c55e", 
    "secondaryColor": "#0f172a"
  }'::jsonb
WHERE slug = 'mpes';
