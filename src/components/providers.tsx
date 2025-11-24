// src/components/providers.tsx
'use client'

// ✅ CORRETO - em TODOS os arquivos
import { createClient } from '@/lib/supabase'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'

const supabase = createClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}