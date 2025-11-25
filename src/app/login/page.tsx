// app/login/page.tsx - VERSÃO FINAL (já corrigida)
'use client'

import { supabase } from "@/lib/supabase"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[Login] Verificando autenticação...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[Login] Erro ao verificar sessão:', error)
          setLoading(false)
          return
        }

        if (session) {
          console.log('[Login] Usuário já autenticado → redirecionando para dashboard')
          router.replace('/dashboard')
        } else {
          console.log('[Login] Usuário não autenticado → mostrando tela de login')
          setLoading(false)
        }
      } catch (error) {
        console.error('[Login] Erro geral:', error)
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Login] Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[Login] Login detectado → redirecionando para dashboard')
          router.replace('/dashboard')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleGoogleLogin = async () => {
    console.log('[Login] Iniciando login com Google...')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      })

      if (error) {
        console.error('[Login] Erro no login com Google:', error)
      } else {
        console.log('[Login] Redirecionamento OAuth iniciado')
      }
    } catch (error) {
      console.error('[Login] Erro geral no login:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Verificando autenticação...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Card className="w-full max-w-md p-10 border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            LIGA MPES
          </h1>
          <p className="text-zinc-400 text-lg">
            Faça login para gerenciar seu time
          </p>
          <Button 
            onClick={handleGoogleLogin} 
            size="lg" 
            className="w-full text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Entrar com Google
          </Button>
        </div>
      </Card>
    </div>
  )
}