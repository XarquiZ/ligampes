-- Trigger to automatically add user to organization_members when they join/create a profile for an org
-- This ensures consistency and bypasses client-side RLS issues for the second insert.

CREATE OR REPLACE FUNCTION public.handle_new_profile_membership()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- If the profile has an organization_id, add them to organization_members
    IF NEW.organization_id IS NOT NULL THEN
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (
            NEW.organization_id, 
            NEW.id, 
            COALESCE(NEW.role, 'member') -- Use profile role if matches (admin/member), or default to member
        )
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

-- Create the Trigger
DROP TRIGGER IF EXISTS on_profile_created_add_membership ON public.profiles;

CREATE TRIGGER on_profile_created_add_membership
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_profile_membership();

-- Also ensure RLS allows users to View their own membership (covered by previous fix, but double checking)
-- (The previous get_my_org_ids relies on the table, so the table itself needs read access for the function to work? 
-- No, Security Definer allows the function to read even if User can't. 
-- But User needs to select from the function.)

-- Ensure the user can INSERT into profiles in the first place (already covered by 20251230205500_fix_inbox_and_profiles.sql)
