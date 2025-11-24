import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createClientComponentClient<Database>> | undefined

export function createClient() {
  if (typeof window === 'undefined') {
    // No servidor, sempre cria novo cliente
    return createClientComponentClient<Database>()
  }

  if (!client) {
    // No cliente, cria apenas uma vez
    client = createClientComponentClient<Database>()
  }

  return client
}