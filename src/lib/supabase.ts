import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Client para uso no cliente (React components)
export function createClient() {
  return createClientComponentClient<Database>()
}

// Client para uso no servidor (Route Handlers, Server Components)
export function createServerClient() {
  return createServerComponentClient<Database>({ cookies })
}