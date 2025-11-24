// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClientInstance } from "@/lib/server";

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClientInstance();
  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Rotas públicas (não precisam de login)
  const publicPaths = ["/login", "/api/auth/callback"];
  const isPublic = publicPaths.includes(path) || path.startsWith("/api/auth/callback");

  // Não logado e tentando acessar rota protegida
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logado e tentando ir pro login
  if (session && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};