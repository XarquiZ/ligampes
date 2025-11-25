// src/lib/supabase.ts → VERSÃO QUE FUNCIONA EM GUIA ANÔNIMA + SEMPRE PEDE LOGIN NOVO
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,     // não guarda no localStorage
      autoRefreshToken: false,   // não renova token automaticamente
      detectSessionInUrl: true,  // essencial pro OAuth do Google funcionar
      flowType: 'pkce',
    },
    // Cookie de sessão (some ao fechar o navegador)
    cookies: {
      get(name: string) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : null
      },
      set(name: string, value: string) {
        document.cookie = `${name}=${value}; path=/; Secure; SameSite=Lax`
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
      },
    },
  }
)