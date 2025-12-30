// app/login/page.tsx - VERSÃO COM TRATAMENTO DE ERRO
'use client'

import { supabase } from "@/lib/supabase"
import { getSiteUrl } from "@/lib/env"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      console.log('[Login] Erro detectado na URL:', errorParam)
      setError(`Erro no login: ${errorParam}`)
    }

    const checkAuth = async () => {
      try {
        console.log('[Login] Verificando autenticação...')
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('[Login] Erro ao verificar sessão:', error)
          setLoading(false)
          return
        }
        if (session) {
          console.log('[Login] Usuário já autenticado → redirecionando')
          router.replace('/dashboard')
        } else {
          console.log('[Login] Usuário não autenticado')
          setLoading(false)
        }
      } catch (error) {
        console.error('[Login] Erro geral:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, searchParams])

  const handleGoogleLogin = async () => {
    console.log('[Login] Iniciando login com Google...')
    setError(null)
    try {
      // Limpa estado anterior
      await supabase.auth.signOut()

      // Use window.location.origin to ensure we redirect back to the current domain
      const currentOrigin = window.location.origin
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${currentOrigin}/api/auth/callback`,
          // Força o Supabase a usar nossa URL como site_url
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      })

      console.log('[Login] Redirect URL configurada:', `${currentOrigin}/api/auth/callback`)

      if (error) {
        console.error('[Login] Erro no OAuth:', error)
        setError(`Erro: ${error.message}`)
      }
    } catch (error) {
      console.error('[Login] Erro geral:', error)
      setError('Erro inesperado no login')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Verificando...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative">
      <Link
        href="/"
        className="absolute top-6 left-6 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors backdrop-blur-sm"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </Link>
      <Card className="w-full max-w-md p-10 border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            LIGA MPES
          </h1>
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
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