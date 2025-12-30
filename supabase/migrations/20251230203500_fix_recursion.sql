-- Fix Infinite Recursion by using a Security Definer function

-- 1. Create helper function to get user's organizations (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS TABLE (organization_id UUID) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_my_org_ids TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org_ids TO anon;


-- 3. Update Organization Members Policy
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view organization members of their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "View members of own orgs" ON public.organization_members;

CREATE POLICY "Users can view members of their orgs"
ON public.organization_members FOR SELECT
USING (
    -- User can see rows where organization_id matches one of their organizations
    organization_id IN ( SELECT organization_id FROM public.get_my_org_ids() )
);


-- 4. Update Profiles Policy (Use function for efficiency and safety)
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id 
    OR
    organization_id IN ( SELECT organization_id FROM public.get_my_org_ids() )
);

-- 5. Update Announcements Policy (Use function)
DROP POLICY IF EXISTS "Announcements viewable by org members" ON public.announcements;

CREATE POLICY "Announcements viewable by org members"
ON public.announcements FOR SELECT
USING (
    organization_id IN ( SELECT organization_id FROM public.get_my_org_ids() )
);
