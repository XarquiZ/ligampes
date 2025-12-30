-- Allow users to view profiles that belong to the same organization they are a member of
-- and ensure they can view their own profile.

-- 1. Drop existing policy if potential conflict (or we can use CREATE OR REPLACE logic if strictly Postgres functions, but for Policies we often Drop first)
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles; -- Legacy policy cleanup if exists

-- 2. Create comprehensive Select Policy
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
USING (
    -- User can see their own profile
    auth.uid() = id 
    OR
    -- User can see profiles in organizations they belong to
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- 3. Ensure organization_members is readable so the subquery works
-- (Usually handled by another policy, but good to ensure)
CREATE POLICY "Users can view organization members of their orgs"
ON public.organization_members FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members as om
        WHERE om.user_id = auth.uid()
    )
);

-- Force RLS on profiles just in case
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
