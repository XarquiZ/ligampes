// /src/components/providers.tsx
'use client'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabase } from '@/lib/supabase'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}
