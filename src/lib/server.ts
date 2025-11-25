import { createClient } from '@supabase/supabase-js'

export function createServerClientInstance() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Não persiste a sessão no servidor
        autoRefreshToken: false,
      },
    }
  )
}