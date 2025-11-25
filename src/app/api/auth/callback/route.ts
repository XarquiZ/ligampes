// app/api/auth/callback/route.ts → VERSÃO 100% FUNCIONAL (2025)
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const response = NextResponse.redirect(`${origin}/dashboard`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value) {
          response.cookies.set({
            name,
            value,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            // Session cookie → some ao fechar a aba
          })
        },
        remove(name) {
          response.cookies.delete({ name, path: "/" })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Erro no callback:", error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // LIMPEZA TOTAL DO ESTADO ANTIGO DO PKCE (resolve flow_state_not_found)
  response.cookies.delete("sb-provider-token")
  response.cookies.delete("sb-access-token")
  response.cookies.delete("sb-refresh-token")

  return response
}