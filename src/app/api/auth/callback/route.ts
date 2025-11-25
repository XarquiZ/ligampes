// app/api/auth/callback/route.ts - ADICIONE ESTES LOGS
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('[CALLBACK] Iniciando callback OAuth...')
  console.log('[CALLBACK] Code recebido:', !!code)

  if (code) {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            console.log(`[CALLBACK] Setando cookie: ${name}`)
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            console.log(`[CALLBACK] Removendo cookie: ${name}`)
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    try {
      console.log('[CALLBACK] Tentando trocar code por sessão...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[CALLBACK] Erro no exchangeCodeForSession:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback`)
      }

      console.log('[CALLBACK] Sessão criada com sucesso!')
      console.log('[CALLBACK] User:', data.session?.user?.email)
      
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('[CALLBACK] Erro geral:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }
  }

  console.error('[CALLBACK] Nenhum code recebido')
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
}