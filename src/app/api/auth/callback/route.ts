import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  // Determine the correct origin (handling proxies/vercel dev)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  console.log('[Callback] Code:', code)
  console.log('[Callback] Error:', error)
  console.log('[Callback] Detected Origin:', origin)

  if (error) {
    console.error('[Callback] Erro do OAuth:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError) {
        console.error('[Callback] Erro ao trocar código por sessão:', authError)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      console.log('[Callback] Autenticação bem-sucedida')
      return NextResponse.redirect(`${origin}/dashboard`)

    } catch (error) {
      console.error('[Callback] Erro inesperado:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}