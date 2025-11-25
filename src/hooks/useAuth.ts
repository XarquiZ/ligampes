import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr' // ← no seu supabase.ts
import { User } from '@supabase/supabase-js'

export function useAuth() { // ← DEVE exportar useAuth
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ... resto do código
  }, [])

  const signIn = async () => {
    // ... resto do código
  }

  const signOut = async () => {
    // ... resto do código
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}