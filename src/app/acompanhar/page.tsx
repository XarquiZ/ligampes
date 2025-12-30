import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, ArrowRight, ExternalLink, LogOut, Mail, Trophy } from 'lucide-react'
import Link from 'next/link'
import PlatformSignOutButton from '@/components/PlatformSignOutButton'
import { PayButton } from '@/components/dashboard/BillingActions'

export default async function TrackerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch User's Organizations
    const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Minhas Ligas</h1>
                        <p className="text-zinc-400">Acompanhe o status e acesse seus campeonatos.</p>
                    </div>
                    <PlatformSignOutButton />
                </div>

                {/* List */}
                <div className="grid gap-4">
                    {orgs?.map((org) => (
                        <Card key={org.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                                {/* Info */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">{org.name}</h3>
                                        <BadgeStatus status={org.status} />
                                    </div>
                                    <p className="text-sm text-zinc-500">Slug: {org.slug}</p>
                                    <p className="text-xs text-zinc-600">Criado em: {new Date(org.created_at).toLocaleDateString('pt-BR')}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                                        <Mail className="w-3 h-3" />
                                        <span>Verifique seu e-mail para mais detalhes</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {org.status === 'pending_setup' && (
                                        <Button asChild variant="outline" className="w-full md:w-auto border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10">
                                            <Link href="https://wa.me/5511948707427" target="_blank">
                                                Falar com Suporte
                                            </Link>
                                        </Button>
                                    )}

                                    {org.status === 'payment_required' && (
                                        <PayButton orgId={org.id} plan={org.chosen_plan || 'mensal'} />
                                    )}

                                    {org.status === 'active' && (
                                        <>
                                            <Button asChild variant="outline" className="w-full md:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                                                <Link href={`/${org.slug}/login`} target="_blank">
                                                    Ver Projeto <ExternalLink className="ml-2 w-3 h-3" />
                                                </Link>
                                            </Button>
                                            <Button asChild className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-zinc-950 font-bold">
                                                <Link href={`/${org.slug}/dashboard`}>
                                                    Acessar Painel
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}

                    {(!orgs || orgs.length === 0) && (
                        <div className="text-center col-span-full py-12 space-y-4 border border-zinc-800 rounded-xl bg-zinc-900/50 p-8">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Nenhum campeonato encontrado</h3>
                            <p className="text-zinc-400 max-w-md mx-auto">
                                Você ainda não tem campeonatos cadastrados. Crie o seu agora para começar a gerenciar.
                            </p>
                            <Button asChild className="bg-green-500 hover:bg-green-600 text-black font-bold mt-4">
                                <Link href="/criar">Criar meu primeiro campeonato</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function BadgeStatus({ status }: { status: string }) {
    if (status === 'pending_setup') {
        return <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> Configurando</span>
    }
    if (status === 'payment_required') {
        return <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> Pagamento Pendente</span>
    }
    if (status === 'active') {
        return <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ativo</span>
    }
    return <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold border border-zinc-700">{status}</span>
}
