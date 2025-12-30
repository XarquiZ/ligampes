import { createBrowserClient } from '@supabase/ssr'

export const supabasePlatform = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            detectSessionInUrl: true,
            flowType: 'pkce',
            autoRefreshToken: true,
            persistSession: true,
            storageKey: 'sb-platform-auth', // Custom cookie name for Platform
        },
    }
)
