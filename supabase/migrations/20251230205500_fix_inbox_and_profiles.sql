-- 1. Update Announcements Schema for Multi-tenancy
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update RLS for Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Announcements viewable by org members" ON public.announcements;

CREATE POLICY "Announcements viewable by org members"
ON public.announcements FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- (Optional) If we want global announcements (null organization_id), we can add OR organization_id IS NULL

-- 2. Fix Profiles Insert Policy
-- Ensure users can insert their own profile with an organization_id
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (
    auth.uid() = id
    -- Optionally check if they are effectively joining an org, but for now just allow ID match
);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );
