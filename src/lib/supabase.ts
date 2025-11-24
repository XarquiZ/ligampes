import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    // ⬇️ DESABILITA verificação de tempo que causa o erro
    detectSessionInUrl: false,
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'implicit' // ← Use implicit flow para simplificar
  }
})