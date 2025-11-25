// src/lib/supabase.ts → VERSÃO QUE FUNCIONA COM COOKIES GRANDES (2025)
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
      storage: {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      },
    },
    cookies: {
      // ESSA É A LINHA QUE RESOLVE TUDO
      getAll(name: string) {
        const cookies = document.cookie
          .split(';')
          .map(c => c.trim())
          .filter(c => c.startsWith(name) || c.startsWith(`${name}.`))
          .map(c => c.split('=')[1])
          .join('')
        return cookies || null
      },
      get(name: string) {
        // Primeiro tenta pegar direto
        const direct = document.cookie
          .split(';')
          .find(c => c.trim().startsWith(`${name}=`))
          ?.split('=')[1]

        if (direct) return direct

        // Se não achou, tenta juntar os pedaços (.0, .1, etc)
        return this.getAll(name)
      },
      set(name: string, value: string) {
        document.cookie = `${name}=${value}; path=/; Secure; SameSite=Lax`
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Lax`
        // Remove também os pedaços
        for (let i = 0; i < 10; i++) {
          document.cookie = `${name}.${i}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Lax`
        }
      },
    },
  }
)