// src/lib/supabase.ts → VERSÃO "SEMPRE PEDE LOGIN NOVO" (2025)
import { createBrowserClient } from '@supabase/ssr'

// Client do navegador — NUNCA guarda sessão
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,     // NÃO guarda login no localStorage
      autoRefreshToken: false,   // NÃO renova token automaticamente
      detectSessionInUrl: true,  // continua funcionando com OAuth (Google)
      flowType: 'pkce'           // mantém segurança máxima
    },
    cookies: {
      // Garante que o cookie da sessão também não persista
      get(name: string) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : null
      },
      set(name: string, value: string, options: any) {
        // Define cookie como "session" (some ao fechar o navegador)
        document.cookie = `${name}=${value}; path=/; SameSite=Lax; Secure`
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
      }
    }
  }
)

// (Opcional) Client para server components / middleware — também sem persistência
export const createServerSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}