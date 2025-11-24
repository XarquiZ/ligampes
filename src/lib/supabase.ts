import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export function createClient() {
  console.log('🔄 Creating Supabase client...')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing')
  console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing')
  
  const client = createClientComponentClient<Database>()
  console.log('✅ Supabase client created successfully')
  return client
}