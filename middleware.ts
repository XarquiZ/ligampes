// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: any) {
  console.log('🌐 Middleware - Path:', req.nextUrl.pathname)
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('🔐 Middleware - Session:', session ? `✅ ${session.user.email}` : '❌ No session')

  // Se já estiver logado e tentar ir pro login → manda pro dashboard
  if (session && req.nextUrl.pathname === '/login') {
    console.log('🔄 Redirect: Logged user from /login to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Se não tiver logado e tentar acessar dashboard → manda pro login
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('🔄 Redirect: Unauthorized from dashboard to login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  console.log('✅ Middleware - Allowing access to:', req.nextUrl.pathname)
  return res
}

export const config = {
  matcher: ['/login', '/dashboard/:path*']
}