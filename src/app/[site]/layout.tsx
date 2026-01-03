import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { OrganizationProvider } from "@/contexts/OrganizationContext"
import type { Metadata } from "next"
import Script from "next/script"

// Componente Server Side que busca os dados da liga antes de renderizar
export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
    const { site } = await params
    const supabase = await createClient()

    const { data: organization } = await supabase
        .from('organizations')
        .select('name, description, logo_url') // future: select 'city', 'season'
        .eq('slug', site)
        .single()

    if (organization) {
        const baseUrl = 'https://ligaon.com.br'
        const cleanName = organization.name || 'Liga'
        // Title Rule: "Tabela e Jogos". H1 will be "Temporada 2026"
        const title = `${cleanName} – Tabela e Jogos | LigaOn`
        const description = organization.description
            ? `${organization.description.slice(0, 150)}...`
            : `Confira tabela, jogos e estatísticas da ${cleanName}. Campeonato amador de futebol organizado na plataforma LigaOn.`

        return {
            title: title,
            description: description,
            metadataBase: new URL(baseUrl),
            alternates: {
                canonical: `/${site}`,
            },
            openGraph: {
                title: title,
                description: description,
                url: `/${site}`,
                siteName: 'LigaOn',
                locale: 'pt_BR',
                type: 'website',
                images: organization.logo_url ? [{ url: organization.logo_url }] : [],
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: description,
                images: organization.logo_url ? [organization.logo_url] : [],
            },
            keywords: ['futebol amador', 'campeonato', 'liga', cleanName, 'tabela', 'jogos', 'artilharia'],
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
        return notFound()
    }

    // --- PROFILE CHECK & CREATION LOGIC ---
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .eq('organization_id', organization.id)
            .maybeSingle()

        if (!profile) {
            const isOwner = user.email === organization.owner_email;
            const initialRole = isOwner ? 'admin' : 'coach';
            await supabase.from('profiles').insert({
                id: user.id,
                organization_id: organization.id,
                email: user.email,
                role: initialRole,
                created_at: new Date().toISOString()
            })
        }
    }

    // --- JSON-LD STRUCTURED DATA ---
    const jsonLd: any = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${organization.name} - Temporada ${new Date().getFullYear()}`, // Default season if missing
        "sport": "Soccer",
        "organizer": {
            "@type": "Organization", // Using generic Organization for LigaOn as platform
            "name": "LigaOn",
            "url": "https://ligaon.com.br"
        },
        "description": organization.description || `Campeonato ${organization.name}`,
        "url": `https://ligaon.com.br/${site}`
    }

    // CONDITIONAL LOCATION: Only add if city exists (mock check for now, add real check later)
    if (organization.city) {
        jsonLd.location = {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": organization.city
            }
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950" data-org-id={organization.id} data-theme={JSON.stringify(organization.theme_config)}>
            <OrganizationProvider organization={organization}>
                <Script
                    id="seo-json-ld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                {children}
            </OrganizationProvider>
        </div>
    )
}
