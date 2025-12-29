import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { OrganizationProvider } from "@/contexts/OrganizationContext"
import type { Metadata } from "next"

// Componente Server Side que busca os dados da liga antes de renderizar
export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
    const { site } = await params
    const supabase = await createClient()

    console.log(`[Metadata Debug] Fetching for site: ${site}`)

    const { data: organization, error } = await supabase
        .from('organizations')
        .select('name, description, logo_url')
        .eq('slug', site)
        .single()

    if (error) {
        // Stringify usage to reveal hidden properties of the error object
        console.error(`[Metadata Debug] Error fetching organization:`, JSON.stringify(error, null, 2))
    }

    if (organization) {
        console.log(`[Metadata Debug] Found organization:`, organization.name)
        return {
            title: organization.name,
            description: organization.description || `Campeonato oficial ${organization.name}`,
            icons: {
                icon: organization.logo_url || "/favicon.ico",
            }
        }
    }

    return {
        title: "Liga não encontrada",
        description: "Esta liga não existe ou foi removida."
    }
}

export default async function SiteLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ site: string }>
}) {
    const { site } = await params
    const supabase = await createClient()

    const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', site)
        .single()

    if (error || !organization) {
        console.error(`[SiteLayout] Organização não encontrada: ${site}`, error)
        return notFound()
    }

    return (
        <div className="min-h-screen bg-zinc-950" data-org-id={organization.id} data-theme={JSON.stringify(organization.theme_config)}>
            <OrganizationProvider organization={organization}>
                {children}
            </OrganizationProvider>
        </div>
    )
}
