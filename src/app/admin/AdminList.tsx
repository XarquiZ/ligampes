'use client'

import { useState } from 'react'
import { approveLeagueAction } from './actions'
import { toast } from 'sonner'
import { Loader2, CheckCircle, CreditCard } from 'lucide-react'

export default function AdminList({ leagues }: { leagues: any[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleApprove = async (league: any) => {
        if (!confirm(`Confirmar liberação da liga "${league.name}"?`)) return

        setLoadingId(league.id)
        try {
            const result = await approveLeagueAction(
                league.id,
                league.plan,
                league.owner_email,
                league.owner_name,
                league.name,
                league.slug
            )

            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (err) {
            toast.error('Erro desconhecido')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="divide-y divide-zinc-800">
            {leagues.map((league) => (
                <div key={league.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{league.name}</h3>
                            <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">/{league.slug}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                                👤 {league.owner_name} ({league.owner_email})
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${league.plan === 'free' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                {league.plan}
                            </span>
                        </div>
                        <div className="text-xs text-zinc-600">
                            Criado em: {new Date(league.created_at).toLocaleString()}
                        </div>
                    </div>

                    <button
                        onClick={() => handleApprove(league)}
                        disabled={loadingId === league.id}
                        className={`
                            px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all
                            ${loadingId === league.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                            ${league.plan === 'free'
                                ? 'bg-green-500 hover:bg-green-400 text-black'
                                : 'bg-purple-500 hover:bg-purple-400 text-white'
                            }
                        `}
                    >
                        {loadingId === league.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : league.plan === 'free' ? (
                            <><CheckCircle className="w-4 h-4" /> Ativar Grátis</>
                        ) : (
                            <><CreditCard className="w-4 h-4" /> Liberar Pagamento</>
                        )}
                    </button>
                </div>
            ))}
        </div>
    )
}
