import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

// Client para uso no cliente (React components)
export function createClient() {
  return createClientComponentClient<Database>()
}