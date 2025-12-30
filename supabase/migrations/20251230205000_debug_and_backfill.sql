-- 1. INSPECT: Check what is in profiles and organization_members
-- Replace 'YOUR_ORG_ID' with the actual UUID if running manually, or just run to see all.
SELECT id, email, full_name, organization_id FROM public.profiles;

SELECT * FROM public.organization_members;

-- 2. FIX (Backfill): Insert missing memberships for existing profiles
-- This ensures that every user in 'profiles' is also in 'organization_members' for that org
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
    p.organization_id, 
    p.id, 
    COALESCE(p.role, 'member')
FROM public.profiles p
WHERE p.organization_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 
    FROM public.organization_members om 
    WHERE om.organization_id = p.organization_id 
    AND om.user_id = p.id
);

-- 3. VERIFY: Check again after fix
SELECT 
    p.email, 
    p.organization_id, 
    CASE WHEN om.id IS NOT NULL THEN 'LINKED' ELSE 'MISSING' END as membership_status
FROM public.profiles p
LEFT JOIN public.organization_members om 
    ON p.organization_id = om.organization_id 
    AND p.id = om.user_id;
