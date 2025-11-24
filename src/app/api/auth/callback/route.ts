// app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Response vazio com redirect
  const response = new NextResponse(null, {
    status: 302,
    headers: { Location: `${origin}/dashboard` },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set(name, value, {
            ...options,
            secure: process.env.NODE_ENV === 'production',  // ← true no Vercel
            sameSite: 'lax',  // ← essencial para redirects cross-site (Google OAuth)
            httpOnly: true,
            path: '/',
          });
        },
        remove(name, options) {
          response.cookies.delete({ name, ...options });
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