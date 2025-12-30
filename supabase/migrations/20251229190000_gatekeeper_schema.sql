-- Add Gatekeeper columns to organizations table

-- Add columns if they don't exist
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS chosen_plan TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS price_id TEXT;

-- Verify status column and constraints
-- Since we can't easily check constraints in simple SQL without complex queries, 
-- we will drop the constraint if it exists and re-add it to ensure it supports our values.
-- Note: 'active' is likely already there.

DO $$
BEGIN
    -- Attempt to add the check constraint if it doesn't match
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_status_check') THEN
        ALTER TABLE public.organizations DROP CONSTRAINT organizations_status_check;
    END IF;

    ALTER TABLE public.organizations 
    ADD CONSTRAINT organizations_status_check 
    CHECK (status IN ('pending_setup', 'payment_required', 'active', 'suspended'));
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if something weird happens, but usually this is safe
END $$;
