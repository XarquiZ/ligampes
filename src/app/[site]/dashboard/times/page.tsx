'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createTeamAction, updateTeamAction, deleteTeamAction } from './actions'
import { toast } from 'sonner'
import { Loader2, Plus, Users, Shield, DollarSign, Image as ImageIcon, Edit2, X, Save, Trash2, Search } from 'lucide-react'
import Image from 'next/image'
import Sidebar from '@/components/Sidebar'

export default function TeamsManagementPage() {
    const params = useParams()
    const router = useRouter()
    const site = params?.site as string
    const { user, loading: authLoading } = useAuth()

    // Auth & Sidebar State
    const [profile, setProfile] = useState<any>(null)
    const [userTeam, setUserTeam] = useState<any>(null)
    const [currentOrg, setCurrentOrg] = useState<any>(null)

    // Page State
    const [loading, setLoading] = useState(false)
    const [teams, setTeams] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        balance: '150.000.000',
        divisao: 'A',
        logo_url: '',
        owner_id: ''
    })
    const [users, setUsers] = useState<any[]>([])

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.divisao?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Load Org and Data
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

                // Load Users (Potential Owners)
                const { data: usersData } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, coach_name, team_id')
                    .eq('organization_id', org.id)

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

    // Load User Profile for Sidebar
    useEffect(() => {
        if (authLoading || !user || !currentOrg) return

        const loadUserProfile = async () => {
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*, teams(*)')
                    .eq('id', user.id)
                    .eq('organization_id', currentOrg.id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                    setUserTeam(profileData.teams)
                }
            } catch (error) {
                console.error('Error loading profile:', error)
            }
        }

        loadUserProfile()
    }, [authLoading, user, currentOrg])

    const handleEdit = (team: any) => {
        setEditingId(team.id)
        setFormData({
            name: team.name,
            balance: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(team.balance),
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

    const handleDelete = async (team: any) => {
        if (!confirm(`Tem certeza que deseja excluir o time "${team.name}"? Esta ação não pode ser desfeita.`)) return

        if (!currentOrg) return

        try {
            const result = await deleteTeamAction(team.id, currentOrg.id, site)
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (err) {
            toast.error('Erro ao excluir time')
        }
    }

    const formatCurrency = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(numbers) / 100)
    }

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, balance: formatCurrency(e.target.value) })
    }

    if (authLoading || !currentOrg) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-zinc-950">
            {user && (
                <Sidebar
                    user={user}
                    profile={profile}
                    team={userTeam}
                    organizationId={currentOrg?.id}
                />
            )}

            <div className="flex-1 transition-all duration-300 lg:ml-0">
                <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-4 lg:p-6 lg:pl-10">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-16 lg:pt-0">
                            <div>
                                <h1 className="text-3xl font-black flex items-center gap-3 text-white">
                                    <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                        <Shield className="w-6 h-6 text-green-500" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                        Gerenciar Times
                                    </span>
                                </h1>
                                <p className="text-zinc-400 mt-1">Adicione e edite os clubes do campeonato {currentOrg?.name}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                            >
                                Voltar
                            </Button>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Form - Left Column */}
                            <Card className="bg-zinc-900/50 border-white/10 h-fit lg:col-span-1 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-2">
                                            {editingId ? <Edit2 className="w-5 h-5 text-yellow-500" /> : <Plus className="w-5 h-5 text-green-500" />}
                                            {editingId ? 'Editar Time' : 'Novo Time'}
                                        </div>
                                        {editingId && (
                                            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-zinc-400 hover:text-white hover:bg-white/10">
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
                                            className="bg-zinc-950 border-white/10 text-white placeholder:text-zinc-700 focus:border-green-500/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Escudo (URL)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://..."
                                                value={formData.logo_url}
                                                onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                                                className="bg-zinc-950 border-white/10 text-white placeholder:text-zinc-700 focus:border-green-500/50"
                                            />
                                            {formData.logo_url && (
                                                <div className="w-10 h-10 relative bg-zinc-800 rounded overflow-hidden flex-shrink-0 border border-white/10">
                                                    <Image src={formData.logo_url} alt="Logo" fill className="object-contain" unoptimized />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">Divisão</Label>
                                            <Select value={formData.divisao} onValueChange={v => setFormData({ ...formData, divisao: v })}>
                                                <SelectTrigger className="bg-zinc-950 border-white/10 text-white focus:ring-green-500/20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
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
                                                className="bg-zinc-950 border-white/10 text-white focus:border-green-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Dono do Time (Usuário)</Label>
                                        <Select value={formData.owner_id} onValueChange={v => setFormData({ ...formData, owner_id: v })}>
                                            <SelectTrigger className="bg-zinc-950 border-white/10 text-white focus:ring-green-500/20">
                                                <SelectValue placeholder="Selecione um usuário..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
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
                                        className={`w-full font-bold text-black border-0 ${editingId
                                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
                                            : 'bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700'}`}
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                        {editingId ? 'Salvar Alterações' : 'Adicionar Time'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* List - Right Column */}
                            <div className="lg:col-span-2 flex flex-col h-[calc(100vh-140px)] gap-4">
                                <div className="flex items-center justify-between shrink-0">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Users className="w-5 h-5 text-purple-400" />
                                        Clubes Cadastrados ({teams.length})
                                    </h2>
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                                        <Input
                                            placeholder="Buscar time..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-purple-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                        {filteredTeams.map(team => (
                                            <Card key={team.id} className="bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 hover:border-white/10 transition-all duration-300 group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <CardContent className="p-3 flex items-center gap-3 relative z-10">
                                                    <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center p-1.5 border border-white/5 shadow-inner shrink-0">
                                                        {team.logo_url ? (
                                                            <div className="relative w-full h-full transform group-hover:scale-110 transition-transform duration-300">
                                                                <Image src={team.logo_url} alt={team.name} fill className="object-contain" unoptimized />
                                                            </div>
                                                        ) : (
                                                            <Shield className="w-5 h-5 text-zinc-700" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold truncate text-white text-sm leading-tight mb-0.5">{team.name}</h3>
                                                        <div className="text-[10px] text-zinc-500 truncate mb-1.5">
                                                            {users.find(u => u.team_id === team.id) ? (
                                                                <span className="text-zinc-400 flex items-center gap-1">
                                                                    <Users className="w-2.5 h-2.5" />
                                                                    {users.find(u => u.team_id === team.id)?.coach_name || users.find(u => u.team_id === team.id)?.full_name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-zinc-600 italic">Sem técnico</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                                            <span className={`px-1.5 py-px rounded font-bold border ${team.divisao === 'A'
                                                                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                                : 'bg-zinc-700/30 text-zinc-400 border-zinc-700/50'
                                                                }`}>
                                                                {team.divisao || 'A'}
                                                            </span>
                                                            <span className="flex items-center gap-0.5 text-emerald-400 font-mono bg-emerald-500/5 px-1.5 py-px rounded border border-emerald-500/10">
                                                                <DollarSign className="w-2.5 h-2.5" />
                                                                {new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(team.balance || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(team)} className="h-6 w-6 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full">
                                                            <Edit2 className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(team)} className="h-6 w-6 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-full">
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {filteredTeams.length === 0 && (
                                            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                                                <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                                <p className="text-zinc-400 font-medium">Nenhum time encontrado</p>
                                                {searchTerm ? (
                                                    <p className="text-zinc-600 text-sm mt-1">Tente buscar por outro nome.</p>
                                                ) : (
                                                    <p className="text-zinc-600 text-sm mt-1">Use o formulário ao lado para adicionar o primeiro clube.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
