import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Clock, Lock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createCheckoutSession } from '@/app/actions/stripe'

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ site: string }>
}) {
    const { site } = await params
    const supabase = await createClient()

    // 1. Check Auth (User must be logged in)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 2. Fetch Organization to check ownership and STATUS
    const { data: organization, error } = await supabase
        .from('organizations')
        .select('id, owner_id, name, slug, status, chosen_plan')
        .eq('slug', site)
        .single()

    if (error || !organization) {
        notFound()
    }

    // 3. Verify Ownership (Strict Guard)
    if (organization.owner_id !== user.id) {
        redirect('/')
    }

    // --- GATEKEEPER LOGIC ---

    // Case 1: Setup in Progress
    if (organization.status === 'pending_setup') {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Estamos preparando seu servidor</h1>
                <p className="text-zinc-400 max-w-md mb-8">
                    A configuração do seu domínio exclusivo está sendo feita manualmente por nossa equipe para garantir segurança máxima.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-w-sm w-full mb-8">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-500">Status</span>
                        <span className="text-yellow-500 font-bold">Configurando...</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Plano Escolhido</span>
                        <span className="text-white font-medium capitalize">{organization.chosen_plan === 'free' ? 'Starter Grátis' : organization.chosen_plan}</span>
                    </div>
                </div>
                <Button asChild variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10">
                    <Link href="https://wa.me/5511948707427?text=Ol%C3%A1%2C%20estou%20aguardando%20a%20configura%C3%A7%C3%A3o%20da%20minha%20liga%20e%20gostaria%20de%20prioridade." target="_blank">
                        Falar com Suporte
                    </Link>
                </Button>
            </div>
        )
    }

    // Case 2: Payment Required (Only for Paid Plans)
    if (organization.status === 'payment_required') {
        const planName = organization.chosen_plan === 'mensal' ? 'Mensal' : 'Anual'
        const price = organization.chosen_plan === 'mensal' ? 'R$ 30,00' : 'R$ 300,00'

        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Sua Liga está pronta!</h1>
                <p className="text-zinc-400 max-w-md mb-8">
                    O ambiente foi configurado com sucesso. Realize o pagamento do plano <strong>{planName}</strong> para liberar o acesso imediato.
                </p>

                <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-6 max-w-sm w-full mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl">
                        AGUARDANDO
                    </div>
                    <p className="text-zinc-500 text-sm mb-1">Total a Pagar</p>
                    <p className="text-3xl font-black text-white mb-4">{price}</p>

                    <form action={async () => {
                        "use server"
                        await createCheckoutSession(organization.id, organization.chosen_plan || 'mensal')
                    }}>
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-zinc-950 font-bold shadow-lg shadow-green-500/20">
                            Pagar Agora e Ativar
                        </Button>
                    </form>
                </div>

                <p className="text-xs text-zinc-500">
                    Ambiente seguro processado pelo Stripe.
                </p>
            </div>
        )
    }

    // Case 3: suspended?
    if (organization.status === 'suspended') {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Conta Suspensa</h1>
                <p className="text-zinc-400 max-w-md mb-8">
                    O acesso a esta liga foi suspenso temporariamente. Entre em contato com o suporte para regularizar.
                </p>
                <Button asChild variant="outline">
                    <Link href="https://wa.me/5511948707427" target="_blank">
                        Contatar Suporte
                    </Link>
                </Button>
            </div>
        )
    }

    // Default Case: Active (Render Dashboard)
    return (
        <div className="flex min-h-screen bg-zinc-950 text-white">
            {/* Sidebar for Desktop */}
            <div className="hidden lg:block w-64 fixed h-full z-20">
                <AdminSidebar slug={site} />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-64 min-h-screen">
                {children}
            </main>
        </div>
    )
}
