// src/lib/supabase.ts → VERSÃO FINAL E IMBATÍVEL (2025)
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: true,
      // ESSAS 3 LINHAS SÃO OBRIGATÓRIAS COM persistSession: false
      storageKey: 'sb-ligampes-auth-token',
      storage: {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      },
    },
    cookies: {
      get(name: string) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : null
      },
      set(name: string, value: string) {
        document.cookie = `${name}=${value}; path=/; Secure; SameSite=Lax`
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Lax`
      },
    },
  }
)