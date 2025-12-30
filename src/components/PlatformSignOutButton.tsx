'use client'

import { Button } from "@/components/ui/button"
import { supabasePlatform } from "@/lib/supabase-platform"
import { useRouter } from "next/navigation"

export default function PlatformSignOutButton() {
    const router = useRouter()

    const handleSignOut = async () => {
        await supabasePlatform.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <Button
            variant="outline"
            className="border-zinc-800 hover:bg-zinc-900 text-zinc-400"
            onClick={handleSignOut}
        >
            Sair
        </Button>
    )
}
