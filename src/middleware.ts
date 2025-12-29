import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  let hostname = req.headers.get('host') || ''

  // Suporte a headers de proxy (Vercel, Nginx, etc)
  const forwardedHost = req.headers.get('x-forwarded-host')
  if (forwardedHost && !forwardedHost.includes('localhost:3000')) {
    hostname = forwardedHost
  }

  // Para Vercel Dev local, às vezes o host vem como localhost:3000 mesmo com subdomínio no navegador?
  // Ou usamos o url.host?
  if (process.env.NODE_ENV === 'development') {
    // Em dev local, confia no header host do navegador
    // mas se estiver usando 'vercel dev', o x-forwarded-host pode ser útil
    if (forwardedHost) hostname = forwardedHost
  }

  // 1. Definições de Domínios
  // Domínios que DEVEM ir para a Landing Page (app/page.tsx)
  const ROOT_DOMAINS = new Set([
    'localhost:3000',
    'minhaligavirtual.com',
    'www.minhaligavirtual.com',
    'minhaligavirtual.vercel.app',
    'ligaon.vercel.app', // Novo nome do projeto
  ])

  // Mapeamento MANUAL para domínios legados (Ex: seu site atual no Vercel)
  // Isso garante que 'ligampes.vercel.app' aponte para a liga 'mpes'
  const LEGACY_DOMAINS: Record<string, string> = {
    'ligampes.vercel.app': 'mpes',
    // Adicione outros mapeamentos manuais aqui se precisar
  }

  // 2. Refresh de Sessão do Supabase (Essencial para Auth funcionar)
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  // 3. Lógica de Subdomínio e Rewrites (Multi-Tenant)
  console.log('[Middleware] Debug Hostname:', hostname)

  // Ignorar arquivos estáticos e APIs internas
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.') // Arquivos com extensão (imagens, etc)
  ) {
    return response // Retorna normal
  }

  // Identificar se é um domínio de Landing Page
  const isRootDomain = ROOT_DOMAINS.has(hostname)

  if (isRootDomain) {
    // Se for raiz (ex: localhost:3000), mostra a Landing Page (src/app/page.tsx)
    // Nenhuma reescrita necessária, pois src/app/page.tsx já é a raiz.
    return response
  }

  // Se NÃO for raiz, é um Tenant (Liga)
  let currentSite: string | null = null

  // Verifica se é um domínio legado mapeado manualmente
  if (LEGACY_DOMAINS[hostname]) {
    currentSite = LEGACY_DOMAINS[hostname]
  } else {
    // Lógica para Localhost e Vercel Preview
    if (hostname.includes('.localhost')) {
      // Ex: mpes.localhost:3000 -> mpes
      const parts = hostname.split('.localhost')
      currentSite = parts[0]
    } else if (hostname.endsWith('.vercel.app')) {
      // Ex: mpes.vercel.app -> mpes
      // Cuidado com: ligampes.vercel.app (já tratado no LEGACY)
      const parts = hostname.split('.vercel.app')
      currentSite = parts[0]
    } else {
      // Domínios customizados (ex: app.minhaligavirtual.com)
      const subdomain = hostname.split('.')[0]
      currentSite = subdomain
    }

    // Proteção final: Se cair aqui e for um IP ou algo estranho
    if (!currentSite || currentSite.includes(':') || currentSite.startsWith('[') || currentSite === 'localhost') {
      // Se não conseguiu extrair um subdomínio válido e não é ROOT, manda para login ou 404
      // Mas para evitar o erro [::1], vamos forçar 'mpes' se for desenvolvimento local sem subdomínio explicito que escapou
      if (process.env.NODE_ENV === 'development') {
        // Fallback seguro apenas para evitar crash local
        console.warn('[Middleware] Hostname estranho detectado:', hostname, '-> Redirecionando para ROOT')
        return response
      }
      return response // Retorna para a home se não identificar subdomínio
    }
  }

  // 4. Reescrever a URL para rota dinâmica
  // De: mpes.dominio.com/dashboard
  // Para: /mpes/dashboard (que o Next.js mapeia para src/app/[site]/dashboard)

  // Importante: Mantemos a query string
  const searchParams = url.searchParams.toString()
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`

  // Rewrite para a pasta [site]
  return NextResponse.rewrite(new URL(`/${currentSite}${path}`, req.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
}