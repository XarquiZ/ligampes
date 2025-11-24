// src/app/login/page.tsx
'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Se já tem sessão, redireciona para dashboard
        if (session) {
          console.log('✅ Login: Já está autenticado, redirecionando...')
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      console.error('❌ Erro no login:', error)
    } else {
      console.log('✅ Login iniciado - redirecionando...')
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-zinc-900 to-black">
        <div className="text-white text-xl">Verificando autenticação...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-zinc-900 to-black">
      <Card className="w-full max-w-md p-10 backdrop-blur-xl bg-white/10 border-white/20">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-black text-white bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            LIGA MPES
          </h1>
          <p className="text-xl text-zinc-300">
            A liga mais braba do Brasil
          </p>
          <Button 
            onClick={handleGoogleLogin}
            size="lg"
            className="w-full text-lg bg-white text-black hover:bg-white/90 font-bold"
          >
            Entrar com Google
          </Button>
        </div>
      </Card>
    </div>
  )
}