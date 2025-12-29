-- Add description column if it doesn't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update MPES description as an example
UPDATE organizations
SET description = 'A maior liga de eFootball do ES.'
WHERE slug = 'mpes';
