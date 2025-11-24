'use client'

import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect } from 'react'

export default function LoginPage() {
  const supabase = createClient()

  useEffect(() => {
    console.log('🔐 Login Page Mounted')
    console.log('Window location:', window.location.origin)
    console.log('Redirect URL will be:', `${window.location.origin}/dashboard`)
  }, [])

  const handleGoogleLogin = async () => {
  console.log('🔄 Starting Google OAuth...')
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`, // ← MUDEI AQUI
    },
  })
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      console.log('📤 OAuth Response:')
      console.log('Data:', data)
      console.log('Error:', error)

      if (error) {
        console.error('❌ OAuth Error:', error.message)
        console.error('Error details:', error)
      } else if (data?.url) {
        console.log('✅ OAuth URL generated:', data.url)
      } else {
        console.log('⚠️ No URL returned from OAuth')
      }
    } catch (catchError) {
      console.error('💥 Unexpected error in OAuth:', catchError)
    }
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