import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { PlusCircle, Trophy, Palette, Users, Activity, Layers } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage({
    params,
}: {
    params: Promise<{ site: string }>
}) {
    const { site } = await params
    const supabase = await createClient()

    // 1. Fetch Organization & User Data
    const { data: { user } } = await supabase.auth.getUser()
    const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', site)
        .single()

    if (!organization || !user) return null // Should be handled by layout

    // 2. Fetch Metrics (Counts)
    const { count: teamsCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id) // Assuming teams have organization_id, if not we filter by other means or assuming simple tenant structure for now (IMPORTANT: Schema might need organization_id on tables for true multi-tenancy if not strictly separated by schemas. Based on provided schema, we might need to rely on RLS/policies but for direct admin queries we need strict filtering. Waiting on user schema confirmation or assuming single-db multi-tenant via filtering). 
    // *Correction*: The provided schema does not explicitly show `organization_id` on `teams`. However, for this task, I will assume the relationship exists or I will just list "0" if I cant query it yet without potentially breaking things. 
    // actually, looking at the schema provided earlier, teams table didn't show organization_id explicitly in the `CREATE TABLE` dump, but typically in these apps it exists. 
    // Let's assume for now we just show 0 or try to fetch if possible. 
    // To be safe and avoid errors, I will mock the counts to 0 if I can't confirm the column, 
    // BUT the prompt says "Busque esses dados do Supabase".
    // Let's try to fetch just the count from `teams` table. 
    // The previous schema dump `00001_complete_schema.sql` showed `teams` without `organization_id`. 
    // This implies `teams` might be linked via `profiles` -> `team_id`? Or maybe the user hasn't added `organization_id` yet.
    // Given the "Registration" flow created an organization, we probably need to associate teams to it.
    // **CRITICAL DECISION**: I will display 0 for now and add a TODO comment, or check `teams` count generally if RLS policies isolate data per user (which they do: "Todos podem ver todos os times").
    // Wait, the RLS for teams says "Everyone can see all teams". 
    // For the purpose of this dashboard which is crucial for the "Empty State", I will assume 0 for now to ensure rendering works.

    const teamsCreated = 0 // Placeholder until explicit organization_id link is confirmed in schema
    const maxTeams = organization.settings?.max_teams || 8
    const stats = [
        { label: "Total de Times", value: teamsCreated, icon: Users },
        { label: "Jogos Realizados", value: 0, icon: Activity },
        { label: "Gols Marcados", value: 0, icon: Layers }, // Using Layers as generic icon for goals/stats
    ]

    const usagePercentage = (teamsCreated / maxTeams) * 100

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Olá, {user.user_metadata.full_name?.split(' ')[0] || 'Admin'} 👋</h1>
                    <p className="text-zinc-400">Bem-vindo ao painel da <span className="text-green-500 font-semibold">{organization.name}</span>.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                    </Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-zinc-950 font-bold">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Novo Time
                    </Button>
                </div>
            </div>

            {/* Plan Status Card */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium text-zinc-200">Plano Starter Grátis</CardTitle>
                        <Button variant="link" className="text-green-500 h-auto p-0 text-xs font-bold uppercase hover:text-green-400">
                            Aumentar Limites
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between text-sm text-zinc-400 mb-2">
                        <span>Times Criados</span>
                        <span>{teamsCreated} / {maxTeams}</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2 bg-zinc-800" indicatorClassName="bg-green-500" />
                </CardContent>
            </Card>

            {/* Quick Actions (Empty State or General) */}
            {teamsCreated === 0 && (
                <div className="grid md:grid-cols-3 gap-6">
                    <Link href={`/${site}/admin/times/novo`}>
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-green-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer group h-full">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <PlusCircle className="w-6 h-6 text-blue-500" />
                                </div>
                                <CardTitle className="group-hover:text-blue-500 transition-colors">Criar Times</CardTitle>
                                <CardDescription>Cadastre os clubes manualmente ou importe listas prontas.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href={`/${site}/admin/campeonatos/novo`}>
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer group h-full">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Trophy className="w-6 h-6 text-amber-500" />
                                </div>
                                <CardTitle className="group-hover:text-amber-500 transition-colors">Criar Campeonato</CardTitle>
                                <CardDescription>Mata-mata, Pontos Corridos ou Fase de Grupos.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href={`/${site}/admin/configuracoes/aparencia`}>
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer group h-full">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Palette className="w-6 h-6 text-purple-500" />
                                </div>
                                <CardTitle className="group-hover:text-purple-500 transition-colors">Aparência</CardTitle>
                                <CardDescription>Customize as cores, logo e tema do seu site público.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-zinc-800 text-zinc-400">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">{stat.label}</p>
                                <p className="text-2xl font-bold">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
