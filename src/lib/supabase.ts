// src/lib/supabase.ts - VERSÃO SUPER SIMPLES
import { createBrowserClient } from '@supabase/ssr'

// Configuração mínima - sem opções complexas
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)