// middleware.ts → VERSÃO FINAL E PERFEITA COM @supabase/ssr (2025)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Cria o cliente Supabase com cookies da requisição
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

  // Pega a sessão (isso já atualiza os cookies automaticamente)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const url = req.nextUrl.clone()

  // 1. Logado tentando ir pro /login → manda pro dashboard
  if (session && pathname === '/login') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 2. Não logado tentando acessar /dashboard → manda pro login
  if (!session && pathname.startsWith('/dashboard')) {
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // 3. Raiz (/) → SEMPRE pro login (nunca pro dashboard)
  if (pathname === '/') {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/api/auth/callback', // essencial pro OAuth funcionar
  ],
}