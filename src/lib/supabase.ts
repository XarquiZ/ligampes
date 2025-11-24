// /src/lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      detectSessionInUrl: true,
      autoRefreshToken: true,
      persistSession: true,     // 🔥 Mantém cookies funcionando com middleware
      flowType: "pkce",
    },
  }
);
