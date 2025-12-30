-- Migration to enable Multi-tenant Profiles

-- 1. Add organization_id column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. Drop existing Primary Key (usually just 'id')
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- 3. Create new Composite Primary Key
-- This allows the same User ID to have multiple rows (one per organization)
ALTER TABLE public.profiles ADD PRIMARY KEY (id, organization_id);

-- 4. Update Policies (RLS)
-- Users can see their own profile in the context of the organization
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. Fix Dashboard Stats Logic ensuring isolation
-- (This part is handled in the Code, but we ensure index exists)
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
