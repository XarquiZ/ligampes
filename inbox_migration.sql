-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('announcement', 'poll')),
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'division', 'team')),
    target_value TEXT, -- 'A', 'B' or team_id
    priority BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create announcement_interactions table (reads and votes)
CREATE TABLE IF NOT EXISTS public.announcement_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    poll_option_id UUID REFERENCES public.poll_options(id), -- Null if just read, set if voted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, announcement_id)
);

-- Add simple RLS policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_interactions ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone (filtering done in query)
CREATE POLICY "Announcements viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Poll options viewable by everyone" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Interactions viewable by owner" ON public.announcement_interactions FOR SELECT USING (auth.uid() = user_id);

-- Allow insert/update for admins only (checking profiles role)
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage poll options" ON public.poll_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can insert their own interactions
CREATE POLICY "Users can insert interactions" ON public.announcement_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Update if needed (e.g. changing vote? usually not allowed but maybe)
