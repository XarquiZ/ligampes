// src/hooks/useAuth.ts - VERSÃO DEFINITIVA
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

    const checkAuth = async (retryCount = 0) => {
      try {
        if (!mounted) return

        console.log(`[useAuth] Verificando autenticação (tentativa ${retryCount + 1})...`)
        
        // Aguarda mais tempo nas tentativas seguintes
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[useAuth] Erro ao verificar sessão:', error)
          throw error
        }

        if (!mounted) return

        console.log('[useAuth] Resultado da sessão:', { 
          hasSession: !!session, 
          user: session?.user?.email 
        })

        if (!session) {
          // Tenta novamente se for uma das primeiras tentativas
          if (retryCount < 2) {
            console.log(`[useAuth] Tentando novamente em ${retryCount + 1} segundos...`)
            setTimeout(() => checkAuth(retryCount + 1), 1000 * (retryCount + 1))
            return
          }
          
          console.log('[useAuth] Nenhuma sessão encontrada após tentativas → redirecionando')
          router.replace('/login')
          return
        }

        console.log('[useAuth] Sessão encontrada!', session.user.email)
        setUser(session.user)
        setLoading(false)

      } catch (error) {
        console.error('[useAuth] Erro geral:', error)
        if (mounted && retryCount < 2) {
          setTimeout(() => checkAuth(retryCount + 1), 1000 * (retryCount + 1))
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
          console.log('[useAuth] Login detectado via onAuthStateChange')
          setUser(session.user)
          setLoading(false)
        } else if (event === 'INITIAL_SESSION') {
          console.log('[useAuth] Sessão inicial recebida')
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