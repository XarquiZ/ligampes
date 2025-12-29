-- Enable RLS on the table (just in case)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts or stale definitions
DROP POLICY IF EXISTS "Public Organizations Access" ON organizations;
DROP POLICY IF EXISTS "Enable read access for all users" ON organizations;

-- Create a clear, permissive policy for reading organization details
CREATE POLICY "Public Organizations Access"
ON organizations
FOR SELECT
TO public
USING (true);

-- Ensure anon role has usage on the schema (standard setup, but good to verify)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE organizations TO anon;
