'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft,
    Calendar,
    Trophy,
    TrendingUp,
    Shirt,
    Activity,
    ArrowRightLeft,
    Star,
    Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Sidebar from '@/components/Sidebar'
import ChatPopup from '@/components/Chatpopup'
import FloatingChatButton from '@/components/FloatingChatButton'
import { TEAM_COLORS, DEFAULT_TEAM_COLOR } from '@/utils/teamColors'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Interfaces baseadas no schema fornecido
interface PlayerProfile {
    id: string
    name: string
    position: string
    team_id: string
    overall: number
    photo_url: string | null
    nationality: string
    age: number
    preferred_foot: string
    height: number
    total_goals: number
    total_assists: number
    total_matches: number
    average_rating: number
    // Atributos físicos e técnicos
    speed: number
    acceleration: number
    finishing: number
    low_pass: number
    dribbling: number
    stamina: number
    // Novos atributos granulares
    offensive_talent?: number
    place_kicking?: number
    heading?: number
    curl?: number
    kicking_power?: number
    lofted_pass?: number
    ball_control?: number
    tight_possession?: number
    balance?: number
    defensive_awareness?: number
    ball_winning?: number
    aggression?: number
    jump?: number
    physical_contact?: number
    gk_awareness?: number
    gk_catching?: number
    gk_clearing?: number
    gk_reflexes?: number
    gk_reach?: number
    team?: {
        id: string
        name: string
        logo_url: string | null
    }
    titles?: string[] | null
    individual_titles?: string[] | null
}

interface MatchHistory {
    id: string
    match_id: string
    goals: number
    assists: number
    rating: number
    yellow_cards: number
    red_cards: number
    match: {
        id: string
        date: string
        round: number
        divisao: string
        home_team_id: string
        away_team_id: string
        home_score: number
        away_score: number
        status: string
        time_casa: { name: string; logo_url: string | null }
        time_fora: { name: string; logo_url: string | null }
    }
}

interface TransferHistory {
    id: string
    date: string
    value: number
    transfer_type: string
    from_team?: { name: string; logo_url: string | null }
    to_team?: { name: string; logo_url: string | null }
}

interface UpcomingMatch {
    id: string
    date: string
    time: string
    round: number
    divisao: string
    home_team_id: string
    away_team_id: string
    time_casa: { name: string; logo_url: string | null }
    time_fora: { name: string; logo_url: string | null }
}

export default function PlayerProfilePage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [player, setPlayer] = useState<PlayerProfile | null>(null)
    const [matches, setMatches] = useState<MatchHistory[]>([])
    const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
    const [transfers, setTransfers] = useState<TransferHistory[]>([])

    // Estados para Layout e Chat
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [userTeam, setUserTeam] = useState<any>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)


    useEffect(() => {
        const fetchUserAndPlayer = async () => {
            setLoading(true)
            try {
                // 1. Buscar Sessão do Usuário
                const { data: { user } } = await supabase.auth.getUser()
                setCurrentUser(user)

                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*, teams(*)')
                        .eq('id', user.id)
                        .single()

                    if (profile) {
                        setUserProfile(profile)
                        setUserTeam(profile.teams)
                    }
                }

                if (!params.id) return

                // 2. Buscar dados do jogador
                const { data: playerData, error: playerError } = await supabase
                    .from('players')
                    .select(`
            *,
            team:teams(id, name, logo_url)
          `)
                    .eq('id', params.id)
                    .single()

                if (playerError) throw playerError
                setPlayer(playerData)

                // 2. Buscar histórico de partidas
                const { data: matchesData, error: matchesError } = await supabase
                    .from('player_match_stats')
                    .select(`
            *,
            match:matches(
              id, date, round, divisao, home_team_id, away_team_id, 
              home_score, away_score, status,
              time_casa:home_team_id(name, logo_url),
              time_fora:away_team_id(name, logo_url)
            )
          `)
                    .eq('player_id', params.id)
                    .order('match(date)', { ascending: false })
                // Nota: precisaremos ordenar no cliente pois order em tabela relacionada é complexo no supabase client simples

                if (!matchesError && matchesData) {
                    // Filtrar apenas partidas finalizadas e ordenar por data
                    const sortedMatches = matchesData
                        .filter(m => m.match && m.match.status === 'finished')
                        .sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime())
                    setMatches(sortedMatches)
                }

                // 2b. Próximas Partidas (NOVO)
                if (playerData.team_id) {
                    const { data: upcomingData, error: upcomingError } = await supabase
                        .from('matches')
                        .select(`
                            id, date, time, round, divisao, home_team_id, away_team_id,
                            time_casa:home_team_id(name, logo_url),
                            time_fora:away_team_id(name, logo_url)
                        `)
                        .or(`home_team_id.eq.${playerData.team_id},away_team_id.eq.${playerData.team_id}`)
                        .eq('status', 'scheduled')
                        .order('date', { ascending: true })
                        .limit(5)

                    if (!upcomingError && upcomingData) {
                        const formattedUpcoming = upcomingData.map(m => ({
                            ...m,
                            time_casa: Array.isArray(m.time_casa) ? m.time_casa[0] : m.time_casa,
                            time_fora: Array.isArray(m.time_fora) ? m.time_fora[0] : m.time_fora
                        }))
                        setUpcomingMatches(formattedUpcoming as any)
                    }
                }

                // 3. Buscar histórico de transferências (Incluindo trocas onde o jogador foi incluído)
                const { data: transfersData, error: transfersError } = await supabase
                    .from('player_transfers')
                    .select(`
            id, created_at, value, transfer_type, from_team_id, to_team_id, player_id, exchange_players,
            from_team:from_team_id(id, name, logo_url),
            to_team:to_team_id(id, name, logo_url)
          `)
                    .or(`player_id.eq.${params.id},exchange_players.cs.{${params.id}}`)
                    .neq('status', 'rejected') // Mostrar apenas aprovadas/pendentes ou concluídas
                    .order('created_at', { ascending: false })

                if (!transfersError && transfersData) {
                    const formattedTransfers = transfersData.map(t => {
                        // Verifica se este registro é do jogador principal ou se ele foi parte de uma troca (está no array exchange_players)
                        const isMainPlayer = t.player_id === params.id

                        // Se for o jogador principal, o fluxo é: From -> To
                        // Se for jogador de troca, o fluxo é INVERSO: To -> From (pois ele está indo do time de destino do principal para o time de origem)
                        // MAS CUIDADO: Em uma troca, o `from_team` é quem VENDE o player principal. O `to_team` é quem COMPRA.
                        // O jogador da troca sai do `to_team` (comprador) e vai para o `from_team` (vendedor).

                        let teamFrom = Array.isArray(t.from_team) ? t.from_team[0] : t.from_team
                        let teamTo = Array.isArray(t.to_team) ? t.to_team[0] : t.to_team

                        if (!isMainPlayer) {
                            // Inverter direção para jogador de troca
                            const temp = teamFrom
                            teamFrom = teamTo
                            teamTo = temp
                        }

                        return {
                            id: t.id,
                            date: t.created_at,
                            value: t.value,
                            transfer_type: t.transfer_type,
                            from_team: teamFrom,
                            to_team: teamTo,
                            is_swap: !isMainPlayer // Flag útil para UI se quisermos destacar
                        }
                    })
                    setTransfers(formattedTransfers)
                }

            } catch (error) {
                console.error('Erro ao carregar perfil:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserAndPlayer()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full"></div>
                    <div className="h-4 w-32 bg-zinc-800 rounded"></div>
                </div>
            </div>
        )
    }

    if (!player) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-4">
                <h1 className="text-2xl font-bold">Jogador não encontrado</h1>
                <Button onClick={() => router.back()}>Voltar</Button>
            </div>
        )
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 8.0) return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
        if (rating >= 7.0) return 'bg-green-500/20 text-green-400 border-green-500/50'
        if (rating >= 6.0) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
        return 'bg-red-500/20 text-red-400 border-red-500/50'
    }

    const teamColors = player.team_id && TEAM_COLORS[player.team_id]
        ? TEAM_COLORS[player.team_id]
        : DEFAULT_TEAM_COLOR

    return (
        <div className="flex bg-zinc-950 min-h-screen">
            {/* Sidebar */}
            {currentUser && (
                <Sidebar
                    user={currentUser}
                    profile={userProfile}
                    team={userTeam}
                />
            )}

            <main className="flex-1 min-w-0 bg-zinc-950 relative">
                {/* Header com gradiente dinâmico e Logo do Time */}
                <div
                    className="relative w-full h-64 transition-all duration-500"
                    style={{
                        background: `linear-gradient(to bottom, ${teamColors.primary}, ${teamColors.secondary}20 90%, #09090b 100%)`,
                    }}
                >
                    <div className="absolute inset-0 bg-black/20" /> {/* Overlay para legibilidade */}

                    {/* Logo Gigante no fundo (efeito marca d'água) */}
                    {player.team?.logo_url && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-5 pointer-events-none blur-sm">
                            <img src={player.team.logo_url} className="w-full h-full object-contain grayscale" />
                        </div>
                    )}

                    {/* Logo do time no header (canto superior direito -> agora CENTRALIZADO) */}
                    {player.team?.logo_url && (
                        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-fade-in z-0">
                            <img
                                src={player.team.logo_url}
                                alt={player.team.name}
                                className="h-48 w-48 object-contain drop-shadow-2xl opacity-100 transition-opacity"
                            />
                        </div>
                    )}
                </div>

                <div className="container mx-auto px-4 -mt-20 pb-20 relative z-10">
                    {/* Container Principal Flex */}
                    <div className="flex flex-col md:flex-row gap-8 items-start relative">

                        {/* Coluna Esquerda: Card Principal Fixo/Sticky */}
                        <aside className="w-full md:w-auto md:sticky md:top-6 self-start z-50 shrink-0">
                            <div className="flex flex-col items-center md:items-start">
                                <div className="relative group">
                                    <div className="w-40 h-40 rounded-full border-4 border-zinc-950 bg-zinc-800 overflow-hidden shadow-2xl relative">
                                        {player.photo_url ? (
                                            <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-600">
                                                {player.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <Badge className="absolute bottom-2 right-2 px-3 py-1 bg-yellow-600 text-white border-none text-lg font-bold shadow-lg">
                                        {player.overall}
                                    </Badge>
                                </div>

                                <div className="mt-4 text-center md:text-left w-full">
                                    <h1 className="text-3xl font-bold text-white mb-2">{player.name}</h1>
                                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-zinc-400">
                                        <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800">
                                            <Shirt className="w-4 h-4" />
                                            <span>{player.position}</span>
                                        </div>
                                        {player.team && (
                                            <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800">
                                                {player.team.logo_url && <img src={player.team.logo_url} className="w-4 h-4 object-contain" />}
                                                <span>{player.team.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Coluna Direita: Todo o conteúdo de Stats e Tabelas */}
                        <div className="flex-1 w-full space-y-12 mt-4 md:mt-20 min-w-0">

                            {/* Stats Rápidos */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Jogos', value: player.total_matches, icon: Calendar, color: 'text-blue-400' },
                                    { label: 'Gols', value: player.total_goals, icon: Activity, color: 'text-green-400' },
                                    { label: 'Assist.', value: player.total_assists, icon: TrendingUp, color: 'text-yellow-400' },
                                    { label: 'Nota Média', value: Number(player.average_rating || 0).toFixed(2), icon: Star, color: 'text-purple-400' },
                                ].map((stat, i) => (
                                    <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors backdrop-blur-sm">
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                                            <span className="text-2xl font-bold text-white">{stat.value}</span>
                                            <span className="text-xs text-zinc-500 uppercase font-bold">{stat.label}</span>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Grid do Conteúdo Principal (Matches + Details) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Coluna Esquerda (da grid interna): Histórico de Partidas */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-5 h-5" style={{ color: teamColors.primary }} />
                                        <h2 className="text-xl font-bold text-zinc-200">Partidas Recentes</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {matches.map((matchData) => {
                                            const isHome = matchData.match.home_team_id === player.team_id
                                            const opponent = isHome ? matchData.match.time_fora : matchData.match.time_casa
                                            const myScore = isHome ? matchData.match.home_score : matchData.match.away_score
                                            const oppScore = isHome ? matchData.match.away_score : matchData.match.home_score

                                            const result = myScore > oppScore ? 'V' : myScore === oppScore ? 'E' : 'D'
                                            const resultColor = result === 'V' ? 'bg-green-500' : result === 'E' ? 'bg-zinc-500' : 'bg-red-500'

                                            return (
                                                <div key={matchData.id} className="group flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-all">
                                                    {/* Data e Resultado */}
                                                    <div className="flex flex-col items-center min-w-[60px] gap-2">
                                                        <span className="text-xs text-zinc-500">{format(new Date(matchData.match.date), 'dd/MM')}</span>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${resultColor}`}>
                                                            {result}
                                                        </div>
                                                    </div>

                                                    {/* Placar e Oponente */}
                                                    <div className="flex-1 flex items-center gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-zinc-500 uppercase">Rodada {matchData.match.round}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-white">{myScore} - {oppScore}</span>
                                                                <span className="text-sm text-zinc-400">vs</span>
                                                                <div className="flex items-center gap-2">
                                                                    {opponent?.logo_url ? (
                                                                        <img src={opponent.logo_url} alt={opponent.name} className="w-5 h-5 object-contain" />
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full bg-zinc-700"></div>
                                                                    )}
                                                                    <span className="text-sm font-medium text-zinc-300">{opponent?.name || 'Desconhecido'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Stats da Partida */}
                                                    <div className="flex items-center gap-4">
                                                        {(matchData.goals > 0) && (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-green-500 font-bold">{matchData.goals}</span>
                                                                <span className="text-[10px] text-zinc-500">Gols</span>
                                                            </div>
                                                        )}
                                                        {(matchData.assists > 0) && (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-blue-500 font-bold">{matchData.assists}</span>
                                                                <span className="text-[10px] text-zinc-500">Assis</span>
                                                            </div>
                                                        )}
                                                        <div className={`px-3 py-1 rounded-lg border font-bold text-sm ${getRatingColor(Number(matchData.rating))}`}>
                                                            {Number(matchData.rating).toFixed(1)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {matches.length === 0 && (
                                            <div className="p-8 text-center text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800 border-dashed">
                                                Nenhuma partida registrada recentemente.
                                            </div>
                                        )}
                                    </div>

                                    {/* Próximas Partidas */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calendar className="w-5 h-5 text-zinc-400" />
                                            <h2 className="text-xl font-bold text-zinc-200">Próximas Partidas</h2>
                                        </div>

                                        <div className="space-y-4">
                                            {upcomingMatches.map((match) => {
                                                const isHome = match.home_team_id === player.team_id

                                                // Fallback para data se for inválida
                                                let dateDisplay = '--/--';
                                                try {
                                                    dateDisplay = format(new Date(match.date), 'dd/MM', { locale: ptBR });
                                                } catch (e) { }

                                                return (
                                                    <div key={match.id} className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-all">
                                                        {/* Data e Hora */}
                                                        <div className="flex flex-col items-center min-w-[60px] gap-1">
                                                            <span className="text-sm font-bold text-zinc-300">{dateDisplay}</span>
                                                            <span className="text-xs text-zinc-500">{match.time ? match.time.substring(0, 5) : '--:--'}</span>
                                                        </div>

                                                        {/* Informações do Jogo */}
                                                        <div className="flex-1 flex items-center justify-between gap-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-zinc-500 uppercase font-bold">Rodada {match.round}</span>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    {/* Time Casa */}
                                                                    <div className="flex items-center gap-2">
                                                                        {match.time_casa?.logo_url ? (
                                                                            <img src={match.time_casa.logo_url} className="w-6 h-6 object-contain" title={match.time_casa.name} />
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-full bg-zinc-700"></div>
                                                                        )}
                                                                        <span className={`text-sm font-bold ${match.home_team_id === player.team_id ? 'text-white' : 'text-zinc-400'}`}>
                                                                            {match.time_casa?.name || 'Time Casa'}
                                                                        </span>
                                                                    </div>

                                                                    <span className="text-xs text-zinc-600 font-bold">VS</span>

                                                                    {/* Time Fora */}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-sm font-bold ${match.away_team_id === player.team_id ? 'text-white' : 'text-zinc-400'}`}>
                                                                            {match.time_fora?.name || 'Time Fora'}
                                                                        </span>
                                                                        {match.time_fora?.logo_url ? (
                                                                            <img src={match.time_fora.logo_url} className="w-6 h-6 object-contain" title={match.time_fora.name} />
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-full bg-zinc-700"></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                                                                {isHome ? 'Em Casa' : 'Fora'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                            {upcomingMatches.length === 0 && (
                                                <div className="p-8 text-center text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800 border-dashed">
                                                    Nenhuma partida futura agendada.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna Direita (da grid interna): Detalhes e Transferências */}
                                <div className="space-y-8">

                                    {/* Detalhes do Jogador (Atributos) */}
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                                <Activity className="w-4 h-4" style={{ color: teamColors.accent }} />
                                                Atributos
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {(() => {
                                                const isGK = player.position === 'GO' || player.position === 'GK';

                                                const getAvg = (...values: (number | undefined)[]) => {
                                                    const validValues = values.filter(v => typeof v === 'number');
                                                    if (validValues.length === 0) return 0;
                                                    const sum = validValues.reduce((a, b) => a + (b as number), 0);
                                                    return Math.round(sum / validValues.length);
                                                };

                                                const attributes = isGK ? [
                                                    { label: 'Talento', value: player.gk_awareness || 0 },
                                                    { label: 'Firmeza', value: player.gk_catching || 0 },
                                                    { label: 'Afastamento', value: player.gk_clearing || 0 },
                                                    { label: 'Reflexos', value: player.gk_reflexes || 0 },
                                                    { label: 'Alcance', value: player.gk_reach || 0 }
                                                ] : [
                                                    { label: 'VEL', value: getAvg(player.speed, player.acceleration) },
                                                    { label: 'FIN', value: getAvg(player.offensive_talent, player.finishing, player.place_kicking, player.heading, player.curl, player.kicking_power) },
                                                    { label: 'PAS', value: getAvg(player.low_pass, player.lofted_pass) },
                                                    { label: 'DRI', value: getAvg(player.ball_control, player.dribbling, player.tight_possession, player.balance) },
                                                    { label: 'DEF', value: getAvg(player.defensive_awareness, player.ball_winning, player.aggression) },
                                                    { label: 'FIS', value: getAvg(player.jump, player.physical_contact, player.stamina) }
                                                ];

                                                return attributes.map((attr) => (
                                                    <div key={attr.label} className="flex items-center gap-3">
                                                        <span className="text-sm text-zinc-400 w-24 font-bold">{attr.label}</span>
                                                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${Math.min(100, (attr.value / 99) * 100)}%`,
                                                                    backgroundColor: teamColors.primary
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold text-white w-8 text-right">{attr.value}</span>
                                                    </div>
                                                ));
                                            })()}
                                        </CardContent>
                                    </Card>

                                    {/* Seção de Prêmios Individuais */}
                                    {player.individual_titles && player.individual_titles.length > 0 && (
                                        <Card className="bg-zinc-900/50 border-zinc-800">
                                            <CardHeader>
                                                <CardTitle className="text-lg text-white flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-purple-400" />
                                                    Prêmios Individuais
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {player.individual_titles.map((title, i) => (
                                                        <div key={i} className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
                                                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                                <Star className="w-4 h-4 text-purple-500" />
                                                            </div>
                                                            <span className="text-sm font-medium text-zinc-200">{title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Seção de Títulos Coletivos */}
                                    {player.titles && player.titles.length > 0 && (
                                        <Card className="bg-zinc-900/50 border-zinc-800">
                                            <CardHeader>
                                                <CardTitle className="text-lg text-white flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                                    Títulos
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {player.titles.map((title, i) => (
                                                        <div key={i} className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
                                                            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                                                <Trophy className="w-4 h-4 text-yellow-500" />
                                                            </div>
                                                            <span className="text-sm font-medium text-zinc-200">{title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}


                                    {/* Histórico de Clubes */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="w-5 h-5 text-zinc-400" />
                                            <h2 className="text-xl font-bold text-zinc-200">Histórico de Clubes</h2>
                                        </div>

                                        <div className="space-y-2">
                                            {/* Lógica para reconstruir histórico */}
                                            {(() => {
                                                const historyItems: {
                                                    id: string,
                                                    name: string,
                                                    logo_url: string | null,
                                                    type: 'current' | 'past',
                                                    period: string
                                                }[] = [];

                                                // Set para evitar duplicatas, usando ID do time
                                                const processedTeamIds = new Set<string>();

                                                // 1. Time Atual
                                                if (player.team) {
                                                    historyItems.push({
                                                        id: player.team.id,
                                                        name: player.team.name,
                                                        logo_url: player.team.logo_url,
                                                        type: 'current',
                                                        period: 'Atual'
                                                    });
                                                    processedTeamIds.add(player.team.id);
                                                }

                                                // 2. Iterar sobre transferências para encontrar times passados
                                                // Ordenamos cronologicamente (mais recente primeiro)
                                                // Se o jogador foi transferido DE um time, ele jogou lá.
                                                // Se foi transferido PARA um time (que não é o atual), ele jogou lá.
                                                transfers.forEach(t => {
                                                    // Time anterior (from_team)
                                                    const pastTeam = t.from_team;
                                                    if (pastTeam && pastTeam.id && !processedTeamIds.has(pastTeam.id)) {
                                                        historyItems.push({
                                                            id: pastTeam.id, // Assumindo que o objeto retornado pelo select tem ID, se não tiver, ajustaremos o select
                                                            name: pastTeam.name,
                                                            logo_url: pastTeam.logo_url,
                                                            type: 'past',
                                                            period: format(new Date(t.date), 'yyyy')
                                                        });
                                                        processedTeamIds.add(pastTeam.id);
                                                    }
                                                });

                                                // Se após varrer tudo só tiver 1 item e ele é 'current', ok.
                                                // Se não tiver item nenhum (jogador sem time), mostra msg.

                                                if (historyItems.length === 0) {
                                                    return <div className="text-zinc-500 text-sm">Nenhum histórico registrado.</div>;
                                                }

                                                return historyItems.map((item, i) => (
                                                    <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${item.type === 'current' ? 'bg-zinc-900/60 border-zinc-700' : 'bg-zinc-900/40 border-zinc-800 opacity-70'}`}>
                                                        <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden">
                                                            {item.logo_url ? (
                                                                <img src={item.logo_url} alt={item.name} className="w-6 h-6 object-contain" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-zinc-500">{item.name?.substring(0, 2) || '?'}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${item.type === 'current' ? 'text-white' : 'text-zinc-300'}`}>{item.name}</p>
                                                            <p className={`text-xs ${item.type === 'current' ? 'text-green-400 font-medium' : 'text-zinc-500'}`}>
                                                                {item.type === 'current' ? 'Clube Atual' : `Jogou em ${item.period}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    {/* Histórico de Transferências (Detalhado) */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                                            <h2 className="text-xl font-bold text-zinc-200">Transferências</h2>
                                        </div>
                                        <div className="relative border-l border-zinc-800 ml-3 space-y-6 pb-2">
                                            {transfers.map((transfer, index) => (
                                                <div key={transfer.id} className="relative pl-6">
                                                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-zinc-950"></div>
                                                    <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
                                                        <div className="text-xs text-zinc-500 mb-1">
                                                            {format(new Date(transfer.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                                        </div>

                                                        {/* Linha visual da transferência: Time A -> Time B */}
                                                        <div className="flex items-center justify-between gap-2 mb-3 bg-zinc-950/50 p-2 rounded-lg">
                                                            {/* Origem */}
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <div className="w-8 h-8 flex-shrink-0 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700">
                                                                    {transfer.from_team?.logo_url ? (
                                                                        <img src={transfer.from_team.logo_url} className="w-5 h-5 object-contain" title={transfer.from_team.name} />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
                                                                            {transfer.from_team ? transfer.from_team.name.substring(0, 1) : '-'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm text-zinc-300 truncate">{transfer.from_team ? transfer.from_team.name : 'Sem Clube'}</span>
                                                            </div>

                                                            <ArrowRightLeft className="w-4 h-4 text-zinc-500 flex-shrink-0 mx-2" />

                                                            {/* Destino */}
                                                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                                                <span className="text-sm text-zinc-300 truncate text-right">{transfer.to_team ? transfer.to_team.name : 'Sem Clube'}</span>
                                                                <div className="w-8 h-8 flex-shrink-0 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700">
                                                                    {transfer.to_team?.logo_url ? (
                                                                        <img src={transfer.to_team.logo_url} className="w-5 h-5 object-contain" title={transfer.to_team.name} />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
                                                                            {transfer.to_team ? transfer.to_team.name.substring(0, 1) : '-'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400 border-zinc-700">
                                                                {transfer.transfer_type === 'exchange' ? 'Troca' :

                                                                    transfer.transfer_type === 'loan' ? 'Empréstimo' : 'Compra'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {transfers.length === 0 && (
                                                <div className="pl-6 text-sm text-zinc-500">Nenhuma transferência registrada.</div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main >

            {currentUser && userTeam && (
                <>
                    <FloatingChatButton
                        currentUser={{
                            id: currentUser.id,
                            name: userProfile?.coach_name || currentUser.email,
                            email: currentUser.email
                        }}
                        currentTeam={{
                            id: userTeam.id,
                            name: userTeam.name,
                            logo_url: userTeam.logo_url
                        }}
                        unreadCount={unreadCount}
                        onOpenChat={() => setIsChatOpen(true)}
                        onUnreadCountChange={setUnreadCount}
                    />

                    <ChatPopup
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        currentUser={{
                            id: currentUser.id,
                            name: userProfile?.coach_name || currentUser.email,
                            email: currentUser.email
                        }}
                        currentTeam={{
                            id: userTeam.id,
                            name: userTeam.name,
                            logo_url: userTeam.logo_url
                        }}
                        onUnreadCountChange={setUnreadCount}
                    />
                </>
            )
            }
        </div >
    )
}
