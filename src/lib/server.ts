// src/lib/server.ts → VERSÃO FINAL E ALINHADA COM O RESTO DO PROJETO
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createServerClientInstance() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            // Força cookie de sessão (some ao fechar navegador)
            cookieStore.set({
              name,
              value,
              ...options,
              // Garante que não fique pra sempre
              maxAge: undefined, // session cookie
              expires: undefined,
            });
          } catch {
            // Silencioso — comum no middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Silencioso
          }
        },
      },
      auth: {
        // Opcional: reforça que não queremos persistência longa no server também
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}