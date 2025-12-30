'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Organization {
    id: string
    name: string
    slug: string
}

export function CentralLoginClient({ organization }: { organization: Organization }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError(null)
        console.log('[Login] Iniciando login com Google...')

        try {
            await supabase.auth.signOut()
            const origin = window.location.origin
            // REDIRECT LOGIC: 
            // 1. Set Cookie as primary context preserver
            const targetPath = `/${organization.slug}/dashboard`
            document.cookie = `auth_redirect=${targetPath}; path=/; max-age=300; SameSite=Lax`

            // 2. Also pass 'next' param as backup
            // Explicitly construct the full URL with the next parameter
            const nextParam = encodeURIComponent(targetPath)
            const redirectTo = `${origin}/api/auth/callback?next=${targetPath}`

            console.log("Login targeting:", organization.slug, "Redirect:", redirectTo)

            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (authError) throw authError
        } catch (err: any) {
            console.error('[Login] Erro:', err)
            setError(err.message || 'Erro ao conectar com Google')
            setLoading(false)
        }
    }

    // ORIGINAL STYLES RESTORED
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="text-2xl font-semibold text-white animate-pulse">
                    Verificando...
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black relative">
            <Link
                href="/"
                className="absolute top-6 left-6 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors backdrop-blur-sm"
            >
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <Card className="w-full max-w-md p-10 border-white/10 bg-zinc-900/50 backdrop-blur-xl">
                <div className="text-center space-y-6">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent uppercase">
                        {organization.name}
                    </h1>
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}
                    <p className="text-zinc-400 text-lg">
                        Faça login para gerenciar seu time
                    </p>
                    <Button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        size="lg"
                        className="w-full text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                    >
                        Entrar com Google
                    </Button>
                </div>
            </Card>
        </div>
    )
}
