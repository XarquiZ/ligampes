import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: true, // ← MUDE PARA TRUE
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce' // ← RECOMENDADO para Next.js
  }
})