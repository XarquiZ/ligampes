import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Detecta automaticamente se está em localhost
      detectSessionInUrl: true,
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
    }
  }
)