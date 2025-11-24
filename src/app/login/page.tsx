'use client'

import { supabase } from "@/lib/supabase"  // ← esse é o bom!
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else setLoading(false)
    })
  }, [router])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`, // CORRIGIDO!
      },
    })
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-xl">Verificando...</div>

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