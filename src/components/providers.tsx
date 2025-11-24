// src/components/providers.tsx
'use client'

// ✅ CORRETO - em TODOS os arquivos
import { supabase } from '@/lib/supabase'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}