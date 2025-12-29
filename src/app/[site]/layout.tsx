import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase-server" // Import correto do Helper Server-Side
import { cookies } from "next/headers"
import { OrganizationProvider } from "@/contexts/OrganizationContext"

// Componente Server Side que busca os dados da liga antes de renderizar
export default async function SiteLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ site: string }>
}) {
    const { site } = await params

    // 1. Buscar dados da Organização pelo Slug
    // Nota: Em Server Components do Next 13+, podemos buscar dados direto aqui
    const supabase = await createClient() // Certifique-se que createClient usa cookies() para SSR se necessário, ou use createServerClient

    const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', site)
        .single()

    if (error || !organization) {
        console.error(`[SiteLayout] Organização não encontrada: ${site}`, error)
        return notFound() // Retorna página 404 se a liga não existir
    }

    // 2. (Opcional) Passar dados para um Context Provider se precisar acessar em Client Components
    // Por enquanto, vamos apenas renderizar o children.
    // Você pode injetar CSS variables aqui para o tema da liga.

    return (
        <div className="min-h-screen bg-zinc-950" data-org-id={organization.id} data-theme={JSON.stringify(organization.theme_config)}>
            <OrganizationProvider organization={organization}>
                {children}
            </OrganizationProvider>
        </div>
    )
}
