// src/app/login/page.tsx ← VERSÃO OFICIAL SUPABASE 2025
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const supabase = createClientComponentClient()

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-zinc-900 to-black">
      <Card className="w-full max-w-md p-10 backdrop-blur-xl bg-white/10 border-white/20">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-black text-white bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Campeonato dos Crias 2025
          </h1>
          <p className="text-xl text-zinc-300">
            A liga mais braba do Brasil
          </p>
          <Button 
  onClick={() => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        prompt: 'select_account'   // ← ESSA LINHA FORÇA A ESCOLHA DE CONTA
      }
    }
  })}
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