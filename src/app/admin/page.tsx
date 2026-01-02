import { createClient, createAdminClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminList from './AdminList'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 🔒 Security Check
    if (user.email !== 'wellinton.sbatista@gmail.com') {
        redirect('/')
    }

    // 2. Fetch Pending Leagues
    // Accessing 'organizations' and joining with 'profiles' (users) requires correct foreign key.
    // Assuming 'owner_id' links to 'auth.users' or public 'profiles'.
    // If we can't join easily, we fetch orgs and then map users if needed.
    // For now, fetching orgs is enough.

    const { data: pendingLeagues } = await supabase
        .from('organizations')
        .select('*')
        .eq('status', 'pending_setup')
        .order('created_at', { ascending: false })

    // Optional: Fetch owner emails manually if not joined
    // But usually we need the email to send the notification.
    // 'approveLeagueAction' needs userEmail.
    // Does 'organizations' table have 'owner_email'? Probably not.
    // We need to fetch owner details.

    // Simplified logic: Email is now stored directly in the organization table
    // We only fetch profile name for better display
    const leaguesWithOwners = await Promise.all(
        (pendingLeagues || []).map(async (league) => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', league.owner_id)
                .single()

            return {
                ...league,
                owner_email: league.owner_email || 'Email não salvo',
                owner_name: profile?.name || 'Gestor'
            }
        })
    )

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-green-500">Painel do Super Admin 👑</h1>
                        <p className="text-zinc-400">Gerencie as solicitações de criação de ligas.</p>
                    </div>
                    <div className="text-sm text-zinc-500">
                        Logado como: {user.email}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                        <h2 className="font-semibold">Ligas Pendentes ({leaguesWithOwners.length})</h2>
                    </div>

                    {leaguesWithOwners.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            Nenhuma solicitação pendente no momento.
                        </div>
                    ) : (
                        <AdminList leagues={leaguesWithOwners} />
                    )}
                </div>
            </div>
        </div>
    )
}
