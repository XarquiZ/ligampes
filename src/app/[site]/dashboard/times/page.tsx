'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createTeamAction, updateTeamAction } from './actions'
import { toast } from 'sonner'
import { Loader2, Plus, Users, Shield, DollarSign, Image as ImageIcon, Edit2, X, Save } from 'lucide-react'
import Image from 'next/image'

export default function TeamsManagementPage() {
    const params = useParams()
    const router = useRouter()
    const site = params?.site as string
    const [loading, setLoading] = useState(false)
    const [teams, setTeams] = useState<any[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [currentOrg, setCurrentOrg] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        balance: '150.000.000',
        divisao: 'A',
        logo_url: '',
        owner_id: ''
    })
    const [users, setUsers] = useState<any[]>([])

    // Load Org and Teams
    useEffect(() => {
        if (!site) return

        const loadData = async () => {
            const { data: org } = await supabase
                .from('organizations')
                .select('id, name')
                .eq('slug', site)
                .single()

            if (org) {
                setCurrentOrg(org)

                // Load Teams
                const { data: teamsData } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('organization_id', org.id)
                    .order('name')

                setTeams(teamsData || [])

                // Load Users (Potential Owners) - Added missing fetch
                console.log('[Times] Fetching users for org:', org.id)
                const { data: usersData, error: usersError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, coach_name, team_id')
                    .eq('organization_id', org.id)

                if (usersError) {
                    console.error('[Times] Error fetching users:', usersError)
                } else {
                    console.log('[Times] Users fetched:', usersData?.length, usersData)
                }

                setUsers(usersData || [])
            }
        }
        loadData()

        // Subscribe to changes
        const subscription = supabase
            .channel('teams_management')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
                loadData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [site])

    const handleEdit = (team: any) => {
        setEditingId(team.id)
        setFormData({
            name: team.name,
            balance: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(team.balance / 100),
            divisao: team.divisao || 'A',
            logo_url: team.logo_url || '',
            owner_id: ''
        })
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setFormData({
            name: '',
            balance: '150.000.000',
            divisao: 'A',
            logo_url: '',
            owner_id: ''
        })
    }

    const handleSubmit = async () => {
        if (!formData.name) return toast.error('Nome do time é obrigatório')
        if (!currentOrg) return

        setLoading(true)
        const data = new FormData()
        data.append('name', formData.name)
        data.append('balance', formData.balance)
        data.append('divisao', formData.divisao)
        data.append('logo_url', formData.logo_url)
        data.append('organization_id', currentOrg.id)
        data.append('site', site)
        data.append('owner_id', formData.owner_id)

        let result;
        if (editingId) {
            data.append('id', editingId)
            result = await updateTeamAction(data)
        } else {
            result = await createTeamAction(data)
        }

        if (result.success) {
            toast.success(result.message)
            handleCancelEdit() // reset form
        } else {
            toast.error(result.message)
        }
        setLoading(false)
    }

    const formatCurrency = (value: string) => {
        // Simple formatter for display input
        // Allow only numbers
        const numbers = value.replace(/\D/g, '')
        const formatted = new Intl.NumberFormat('pt-BR').format(Number(numbers))
        return formatted
    }

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, balance: formatCurrency(e.target.value) })
    }

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen bg-zinc-950 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="w-8 h-8 text-green-500" />
                        Gerenciar Times
                    </h1>
                    <p className="text-zinc-400">Adicione e edite os clubes do campeonato {currentOrg?.name}</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Form - Left Column */}
                <Card className="bg-zinc-900 border-zinc-800 h-fit md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {editingId ? <Edit2 className="w-5 h-5 text-yellow-500" /> : <Plus className="w-5 h-5 text-green-500" />}
                                {editingId ? 'Editar Time' : 'Novo Time'}
                            </div>
                            {editingId && (
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Nome do Clube</Label>
                            <Input
                                placeholder="Ex: Flamengo"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-400">Escudo (URL)</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://..."
                                    value={formData.logo_url}
                                    onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                                />
                                {formData.logo_url && (
                                    <div className="w-10 h-10 relative bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                        <Image src={formData.logo_url} alt="Logo" fill className="object-contain" unoptimized />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400">Divisão</Label>
                                <Select value={formData.divisao} onValueChange={v => setFormData({ ...formData, divisao: v })}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">Série A</SelectItem>
                                        <SelectItem value="B">Série B</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400">Saldo Inicial (R$)</Label>
                                <Input
                                    value={formData.balance}
                                    onChange={handleBalanceChange}
                                    className="bg-zinc-950 border-zinc-800 text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-400">Dono do Time (Usuário)</Label>
                            <Select value={formData.owner_id} onValueChange={v => setFormData({ ...formData, owner_id: v })}>
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                                    <SelectValue placeholder="Selecione um usuário..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Sem Dono --</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.coach_name || u.full_name || u.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className={`w-full font-bold text-black ${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                            {editingId ? 'Salvar Alterações' : 'Adicionar Time'}
                        </Button>
                    </CardContent>
                </Card>

                {/* List - Right Column */}
                <div className="md:col-span-2 grid gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Clubes Cadastrados ({teams.length})
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map(team => (
                            <Card key={team.id} className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center p-1 border border-zinc-800">
                                        {team.logo_url ? (
                                            <div className="relative w-full h-full">
                                                <Image src={team.logo_url} alt={team.name} fill className="object-contain" unoptimized />
                                            </div>
                                        ) : (
                                            <Shield className="w-6 h-6 text-zinc-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold truncate text-white mb-0.5">{team.name}</h3>
                                        <div className="text-xs text-zinc-500 truncate mb-1.5">
                                            {users.find(u => u.team_id === team.id) ? (
                                                <span className="text-zinc-400 flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {users.find(u => u.team_id === team.id)?.coach_name || users.find(u => u.team_id === team.id)?.full_name}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600 italic">Sem técnico</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <span className="bg-zinc-800 px-1.5 rounded text-white font-medium">Série {team.divisao || 'A'}</span>
                                            <span className="flex items-center gap-0.5 text-emerald-400 font-mono">
                                                <DollarSign className="w-3 h-3" />
                                                {new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(team.balance || 0)}
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(team)} className="text-zinc-400 hover:text-white">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {teams.length === 0 && (
                            <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                                Nenhum time cadastrado ainda. Use o formulário ao lado.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
