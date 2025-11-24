// app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClientInstance } from "@/lib/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Se não tiver código, manda de volta pro login com erro
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = createServerClientInstance();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Erro no exchangeCodeForSession:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Tudo certo → vai pro dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}