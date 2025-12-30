-- Add owner_email column to organizations table
ALTER TABLE organizations
ADD COLUMN owner_email TEXT;

-- Optional: Update existing rows with a placeholder or try to backfill if possible via DO block (too complex for now, we leave null)
-- New rows will have it.
