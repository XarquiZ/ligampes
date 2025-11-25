// app/api/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    console.log('🔐 [AUTH CALLBACK] Code:', code ? '✅ Recebido' : '❌ Não recebido')

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Cria o cliente diretamente aqui
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ Erro no exchange:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    console.log('✅ Login realizado para:', data.session?.user?.email)
    return NextResponse.redirect(new URL('/dashboard', request.url))

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
    return NextResponse.redirect(new URL('/login?error=unexpected_error', request.url))
  }
}