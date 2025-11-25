import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('[Callback] Code:', code)
  console.log('[Callback] Error:', error)

  if (error) {
    console.error('[Callback] Erro do OAuth:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
  }

  if (code) {
    try {
      const cookieStore = cookies()

      // ... após const cookieStore = cookies()
console.log('[Callback] Cookies recebidos:', JSON.stringify([...cookieStore]));
      const supabase = createRouteHandlerClient({ 
        cookies: () => cookieStore 
      })
      
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) {
        console.error('[Callback] Erro ao trocar código por sessão:', authError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }

      console.log('[Callback] Autenticação bem-sucedida')
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      
    } catch (error) {
      console.error('[Callback] Erro inesperado:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }
  }

  // Se não há código nem erro específico, redireciona para login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}