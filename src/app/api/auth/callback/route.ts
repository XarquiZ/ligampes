// app/api/auth/callback/route.ts - VERSÃO QUE FUNCIONA
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    console.log('[AUTH] Callback iniciado, code:', code ? 'recebido' : 'não recebido')

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Use createClient direto para evitar problemas com cookies no server
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AUTH] Erro no exchange:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    console.log('[AUTH] Login realizado com sucesso para:', data.session?.user?.email)
    
    // Redireciona para dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    
    return response

  } catch (error) {
    console.error('[AUTH] Erro geral:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}