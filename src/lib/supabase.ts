// src/lib/supabase.ts - VERSÃO CORRIGIDA
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true, // 🔥 Mude para true
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        // Mantenha a implementação customizada se necessário
        async getItem(key: string) {
          if (typeof window === 'undefined') return null
          // Tenta localStorage primeiro, depois cookies como fallback
          try {
            return localStorage.getItem(key)
          } catch {
            const cookies = document.cookie
              .split(';')
              .map(c => c.trim())
              .filter(c => c.startsWith(key + '=') || c.startsWith(key + '.'))
              .sort((a, b) => {
                const aNum = parseInt(a.match(/\.(\d+)/)?.[1] || '0')
                const bNum = parseInt(b.match(/\.(\d+)/)?.[1] || '0')
                return aNum - bNum
              })
              .map(c => c.split('=').slice(1).join('='))
              .join('')
            return cookies || null
          }
        },
        async setItem(key: string, value: string) {
          if (typeof window === 'undefined') return
          try {
            localStorage.setItem(key, value)
          } catch {
            document.cookie = `${key}=${value}; path=/; Secure; SameSite=Lax`
          }
        },
        async removeItem(key: string) {
          if (typeof window === 'undefined') return
          try {
            localStorage.removeItem(key)
          } catch {
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          }
        },
      },
    },
  }
)