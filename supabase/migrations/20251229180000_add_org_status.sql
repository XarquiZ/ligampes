-- Add status and requested_domain columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_setup' CHECK (status IN ('pending_setup', 'active', 'suspended')),
ADD COLUMN IF NOT EXISTS requested_domain TEXT;

-- Update existing organizations to active (legacy support)
UPDATE public.organizations 
SET status = 'active' 
WHERE status IS NULL;
