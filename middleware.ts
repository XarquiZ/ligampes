// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers
    }
  });

  // Criando cliente SSR **CORRETO**
  const supabase = createServerClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set(name, value, options);
      },
      remove(name: string, options: any) {
        res.cookies.set(name, "", { ...options, maxAge: 0 });
      }
    }
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  const publicPaths = ["/login", "/auth/callback"];

  // Bloqueia rotas privadas
  if (!session && !publicPaths.includes(path)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redireciona logado → login → dashboard
  if (session && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
