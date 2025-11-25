// src/lib/supabase.ts → VERSÃO FINAL — NUNCA MAIS LOGIN AUTOMÁTICO (2025)
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
      // FORÇA O SUPABASE A NUNCA USAR LOCALSTORAGE
      storage: {
        async getItem() { return null },
        async setItem() { },
        async removeItem() { },
      },
    },
    cookies: {
      // Junta cookies quebrados (.0, .1, etc)
      get(name: string) {
        const cookies = document.cookie
          .split(';')
          .map(c => c.trim())
          .filter(c => c.startsWith(name + '=') || c.startsWith(name + '.'))
          .sort((a, b) => {
            const aNum = parseInt(a.match(/\.(\d+)/)?.[1] || '0')
            const bNum = parseInt(b.match(/\.(\d+)/)?.[1] || '0')
            return aNum - bNum
          })
          .map(c => c.split('=').slice(1).join('='))
          .join('')

        return cookies || null
      },
      set(name: string, value: string) {
        document.cookie = `${name}=${value}; path=/; Secure; SameSite=Lax`
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`
        // Remove todos os pedaços possíveis
        for (let i = 0; i < 20; i++) {
          document.cookie = `${name}.${i}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`
        }
      },
    },
  }
)