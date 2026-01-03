import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient()
    const baseUrl = 'https://ligaon.com.br'

    // Fetch all active organizations
    // Limit to most recent 50000 to avoid timeout/size limits if scale grows,
    // but for now fetch all.
    const { data: organizations } = await supabase
        .from('organizations')
        .select('slug, updated_at')

    // Static routes
    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/criar`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ]

    // Dynamic league routes
    const leagueRoutes: MetadataRoute.Sitemap = (organizations || []).map((org) => ({
        url: `${baseUrl}/${org.slug}`,
        lastModified: new Date(org.updated_at || new Date()),
        changeFrequency: 'hourly', // "O Google gosta de conteúdo vivo"
        priority: 0.9,
    }))

    return [...routes, ...leagueRoutes]
}
