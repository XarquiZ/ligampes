import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

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
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError) {
        console.error('[Callback] Erro ao trocar código por sessão:', authError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }

      // Definir manualmente o cookie de session como HttpOnly para o domínio base
      const session = data?.session;
      if (session?.access_token) {
        const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".supabase.co")[0]?.split('//')[1]}-auth-token`;
        const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        response.cookies.set(
          cookieName,
          session.access_token,
          {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'lax',
            maxAge: session.expires_in || 60 * 60 * 8, // fallback 8h
          }
        )
        console.log('[Callback] Cookie de sessão setado manualmente:', cookieName)
        return response
      }

      console.log('[Callback] Autenticação bem-sucedida (mas sem sessao retornada)')
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)

    } catch (error) {
      console.error('[Callback] Erro inesperado:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`)
}