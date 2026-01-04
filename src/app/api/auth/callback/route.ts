import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const nextParam = requestUrl.searchParams.get('next')

  // Determine the correct origin
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  // Default redirect
  let next = nextParam ?? '/acompanhar'

  console.log('[Callback] Debug - Host:', host)
  console.log('[Callback] Next Param:', nextParam)

  // --- LOCALHOST SUBDOMAIN LOGIC (Dev Only) ---
  if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
    const isSubdomain = host.match(/^[^.]+\.localhost/)
    if (!isSubdomain && !nextParam) {
      // If no specific destination and on root localhost, go to landing/tracking
      // CHECK: Should this be /acompanhar or just root? User mentioned root is for management.
      // Keeping /acompanhar as fallback if no intent is present.
      // But if nextParam is present (e.g. from league login), we respect it.
      if (next === '/dashboard') next = '/acompanhar'
    }
  }

  if (error) {
    console.error('[Callback] Auth Error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const authType = requestUrl.searchParams.get('auth_type')

  if (code) {
    try {
      // Use default cookie scope to match client-side configuration
      const debugCookieStore = await cookies()
      const allCookies = debugCookieStore.getAll().map(c => c.name).join(', ')
      console.log('[Callback] Available Cookies:', allCookies)

      const cookieName = authType === 'platform' ? 'sb-platform-auth' : undefined
      const supabase = await createClient(cookieName)
      const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError || !session) {
        console.error('[Callback] Session Exchange Error:', authError)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      console.log('[Callback] Authentication Successful')
      const user = session.user

      // --- LEAGUE ISOLATION ENFORCEMENT ---
      // If 'next' points to a specific league dashboard (e.g. /mpes/dashboard), verify membership.
      const match = next.match(/^\/([^\/]+)\/dashboard/)
      if (match) {
        const targetSlug = match[1]
        console.log(`[Callback] User targeting league: ${targetSlug}`)

        // 1. Resolve Org ID from Slug
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', targetSlug)
          .single()

        if (org) {
          // 2. Check Membership
          // We can check 'user_roles' or 'organization_members' depending on schema.
          // Usually 'user_roles' links user_id <-> organization_id
          const { data: member } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', org.id)
            .single()

          // Check if Owner (in case not in user_roles) - usually owners are added to roles, but safety net
          const { data: isOwner } = await supabase
            .from('organizations')
            .select('id')
            .eq('id', org.id)
            .eq('owner_id', user.id)
            .single()

          if (!member && !isOwner) {
            console.warn(`[Callback] Access Denied: User ${user.id} is not a member of ${targetSlug}`)
            // Redirect to unauthorized page or back to login with error
            // We should sign them out or just show error? 
            // Better to redirect to a clearer error page.
            return NextResponse.redirect(`${origin}/${targetSlug}/login?error=unauthorized_member`)
          }
        }
      }

      // Handle custom cookie redirect if present (overrides if still valid, but usually nextParam is safer for OAuth flow)
      const cookieStore = await cookies()
      const cookieRedirect = cookieStore.get('auth_redirect')
      if (cookieRedirect?.value) {
        // Only use cookie if we didn't have a specific `next` param intent
        if (!nextParam) {
          next = cookieRedirect.value
        }
        cookieStore.delete('auth_redirect')
      }

      return NextResponse.redirect(`${origin}${next}`)

    } catch (error) {
      console.error('[Callback] Unexpected Error:', error)
      return NextResponse.redirect(`${origin}/login?error=server_error`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}