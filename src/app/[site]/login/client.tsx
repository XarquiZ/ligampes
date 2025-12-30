'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface Organization {
    id: string
    name: string
    slug: string
}

export function CentralLoginClient({ organization }: { organization: Organization }) {
    const handleGoogleLogin = async () => {
        try {
            await supabase.auth.signOut()
            const origin = window.location.origin
            // Important: Pass the target site in the query param 'next' so callback knows where to go
            const redirectTo = `${origin}/api/auth/callback?next=/${organization.slug}/dashboard`

            console.log("Login targeting:", organization.slug)

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })
            if (error) throw error
        } catch (error) {
            console.error(error)
            toast.error('Erro ao conectar com Google')
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative">
            <Link
                href="/"
                className="absolute top-6 left-6 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors backdrop-blur-sm"
            >
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>

            <div className="mb-8 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                    <Trophy className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">{organization.name}</h1>
                <p className="text-zinc-500 font-medium">Área de Membros</p>
            </div>

            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl text-white">Login da Liga</CardTitle>
                    <CardDescription>Entre para acessar o painel desta liga</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <Button
                            variant="outline"
                            className="bg-white text-black hover:bg-zinc-200 border-0 h-10 font-bold"
                            onClick={handleGoogleLogin}
                            type="button"
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                            Entrar com Google
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
