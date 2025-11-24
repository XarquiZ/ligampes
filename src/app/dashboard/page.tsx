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
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }
    check()
  }, [router])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // CORRETO: tem que ser /api/auth/callback
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white text-xl">
        Verificando autenticação...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Card className="w-full max-w-md p-10">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-black text-white">LIGA MPES</h1>

          <Button
            onClick={handleGoogleLogin}
            size="lg"
            className="w-full text-lg font-bold"
          >
            Entrar com Google
          </Button>
        </div>
      </Card>
    </div>
  )
}