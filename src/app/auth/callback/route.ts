import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('Full URL:', request.url)
  console.log('Code exists:', !!code)
  console.log('Error param:', error)
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (error) {
    console.log('❌ OAuth error from provider:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_${error}`)
  }

  if (!code) {
    console.log('❌ No authorization code received')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
  }

  try {
    const supabase = createClient()
    console.log('🔄 Attempting to exchange code for session...')
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.log('❌ SUPABASE EXCHANGE ERROR:', exchangeError.message)
      console.log('❌ Error details:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
      )
    }

    console.log('✅ Session exchange successful!')
    console.log('User:', data.user?.email)
    console.log('Session:', !!data.session)
    
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    
  } catch (catchError: any) {
    console.log('❌ UNEXPECTED ERROR:', catchError)
    console.log('❌ Stack:', catchError.stack)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unexpected`)
  }
}