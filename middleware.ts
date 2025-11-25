// middleware.ts - VERSÃO CORRIGIDA
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.delete({ name, ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const url = req.nextUrl.clone()

  console.log(`[Middleware] Path: ${pathname}, Session: ${!!session}`)

  // 🔥 MUDANÇA CRÍTICA: Não force redirecionamento para /dashboard
  // Deixe o cliente decidir para onde ir quando logado
  
  // 1. Não logado tentando acessar /dashboard → manda pro login
  if (!session && pathname.startsWith('/dashboard')) {
    console.log('[Middleware] Não logado → redirecionando para /login')
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Raiz (/) → vai para login (deixe o cliente decidir após login)
  if (pathname === '/') {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ❌ REMOVIDO: Redirecionamento automático de /login para /dashboard
  // Deixe o componente de login/dashboard decidir com base na sessão

  return res
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/api/auth/callback',
  ],
}