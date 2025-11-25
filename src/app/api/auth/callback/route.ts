// app/api/auth/callback/route.ts → VERSÃO FINAL, IMBATÍVEL E COM LOGS (2025)
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic" // força execução sempre no server

export async function GET(request: Request) {
  console.log("CALLBACK RODANDO → início")

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  console.log("Code recebido do Google:", code ? "sim" : "não")

  if (!code) {
    console.log("Sem code → redirecionando pro login com erro")
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  // Cria a resposta ANTES de tudo (importante!)
  const response = NextResponse.redirect(`${origin}/dashboard`)
  console.log("Response criada → redireciona pro /dashboard")

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const value = request.cookies.get(name)?.value
          console.log(`[COOKIE GET] ${name} → ${value ? "encontrado" : "não encontrado"}`)
          return value
        },
        set(name, value) {
          console.log(`[COOKIE SET] ${name} → sendo escrito (tamanho: ${value.length} chars)`)
          response.cookies.set({
            name,
            value,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            // NÃO define maxAge → vira session cookie (some ao fechar aba)
          })
        },
        remove(name) {
          console.log(`[COOKIE DELETE] ${name}`)
          response.cookies.delete({ name, path: "/" })
        },
      },
    }
  )

  console.log("Tentando trocar code por sessão...")
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error("ERRO no exchangeCodeForSession:", error?.message || "sem sessão")
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  console.log("exchangeCodeForSession SUCESSO!")
  console.log("Access token existe:", !!data.session.access_token)
  console.log("Refresh token existe:", !!data.session.refresh_token)

  // ESSA É A LINHA QUE RESOLVE TUDO: força o Supabase a escrever os cookies de sessão
  console.log("Forçando setSession para gravar cookies...")
  const setSessionResult = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  if (setSessionResult.error) {
    console.error("ERRO no setSession:", setSessionResult.error.message)
    return NextResponse.redirect(`${origin}/login?error=set_session_failed`)
  }

  console.log("setSession executado com sucesso → cookies foram escritos!")

  // Limpeza opcional de tokens antigos (não prejudica)
  ;["sb-provider-token", "sb-access-token", "sb-refresh-token"].forEach((name) => {
    if (request.cookies.has(name)) {
      response.cookies.delete({ name, path: "/" })
      console.log(`Cookie antigo removido: ${name}`)
    }
  })

  console.log("CALLBACK FINALIZADO → redirecionando pro dashboard")
  return response
}