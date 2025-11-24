import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Exchange error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}