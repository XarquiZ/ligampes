// src/lib/supabase.ts - VERSÃO FINAL FUNCIONAL
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        // Implementação simplificada que FUNCIONA
        getItem: (key: string): string | null => {
          if (typeof window === 'undefined') return null
          
          // Tenta ler do localStorage primeiro
          try {
            const item = localStorage.getItem(key)
            if (item) return item
          } catch (e) {
            console.log('[Supabase] localStorage não disponível')
          }
          
          // Fallback para cookies
          const cookies = document.cookie.split(';')
          for (const cookie of cookies) {
            const [cookieKey, ...cookieValue] = cookie.trim().split('=')
            if (cookieKey === key) {
              return decodeURIComponent(cookieValue.join('='))
            }
          }
          return null
        },
        setItem: (key: string, value: string): void => {
          if (typeof window === 'undefined') return
          
          // Salva em localStorage
          try {
            localStorage.setItem(key, value)
          } catch (e) {
            console.log('[Supabase] localStorage não disponível, usando cookies')
          }
          
          // E também em cookies como backup
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax; Secure`
        },
        removeItem: (key: string): void => {
          if (typeof window === 'undefined') return
          
          // Remove de localStorage
          try {
            localStorage.removeItem(key)
          } catch (e) {}
          
          // Remove dos cookies
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    },
  }
)