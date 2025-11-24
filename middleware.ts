// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  console.log(`🌐 Middleware - Path: ${pathname}`)
  console.log(`🔐 Middleware - Session: ${session ? '✅' : '❌ No session'}`)

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/auth/callback', '/']
  
  // Se está tentando acessar uma rota protegida sem sessão
  if (!session && !publicRoutes.includes(pathname)) {
    console.log('🔄 Redirect: Unauthorized to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se já tem sessão e está tentando acessar login, redireciona para dashboard
  if (session && pathname === '/login') {
    console.log('🔄 Redirect: Already authenticated to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}