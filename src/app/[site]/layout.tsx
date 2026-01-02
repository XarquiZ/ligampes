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

    // --- PROFILE CHECK & CREATION LOGIC ---
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // Verifica se existe perfil para esta organização ESPECÍFICA
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .eq('organization_id', organization.id)
            .maybeSingle()

        if (!profile) {
            // Verify if user is the owner (by email, as IDs might differ in new logins)
            const isOwner = user.email === organization.owner_email;
            const initialRole = isOwner ? 'admin' : 'coach';

            console.log(`[SiteLayout] Creating missing profile for user ${user.id} in org ${organization.slug}. Is Owner (by email)? ${isOwner}`)

            // Tenta criar o perfil. 
            // Nota: Isso pressupõe que a tabela profiles permite composite PK (id, organization_id) 
            // ou que 'id' não é PK única global. Se falhar, é erro de schema.
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    organization_id: organization.id,
                    email: user.email,
                    role: initialRole,
                    created_at: new Date().toISOString()
                })

            if (insertError) {
                console.error('[SiteLayout] Error creating profile:', JSON.stringify(insertError, null, 2))
            } else {
                console.log('[SiteLayout] Profile created successfully')
            }
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950" data-org-id={organization.id} data-theme={JSON.stringify(organization.theme_config)}>
            <OrganizationProvider organization={organization}>
                {children}
            </OrganizationProvider>
        </div>
    )
}
