import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function SiteRoot({ params }: { params: Promise<{ site: string }> }) {
    const { site } = await params
    const supabase = await createClient()

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        // If logged in, go to dashboard
        redirect(`/${site}/dashboard`)
    } else {
        // If not logged in, go to LEAGUE login (not global login)
        redirect(`/${site}/login`)
    }
}
