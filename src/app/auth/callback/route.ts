import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🔄 CALLBACK: Iniciando processamento...')
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('📥 CALLBACK: URL completa:', request.url)
  console.log('📥 CALLBACK: Code:', code)
  console.log('📥 CALLBACK: Error param:', error)

  if (error) {
    console.error('❌ CALLBACK: Erro do OAuth:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_${error}`)
  }

  if (!code) {
    console.error('❌ CALLBACK: Nenhum código recebido')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
  }

  try {
    const cookieStore = cookies()
    console.log('🍪 CALLBACK: Cookies disponíveis:', cookieStore.getAll().map(c => c.name))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value
            console.log(`🍪 CALLBACK: Get cookie ${name}:`, value ? '✅ Existe' : '❌ Não existe')
            return value
          },
          set(name: string, value: string, options: any) {
            console.log(`🍪 CALLBACK: Set cookie ${name}`)
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            console.log(`🍪 CALLBACK: Remove cookie ${name}`)
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    console.log('🔄 CALLBACK: Tentando exchange code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ CALLBACK: Erro no exchange:', exchangeError.message)
      console.error('❌ CALLBACK: Detalhes do erro:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=exchange_failed`)
    }

    console.log('✅ CALLBACK: Sessão criada com sucesso!')
    console.log('✅ CALLBACK: Usuário:', data.user?.email)
    
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    
  } catch (catchError) {
    console.error('💥 CALLBACK: Erro inesperado:', catchError)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unexpected`)
  }
}