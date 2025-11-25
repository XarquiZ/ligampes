// src/hooks/useAuth.ts - HOOK NOVO E ROBUSTO
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 3

    const checkAuth = async () => {
      try {
        if (!mounted) return

        console.log(`[useAuth] Verificando autenticação (tentativa ${retryCount + 1})...`)
        
        // Aguarda um pouco para cookies ficarem disponíveis
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[useAuth] Erro ao verificar sessão:', error)
          if (mounted && retryCount < maxRetries) {
            retryCount++
            setTimeout(checkAuth, 1000)
            return
          }
        }

        if (!mounted) return

        if (!session) {
          console.log('[useAuth] Nenhuma sessão encontrada')
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(checkAuth, 1000)
            return
          }
          setLoading(false)
          router.replace('/login')
          return
        }

        console.log('[useAuth] Sessão encontrada:', session.user.email)
        setUser(session.user)
        setLoading(false)

      } catch (error) {
        console.error('[useAuth] Erro geral:', error)
        if (mounted && retryCount < maxRetries) {
          retryCount++
          setTimeout(checkAuth, 1000)
          return
        }
        if (mounted) {
          setLoading(false)
          router.replace('/login')
        }
      }
    }

    checkAuth()

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event)
        
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.replace('/login')
        } else if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          setLoading(false)
        } else if (event === 'INITIAL_SESSION') {
          // Não faz nada - já estamos lidando com getSession()
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  return { user, loading }
}