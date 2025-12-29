-- Updating MPES Organization Branding
-- Replace 'mpes' with the exact slug if different
UPDATE organizations
SET 
  logo_url = '/logos/mpes-logo.png',  -- Image path in public folder
  theme_config = '{
    "primaryColor": "#22c55e", 
    "secondaryColor": "#0f172a"
  }'::jsonb
WHERE slug = 'mpes';
