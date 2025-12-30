import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const nextParam = requestUrl.searchParams.get('next')

  // Determine the correct origin (handling proxies/vercel dev)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  // Smart Redirect Logic
  let next = nextParam ?? '/dashboard'

  console.log('[Callback] Debug - Host:', host)

  // Se estiver rodando localmente (localhost ou 127.0.0.1)
  if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
    // Verifica se é subdomínio (ex: mpes.localhost)
    // Se dividir por ponto der mais que 1 parte (e a primeira parte não for localhost/127), é subdomínio?
    // Ex: localhost:3000 -> ['localhost:3000'] (1 parte)
    // Ex: mpes.localhost:3000 -> ['mpes', 'localhost:3000'] (2 partes)

    // Verifica se é um subdomínio (ex: mpes.localhost)
    // Regex busca: "qualquer coisa exceto ponto" + ".localhost" no início
    const isSubdomain = host.match(/^[^.]+\.localhost/)

    if (!isSubdomain) {
      console.log('[Callback] Debug - Localhost Raiz detectado -> /acompanhar')
      next = '/acompanhar'
    } else {
      console.log('[Callback] Debug - Subdomínio Localhost detectado -> /dashboard')
    }
  }

  console.log('[Callback] Code:', code)
  console.log('[Callback] Error:', error)
  console.log('[Callback] Detected Origin:', origin)
  console.log('[Callback] Next Redirect:', next)

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

      // Verificar Cookie de Redirecionamento (Prioridade sobre Smart Logic)
      const cookieStore = await cookies()
      const cookieRedirect = cookieStore.get('auth_redirect')

      if (cookieRedirect?.value) {
        console.log('[Callback] Override por Cookie detectado:', cookieRedirect.value)
        next = cookieRedirect.value
      }

      const response = NextResponse.redirect(`${origin}${next}`)

      // Limpar o cookie após usar
      if (cookieRedirect) {
        response.cookies.delete('auth_redirect')
      }

      return response

    } catch (error) {
      console.error('[Callback] Erro inesperado:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}