// app/api/auth/callback/route.ts - VERSÃO COM DEBUG COMPLETO
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('=== CALLBACK DEBUG INICIADO ===')
  console.log('[CALLBACK] URL completa:', request.url)
  console.log('[CALLBACK] Code recebido:', code ? 'SIM' : 'NÃO')
  console.log('[CALLBACK] Error recebido:', error)
  console.log('[CALLBACK] Search params:', Object.fromEntries(requestUrl.searchParams))

  if (error) {
    console.error('[CALLBACK] Erro do OAuth:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_${error}`)
  }

  if (!code) {
    console.error('[CALLBACK] Nenhum code recebido')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
  }

  try {
    const cookieStore = cookies()
    
    console.log('[CALLBACK] Criando cliente Supabase...')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`[CALLBACK] Lendo cookie ${name}:`, cookie ? 'EXISTE' : 'NÃO EXISTE')
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            console.log(`[CALLBACK] Setando cookie ${name} (${value.length} chars)`)
            cookieStore.set({ 
              name, 
              value, 
              ...options, 
              secure: true,
              sameSite: 'lax',
              path: '/',
            })
          },
          remove(name: string, options: any) {
            console.log(`[CALLBACK] Removendo cookie ${name}`)
            cookieStore.set({ 
              name, 
              value: '', 
              ...options,
              expires: new Date(0) 
            })
          },
        },
      }
    )

    console.log('[CALLBACK] Chamando exchangeCodeForSession...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[CALLBACK] Erro no exchangeCodeForSession:', exchangeError)
      console.error('[CALLBACK] Mensagem:', exchangeError.message)
      console.error('[CALLBACK] Status:', exchangeError.status)
      
      return NextResponse.redirect(`${requestUrl.origin}/login?error=exchange_failed&details=${exchangeError.message}`)
    }

    console.log('[CALLBACK] exchangeCodeForSession SUCESSO!')
    console.log('[CALLBACK] User:', data.session?.user?.email)
    console.log('[CALLBACK] Session exists:', !!data.session)
    console.log('[CALLBACK] Access token:', data.session?.access_token ? 'EXISTS' : 'MISSING')
    
    // Força uma verificação extra
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[CALLBACK] Verificação pós-exchange:')
    console.log('[CALLBACK] - Session:', session ? 'EXISTS' : 'NULL')
    console.log('[CALLBACK] - Error:', sessionError)
    console.log('[CALLBACK] - User:', session?.user?.email)

    console.log('=== CALLBACK FINALIZADO COM SUCESSO ===')
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)

  } catch (error) {
    console.error('[CALLBACK] Erro geral no callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=callback_exception`)
  }
}