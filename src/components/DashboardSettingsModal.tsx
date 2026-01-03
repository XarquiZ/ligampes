'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Settings, Shirt, Users, Trophy, DollarSign, Gavel, ArrowLeftRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    organizationId: string
    onSettingsUpdated?: () => void
}

const AVAILABLE_TILES = [
    {
        key: 'elenco',
        label: 'Meu Elenco',
        description: 'Gerencie os jogadores do seu time, veja estatísticas e ajuste a escalação.',
        icon: Shirt,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        default: true
    },
    {
        key: 'jogadores',
        label: 'Jogadores/Mercado',
        description: 'Visualize todos os jogadores da liga, livres e contratados.',
        icon: Users,
        color: 'text-pink-400',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
        default: true
    },
    {
        key: 'tabela',
        label: 'Tabela do Campeonato',
        description: 'Acompanhe a classificação, pontuação e próximos jogos.',
        icon: Trophy,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        default: true
    },
    {
        key: 'financeiro',
        label: 'Gestão Financeira',
        description: 'Controle o saldo, veja receitas e despesas do clube.',
        icon: DollarSign,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        default: false
    },
    {
        key: 'leilao',
        label: 'Central de Leilões',
        description: 'Participe de leilões para contratar grandes craques.',
        icon: Gavel,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        default: false
    },
    {
        key: 'transferencias',
        label: 'Mercado de Transferências',
        description: 'Negocie jogadores com outros times da liga.',
        icon: ArrowLeftRight,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        default: false
    },
]

export default function DashboardSettingsModal({ isOpen, onClose, organizationId, onSettingsUpdated }: DashboardSettingsModalProps) {
    const [loading, setLoading] = useState(false)
    const [togglingKey, setTogglingKey] = useState<string | null>(null)
    const [tileSettings, setTileSettings] = useState<Record<string, boolean>>({})
    const router = useRouter()

    useEffect(() => {
        if (isOpen && organizationId) {
            loadSettings()
        }
    }, [isOpen, organizationId])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('settings')
                .eq('id', organizationId)
                .single()

            if (error) throw error

            const currentSettings = data?.settings?.dashboard_tiles || {}

            // Merge with defaults
            const mergedSettings: Record<string, boolean> = {}
            AVAILABLE_TILES.forEach(tile => {
                mergedSettings[tile.key] = currentSettings[tile.key] !== undefined ? currentSettings[tile.key] : tile.default
            })

            setTileSettings(mergedSettings)
        } catch (error) {
            console.error('Erro ao carregar configurações:', error)
            toast.error('Erro ao carregar configurações.')
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (key: string, checked: boolean) => {
        // Otimistic update
        setTileSettings(prev => ({ ...prev, [key]: checked }))
        setTogglingKey(key)

        try {
            // Fetch current settings first to be safe
            const { data, error: fetchError } = await supabase
                .from('organizations')
                .select('settings')
                .eq('id', organizationId)
                .single()

            if (fetchError) throw fetchError

            const newSettings = {
                ...data.settings,
                dashboard_tiles: {
                    ...tileSettings, // Current local state
                    [key]: checked   // The new change
                }
            }

            const { error } = await supabase
                .from('organizations')
                .update({ settings: newSettings })
                .eq('id', organizationId)

            if (error) throw error

            // Notify parent/dashboard
            router.refresh()
            if (onSettingsUpdated) onSettingsUpdated()

        } catch (error) {
            console.error('Erro ao salvar configuração:', error)
            toast.error('Erro ao salvar. Tente novamente.')
            // Revert state on error
            setTileSettings(prev => ({ ...prev, [key]: !checked }))
        } finally {
            setTogglingKey(null)
        }
    }

    const handleDone = () => {
        router.refresh()
        if (onSettingsUpdated) onSettingsUpdated()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleDone()}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="w-6 h-6 text-purple-500" />
                        Personalizar Dashboard
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Ative ou desative funcionalidades para personalizar a experiência da sua liga.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : (
                        AVAILABLE_TILES.map((tile) => (
                            <div
                                key={tile.key}
                                className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-300 ${tileSettings[tile.key] ? 'bg-zinc-900/80 border-purple-500/30' : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`p-2.5 rounded-lg ${tile.bg} ${tile.border} border`}>
                                        <tile.icon className={`w-5 h-5 ${tile.color}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`tile-${tile.key}`} className="font-semibold text-base text-zinc-100 cursor-pointer">
                                            {tile.label}
                                        </Label>
                                        <p className="text-sm text-zinc-400 leading-snug max-w-[280px]">
                                            {tile.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-1">
                                    {togglingKey === tile.key && <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />}
                                    <Switch
                                        id={`tile-${tile.key}`}
                                        checked={tileSettings[tile.key]}
                                        onCheckedChange={(checked) => handleToggle(tile.key, checked)}
                                        className="data-[state=checked]:bg-purple-600"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="pt-2 border-t border-zinc-900">
                    <Button onClick={handleDone} className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white">
                        Concluído
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
