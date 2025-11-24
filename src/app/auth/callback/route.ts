// /app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(url.origin + "/login?error=missing_code")
  }

  const supabase = createRouteHandlerClient({ cookies })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(url.origin + "/login?error=session_fail")
  }

  return NextResponse.redirect(url.origin + "/dashboard")
}
