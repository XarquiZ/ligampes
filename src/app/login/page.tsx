// app/login/page.tsx → VERSÃO COM LOGS PARA DEBUG
'use client'

import { supabase } from "@/lib/supabase"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

console.log('LoginPage renderizando...')

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    console.log('useEffect do login rodando...')
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      console.log('getUser no login:', { user: user ? user.email : 'null', error: error?.message })
      if (user) {
        console.log('Usuário encontrado no login → redirecionando pro dashboard')
        router.replace('/dashboard')
      } else {
        console.log('Sem usuário no login → continua na tela')
      }
    }).catch(err => {
      console.error('Erro no getUser do login:', err)
    })
  }, [router])

  const handleGoogleLogin = async () => {
    console.log('Botão Google clicado')
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      console.log('signInWithOAuth chamado com sucesso')
    } catch (error) {
      console.error('Erro no signInWithOAuth:', error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Card className="w-full max-w-md p-10">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-black text-white">LIGA MPES</h1>
          <Button onClick={handleGoogleLogin} size="lg" className="w-full text-lg font-bold">
            Entrar com Google
          </Button>
        </div>
      </Card>
    </div>
  )
}