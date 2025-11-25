// app/api/auth/callback/route.ts → VERSÃO FINAL E IMBATÍVEL (2025)
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // CRIA A RESPONSE ANTES DE TUDO
  const response = NextResponse.redirect(`${origin}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            // ESSAS 3 LINHAS FAZEM O COOKIE SER DE SESSÃO (some ao fechar a aba)
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            // NÃO DEFINE maxAge nem expires → vira session cookie!
          });
        },
        remove(name) {
          response.cookies.delete({ name, path: "/" });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Erro no callback:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return response;
}