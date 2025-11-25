// src/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function useAuth(requireAuth = true) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[useAuth] Verificando autenticação...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[useAuth] Erro na sessão:', error)
          if (requireAuth) router.replace('/login')
          return
        }

        console.log('[useAuth] Sessão encontrada:', !!session)
        
        if (!session && requireAuth) {
          console.log('[useAuth] Sem sessão → redirecionando para login')
          router.replace('/login')
          return
        }

        setUser(session?.user || null)
        setLoading(false)
      } catch (error) {
        console.error('[useAuth] Erro geral:', error)
        if (requireAuth) router.replace('/login')
      }
    }

    checkAuth()

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.replace('/login')
        } else if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, requireAuth])

  return { user, loading }
}