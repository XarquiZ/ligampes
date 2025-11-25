// src/lib/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set: (key, value, options) => {
          try {
            cookieStore.set({ name: key, value, ...options })
          } catch (error) {
            // Em contextos read-only (middleware), set pode falhar
          }
        },
        remove: (key, options) => {
          try {
            cookieStore.set({ name: key, value: '', ...options })
          } catch (error) {
            // Em contextos read-only (middleware), remove pode falhar
          }
        },
      }
    }
  )
}