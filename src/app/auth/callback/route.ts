import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('Callback triggered! Code:', code ? '✅ Exists' : '❌ Missing')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Session exchange:', error ? `❌ ${error.message}` : '✅ Success')
    
    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback`)
    }
  }

  console.log('Redirecting to dashboard...')
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}