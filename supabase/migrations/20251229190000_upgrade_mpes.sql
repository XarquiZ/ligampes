-- Upgrade MPES League to PRO and ACTIVE
UPDATE public.organizations
SET 
  plan = 'pro',
  status = 'active'
WHERE slug = 'mpes';
