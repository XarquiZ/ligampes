import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ArrowRight, Trophy, Users } from 'lucide-react'

// PUBLIC LANDING PAGE (No redirects!)
export default async function PublicLeagueHome({ params }: { params: Promise<{ site: string }> }) {
    const { site } = await params
    const supabase = await createClient()

    const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', site)
        .single()

    if (!organization) return null;

    // --- SEO LOGIC: H1 vs TITLE ---
    // Rule: Title is "Tabela e Jogos", H1 is "Temporada [Ano]" or specific Name
    const seasonYear = new Date().getFullYear(); // Or organization.season if available
    const h1Title = `${organization.name} – Temporada ${seasonYear}`;

    // --- SEO LOGIC: DYNAMIC SUMMARY ---
    // Rule: Do NOT invent city. Use fallback.
    const cityText = organization.city ? `realizado em ${organization.city}` : "organizado na plataforma LigaOn";
    const sportText = organization.sport_type || "futebol amador";

    // SEO-rich paragraph
    const seoSummary = `A ${organization.name} é um campeonato de ${sportText} ${cityText}. Confira a tabela de classificação, lista de times, jogos da rodada e estatísticas completas em tempo real.`;

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header / Hero */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">

                {organization.logo_url && (
                    <img
                        src={organization.logo_url}
                        alt={`Logo ${organization.name}`}
                        className="w-32 h-32 md:w-40 md:h-40 object-contain mb-8 drop-shadow-2xl"
                    />
                )}

                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
                    {h1Title}
                </h1>

                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
                    {seoSummary}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Link
                        href={`/${site}/login`}
                        className="flex-1 bg-white text-black font-bold py-4 px-8 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        Acessar Painel
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    {/* Future: Add "Ver Tabela" button directly to public table page if created */}
                    <Link
                        href={`/${site}/dashboard/tabela`}
                        className="flex-1 bg-zinc-900 border border-zinc-800 text-white font-semibold py-4 px-8 rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                        <Trophy className="w-5 h-5 text-emerald-500" />
                        Ver Tabela
                    </Link>
                </div>
            </div>

            {/* SEO Semantic Footer Content */}
            <footer className="w-full max-w-4xl mx-auto p-8 border-t border-zinc-900 mt-auto">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Sobre a Liga</h2>
                        <p className="text-zinc-600 text-sm leading-relaxed">
                            {seoSummary} Esta página serve como o portal oficial para acompanhar o desempenho dos times e atletas.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Links Rápidos</h2>
                        <ul className="space-y-2 text-zinc-600 text-sm">
                            <li><Link href={`/${site}/dashboard/times`} className="hover:text-emerald-500 transition-colors">Times Participantes</Link></li>
                            <li><Link href={`/${site}/dashboard/jogos`} className="hover:text-emerald-500 transition-colors">Próximos Jogos</Link></li>
                            <li><Link href={`/${site}/dashboard/tabela`} className="hover:text-emerald-500 transition-colors">Classificação</Link></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </main>
    )
}

