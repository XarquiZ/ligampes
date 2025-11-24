// /src/app/auth/callback/route.ts

export const dynamic = "force-dynamic"; 
export const runtime = "nodejs";        
export const revalidate = 0;

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
  }

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
          cookieStore.set({
            name,
            value,
            ...options,
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
          })
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: '',
            ...options,
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
          })
        }
      }
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=exchange_failed`)
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
