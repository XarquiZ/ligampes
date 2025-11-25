import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

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
      const supabase = await createClient()
      
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

  return NextResponse.redirect(`${requestUrl.origin}/login`)
}