'use client'

import { useAuth } from "@/hooks/useAuth"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const site = params?.site as string

    useEffect(() => {
        if (!loading && !user) {
            if (site) {
                router.replace(`/${site}`)
            } else {
                router.replace('/')
            }
        }
    }, [loading, user, router, site])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                {/* Opcional: Adicionar um logo ou texto aqui */}
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}
