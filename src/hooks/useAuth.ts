import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      setLoading(true)
      const { data, error } = await supabase.auth.getUser()
      if (isMounted) {
        setUser(data?.user ?? null)
        setLoading(false)
      }
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (params: Parameters<typeof supabase.auth.signInWithOAuth>[0]) => {
    return supabase.auth.signInWithOAuth(params)
  }
  const signOut = async () => {
    return supabase.auth.signOut()
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}