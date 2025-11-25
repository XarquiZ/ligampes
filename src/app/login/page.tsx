'use client'

import { supabase } from "@/lib/supabase"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // COM persistSession: false → SEMPRE use getUser(), NUNCA getSession()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard')
      }
    })
  }, [router])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
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