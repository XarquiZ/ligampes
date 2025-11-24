import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🔄 Auth Callback Triggered')
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('📥 Callback Code:', code ? '✅ Received' : '❌ Missing')

  if (code) {
    const supabase = createClient()
    
    console.log('🔄 Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Session Exchange Error:', error.message)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }

    console.log('✅ Session created successfully!')
    console.log('User:', data.user?.email)
    
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }

  console.log('❌ No code provided')
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
}