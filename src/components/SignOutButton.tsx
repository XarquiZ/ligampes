'use client'

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SignOutButton() {
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
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
