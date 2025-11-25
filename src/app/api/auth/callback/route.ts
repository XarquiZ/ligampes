// app/api/auth/callback/route.ts - VERSÃO SIMPLIFICADA
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    console.log('[CALLBACK] Iniciando com code:', code ? 'SIM' : 'NÃO')

    if (code) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[CALLBACK] Erro no exchange:', error)
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }

      console.log('[CALLBACK] Redirecionando para /dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.error('[CALLBACK] Nenhum code fornecido')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))

  } catch (error) {
    console.error('[CALLBACK] Erro capturado:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}