// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Não podemos mais usar cookies().set() no middleware
          // Então setamos manualmente no response
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // Pega a sessão
  const { data: { session } } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  // Rotas públicas
  const isPublic = ["/login", "/api/auth/callback"].includes(path);

  // Protege rotas (não logado)
  if (!session && !isPublic && !path.startsWith("/_next") && !path.includes(".")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Evita login quando já está logado
  if (session && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em tudo EXCETO arquivos estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};