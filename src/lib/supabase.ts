// src/lib/supabase.ts → VERSÃO COM LOGS PARA DEBUG (2025)
import { createBrowserClient } from '@supabase/ssr'

console.log('Supabase client inicializando...')

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
        getItem: () => {
          console.log('getItem chamado no storage (deveria retornar null)')
          return null
        },
        setItem: () => {
          console.log('setItem chamado no storage (deveria ignorar)')
        },
        removeItem: () => {
          console.log('removeItem chamado no storage (deveria ignorar)')
        },
      },
    },
    cookies: {
      get(name: string) {
        console.log(`Cookie get chamado para: ${name}`)
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        const value = match ? match[2] : null
        console.log(`Cookie ${name}:`, value ? 'encontrado' : 'não encontrado')
        return value
      },
      set(name: string, value: string) {
        console.log(`Cookie set chamado para ${name}`)
        document.cookie = `${name}=${value}; path=/; Secure; SameSite=Lax`
        console.log(`Cookie ${name} setado`)
      },
      remove(name: string) {
        console.log(`Cookie remove chamado para ${name}`)
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Lax`
        console.log(`Cookie ${name} removido`)
      },
    },
  }
)

console.log('Supabase client inicializado com sucesso')