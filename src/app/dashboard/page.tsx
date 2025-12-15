// src/app/dashboard/page.tsx - VERSÃO COMPLETA ATUALIZADA COM TABELA
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DollarSign, Shirt, Calendar, Crown, ArrowRight, ArrowLeftRight,
  Users, ChevronDown, ChevronUp, Edit, TrendingUp, TrendingDown,
  Building2, Target, Footprints, Clock, AlertTriangle, X,
  Trophy, BarChart2, CalendarDays
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'
import Sidebar from '@/components/Sidebar'

// Definir tipos para user e team
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  balance?: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  overall: number;
  team_id: string | null;
}

interface LeagueTable {
  id: string;
  team_id: string;
  team_name: string;
  position: number;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

interface MatchSchedule {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  date: string;
  time: string;
  stadium: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  home_score?: number;
  away_score?: number;
}

interface TeamStats {
  team_id: string;
  team_name: string;
  form: string;
  next_match: string;
  last_5_matches: string[];
}

function formatBalance(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatTime(timeString: string): string {
  return timeString;
}

// Componente Modal para avisos
function WarningModal({ isOpen, onClose, type }: {
  isOpen: boolean;
  onClose: () => void;
  type: 'below' | 'above' | null;
}) {
  if (!isOpen || !type) return null;

  const messages = {
    below: {
      title: 'ELENCO INSUFICIENTE',
      message: 'Você está abaixo da quantidade mínima de jogadores (18), caso não se regularize até o fim da janela, o clube será punido em 20M (3 pts na liga caso falta de saldo)'
    },
    above: {
      title: 'ELENCO EXCEDENTE',
      message: 'Você está acima da quantidade máxima de jogadores (28), dispense ou venda, caso não se regularize até o fim da janela, o clube será punido em 20M (3 pts na liga caso falta de saldo)'
    }
  };

  const currentMessage = messages[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Cabeçalho do Modal */}
          <div className="bg-gradient-to-r from-red-600/30 to-orange-600/30 p-6 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-2 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{currentMessage.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corpo do Modal */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <p className="text-red-300 text-sm leading-relaxed">
                  {currentMessage.message}
                </p>
              </div>

              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Recomendações:
                </h4>
                <ul className="space-y-2 text-zinc-300 text-sm">
                  {type === 'below' ? (
                    <>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Contrate jogadores livres no mercado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Participe dos leilões disponíveis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Negocie transferências com outros times</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Dispense jogadores do seu elenco</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Venda jogadores no mercado de transferências</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Negocie trocas com outros times</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="text-center text-zinc-400 text-xs">
                A janela de transferências fecha em: 31/12/2024
              </div>
            </div>
          </div>

          {/* Rodapé do Modal */}
          <div className="p-6 border-t border-zinc-800">
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
              >
                Entendi
              </Button>
              <Link href="/dashboard/elenco" onClick={onClose} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white">
                  Ver Elenco
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [expandedTile, setExpandedTile] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newCoachName, setNewCoachName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [playerCountWarning, setPlayerCountWarning] = useState<{
    show: boolean;
    type: 'below' | 'above' | null;
    message: string;
  }>({
    show: false,
    type: null,
    message: ''
  })
  const [warningModalOpen, setWarningModalOpen] = useState(false)

  // Novos estados para dados reais
  const [balanceTransactions, setBalanceTransactions] = useState<any[]>([])
  const [playersStats, setPlayersStats] = useState({
    totalPlayers: 0,
    freePlayers: 0,
    contractedPlayers: 0,
    ratingDistribution: {
      '75+': 0,
      '80+': 0, 
      '85+': 0,
      '90+': 0
    }
  })
  const [activeAuctions, setActiveAuctions] = useState<any[]>([])
  const [pendingTransfers, setPendingTransfers] = useState(0)
  const [completedTransfers, setCompletedTransfers] = useState(0)

  // Estados para o tile TABELA
  const [leagueTable, setLeagueTable] = useState<LeagueTable[]>([])
  const [matchSchedule, setMatchSchedule] = useState<MatchSchedule[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [teamPosition, setTeamPosition] = useState<number | null>(null)

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  // Carrega dados profile/team
  useEffect(() => {
    if (authLoading || !user) return

    const loadUserData = async () => {
      try {
        console.log('[Dashboard] Carregando dados do usuário...')
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.log('[Dashboard] Criando novo profile...')

          const isAdmin = user.email === 'wellinton.sbatista@gmail.com'
          const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Técnico'

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.email,
              coach_name: defaultName,
              role: isAdmin ? 'admin' : 'coach',
            })
            .select('*, teams(*)')
            .single()

          if (createError) {
            console.error('[Dashboard] Erro ao criar profile:', createError)
          } else {
            setProfile(newProfile)
            setTeam(newProfile?.teams || null)
            setNewCoachName(newProfile?.coach_name || defaultName)
            
            // Carregar jogadores do time
            if (newProfile?.teams?.id) {
              loadTeamPlayers(newProfile.teams.id)
            }
          }
        } else {
          setProfile(profileData)
          setTeam(profileData?.teams || null)
          setNewCoachName(profileData?.coach_name || '')
          
          // Carregar jogadores do time
          if (profileData?.teams?.id) {
            loadTeamPlayers(profileData.teams.id)
          }
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao carregar dados:', error)
      } finally {
        setDataLoading(false)
      }
    }

    const loadTeamPlayers = async (teamId: string) => {
      try {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, name, position, overall, team_id')
          .eq('team_id', teamId)

        if (!playersError) {
          setPlayers(playersData || [])
          
          // Verificar contagem de jogadores
          const playerCount = playersData?.length || 0
          if (playerCount < 18) {
            setPlayerCountWarning({
              show: true,
              type: 'below',
              message: 'Você está abaixo da quantidade mínima de jogadores (18), caso não se regularize até o fim da janela, o clube será punido em 20M (3 pts na liga caso falta de saldo)'
            })
          } else if (playerCount > 28) {
            setPlayerCountWarning({
              show: true,
              type: 'above',
              message: 'Você está acima da quantidade máxima de jogadores (28), dispense ou venda, caso não se regularize até o fim da janela, o clube será punido em 20M (3 pts na liga caso falta de saldo)'
            })
          } else {
            setPlayerCountWarning({
              show: false,
              type: null,
              message: ''
            })
          }
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao carregar jogadores:', error)
      }
    }

    loadUserData()
  }, [authLoading, user])

  // Carregar dados reais do banco
  useEffect(() => {
    if (team?.id) {
      loadBalanceTransactions()
      loadPlayersStats()
      loadActiveAuctions()
      loadPendingTransfers()
      loadCompletedTransfers()
      loadLeagueTable()
      loadMatchSchedule()
      loadTeamStatistics()
    }
  }, [team?.id])

  // Função para carregar transações de saldo REAIS
  const loadBalanceTransactions = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('team_id', team?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error) {
        setBalanceTransactions(transactions || [])
      } else {
        console.error('Erro ao carregar transações:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  // Função para carregar estatísticas REAIS dos jogadores
  const loadPlayersStats = async () => {
    try {
      // Total de jogadores
      const { count: totalPlayers, error: totalError } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })

      if (totalError) console.error('Erro total players:', totalError)

      // Jogadores livres (sem time)
      const { count: freePlayers, error: freeError } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .is('team_id', null)

      if (freeError) console.error('Erro free players:', freeError)

      // Jogadores contratados
      const { count: contractedPlayers, error: contractedError } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .not('team_id', 'is', null)

      if (contractedError) console.error('Erro contracted players:', contractedError)

      // Distribuição por rating (usando dados reais da coluna overall)
      const { data: ratingData, error: ratingError } = await supabase
        .from('players')
        .select('overall')

      const distribution = {
        '75+': 0,
        '80+': 0,
        '85+': 0,
        '90+': 0
      }

      if (ratingData && !ratingError) {
        ratingData.forEach(player => {
          const overall = player.overall || 0
          if (overall >= 90) distribution['90+']++
          else if (overall >= 85) distribution['85+']++
          else if (overall >= 80) distribution['80+']++
          else if (overall >= 75) distribution['75+']++
        })
      }

      setPlayersStats({
        totalPlayers: totalPlayers || 0,
        freePlayers: freePlayers || 0,
        contractedPlayers: contractedPlayers || 0,
        ratingDistribution: distribution
      })

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // Função para carregar leilões ativos REAIS
  const loadActiveAuctions = async () => {
    try {
      const { data: auctions, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!error) {
        setActiveAuctions(auctions || [])
      } else {
        console.error('Erro ao carregar leilões:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar leilões:', error)
    }
  }

  // Função para carregar transferências pendentes REAIS
  const loadPendingTransfers = async () => {
    try {
      const { count, error } = await supabase
        .from('player_transfers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (!error) {
        setPendingTransfers(count || 0)
      } else {
        console.error('Erro ao carregar transferências pendentes:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar transferências pendentes:', error)
    }
  }

  // Função para carregar transferências completadas
  const loadCompletedTransfers = async () => {
    try {
      const { count, error } = await supabase
        .from('player_transfers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      if (!error) {
        setCompletedTransfers(count || 0)
      } else {
        console.error('Erro ao carregar transferências completadas:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar transferências completadas:', error)
    }
  }

  // Função para carregar tabela do campeonato
  const loadLeagueTable = async () => {
    try {
      // Em um cenário real, você teria uma tabela 'league_table' no banco
      // Por enquanto, vamos criar dados mockados
      const mockTable: LeagueTable[] = [
        { id: '1', team_id: 'team1', team_name: 'Real Madrid', position: 1, points: 72, matches_played: 28, wins: 22, draws: 6, losses: 0, goals_for: 68, goals_against: 20, goal_difference: 48 },
        { id: '2', team_id: 'team2', team_name: 'Barcelona', position: 2, points: 68, matches_played: 28, wins: 21, draws: 5, losses: 2, goals_for: 65, goals_against: 25, goal_difference: 40 },
        { id: '3', team_id: 'team3', team_name: 'Atlético de Madrid', position: 3, points: 62, matches_played: 28, wins: 18, draws: 8, losses: 2, goals_for: 52, goals_against: 28, goal_difference: 24 },
        { id: '4', team_id: 'team4', team_name: team?.name || 'Seu Time', position: 4, points: 58, matches_played: 28, wins: 17, draws: 7, losses: 4, goals_for: 48, goals_against: 30, goal_difference: 18 },
        { id: '5', team_id: 'team5', team_name: 'Sevilla', position: 5, points: 55, matches_played: 28, wins: 16, draws: 7, losses: 5, goals_for: 45, goals_against: 32, goal_difference: 13 },
      ]
      
      setLeagueTable(mockTable)
      
      // Encontrar posição do time atual
      const teamPosition = mockTable.find(t => t.team_id === team?.id || t.team_name === team?.name)?.position || null
      setTeamPosition(teamPosition)
    } catch (error) {
      console.error('Erro ao carregar tabela:', error)
    }
  }

  // Função para carregar agenda de jogos
  const loadMatchSchedule = async () => {
    try {
      // Em um cenário real, você teria uma tabela 'matches' no banco
      const mockMatches: MatchSchedule[] = [
        { 
          id: '1', 
          home_team_id: 'team4', 
          away_team_id: 'team1',
          home_team_name: team?.name || 'Seu Time', 
          away_team_name: 'Real Madrid',
          date: '2024-03-15', 
          time: '21:00',
          stadium: 'Santiago Bernabéu',
          status: 'scheduled'
        },
        { 
          id: '2', 
          home_team_id: 'team3', 
          away_team_id: 'team4',
          home_team_name: 'Atlético de Madrid', 
          away_team_name: team?.name || 'Seu Time',
          date: '2024-03-22', 
          time: '19:30',
          stadium: 'Wanda Metropolitano',
          status: 'scheduled'
        },
        { 
          id: '3', 
          home_team_id: 'team4', 
          away_team_id: 'team2',
          home_team_name: team?.name || 'Seu Time', 
          away_team_name: 'Barcelona',
          date: '2024-04-05', 
          time: '20:45',
          stadium: 'Camp Nou',
          status: 'scheduled'
        },
        { 
          id: '4', 
          home_team_id: 'team5', 
          away_team_id: 'team4',
          home_team_name: 'Sevilla', 
          away_team_name: team?.name || 'Seu Time',
          date: '2024-04-12', 
          time: '18:00',
          stadium: 'Ramón Sánchez Pizjuán',
          status: 'scheduled'
        },
        { 
          id: '5', 
          home_team_id: 'team4', 
          away_team_id: 'team3',
          home_team_name: team?.name || 'Seu Time', 
          away_team_name: 'Atlético de Madrid',
          date: '2024-04-19', 
          time: '21:00',
          stadium: 'Estádio do seu time',
          status: 'scheduled'
        },
      ]
      
      setMatchSchedule(mockMatches)
    } catch (error) {
      console.error('Erro ao carregar agenda:', error)
    }
  }

  // Função para carregar estatísticas do time
  const loadTeamStatistics = async () => {
    try {
      // Em um cenário real, você teria uma tabela 'team_stats' no banco
      const mockStats: TeamStats = {
        team_id: team?.id || '',
        team_name: team?.name || 'Seu Time',
        form: 'V-V-E-D-V',
        next_match: '15/03/2024',
        last_5_matches: ['V', 'E', 'V', 'D', 'V']
      }
      
      setTeamStats(mockStats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas do time:', error)
    }
  }

  // Carregar contagem de mensagens não lidas
  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCount = async () => {
      try {
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        if (!conversations?.length) {
          setUnreadCount(0)
          return
        }

        const conversationIds = conversations.map(conv => conv.id)
        
        const { count } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('read', false)
          .neq('sender_id', user.id)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Erro ao carregar contagem de mensagens:', error)
      }
    }

    loadUnreadCount()

    // Subscription para atualizar em tempo real
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages'
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Função para atualizar o nome do técnico
  const updateCoachName = async () => {
    if (!user || !newCoachName.trim()) return

    setIsUpdating(true)
    try {
      console.log('📝 Tentando atualizar coach_name para:', {
        userId: user.id,
        newName: newCoachName.trim()
      })

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          coach_name: newCoachName.trim()
        })
        .eq('id', user.id)
        .select()
        .single()

      console.log('🔍 Resposta completa do Supabase:', {
        data,
        error,
        errorDetails: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      })

      if (error) {
        throw error
      }

      setProfile(data)
      setIsEditingName(false)
      console.log('✅ Nome do técnico atualizado com sucesso!')
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar nome do técnico:', error)
      
      if (error.code === '42501') {
        alert('Permissão negada. Verifique as políticas RLS da tabela profiles.')
      } else {
        alert(`Erro ao atualizar nome: ${error.message}`)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // Função para iniciar a edição
  const startEditing = () => {
    setNewCoachName(profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico')
    setIsEditingName(true)
  }

  // Função para cancelar edição
  const cancelEditing = () => {
    setIsEditingName(false)
    setNewCoachName(profile?.coach_name || '')
  }

  // Função para submeter com Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateCoachName()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Função para abrir o modal de aviso
  const openWarningModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setWarningModalOpen(true)
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando seu império...
        </div>
      </div>
    )
  }

  const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'
  const displayName = profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico'

  // Criar objeto user compatível com os componentes de chat
  const chatUser = {
    id: user?.id || '',
    name: displayName,
    email: user?.email || ''
  }

  // Criar objeto team compatível com os componentes de chat
  const chatTeam = {
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }

  // Calcular estatísticas do time
  const teamStatistics = {
    totalPlayers: players.length,
    averageOverall: players.length > 0 
      ? Math.round(players.reduce((sum, player) => sum + player.overall, 0) / players.length)
      : 0,
    topPlayer: players.length > 0 
      ? players.reduce((best, player) => player.overall > best.overall ? player : best)
      : null,
    positions: players.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Função para obter a cor do contador de jogadores
  const getPlayerCountColor = () => {
    if (players.length < 18 || players.length > 28) {
      return 'text-red-400'
    }
    return 'text-blue-400'
  }

  // Função para obter o valor do contador de jogadores
  const getPlayerCountValue = () => {
    const playerCount = players.length
    if (playerCount < 18 || playerCount > 28) {
      return `${playerCount}/28`
    }
    return `${playerCount}/28`
  }

  const tiles = [
    { 
      title: 'SALDO', 
      icon: DollarSign, 
      color: 'green', 
      value: formatBalance(team?.balance || 0), 
      subtitle: 'disponível para gastar', 
      link: '/dashboard/saldo',
      buttonText: 'Ver saldo',
      preview: 'saldo'
    },
    { 
      title: 'MEU ELENCO', 
      icon: Shirt, 
      color: 'blue', 
      value: getPlayerCountValue(), 
      subtitle: 'jogadores no elenco', 
      link: '/dashboard/elenco',
      buttonText: 'Ver elenco',
      preview: 'elenco'
    },
    { 
      title: 'JOGADORES', 
      icon: Users, 
      color: 'pink', 
      value: 'Pool', 
      subtitle: 'todos os atletas', 
      link: '/dashboard/jogadores',
      buttonText: 'Ver jogadores',
      preview: 'jogadores'
    },
    { 
      title: 'TRANSFERÊNCIAS', 
      icon: ArrowLeftRight, 
      color: 'purple', 
      value: 'Mercado', 
      subtitle: 'negociações ativas', 
      link: '/dashboard/transferencias',
      buttonText: 'Ver mercado',
      preview: 'transferencias'
    },
    { 
      title: 'LEILÃO', 
      icon: Calendar, 
      color: 'red', 
      value: activeAuctions.length > 0 ? 'AO VIVO' : 'EM BREVE', 
      subtitle: activeAuctions.length > 0 ? 'leilão ativo' : 'próximo evento', 
      link: '/dashboard/leilao',
      buttonText: 'Ver leilão',
      preview: 'leilao'
    },
    { 
      title: 'TABELA', 
      icon: Trophy, 
      color: 'yellow', 
      value: teamPosition ? `${teamPosition}º` : 'N/A', 
      subtitle: 'classificação atual', 
      link: '/dashboard/tabela',
      buttonText: 'Ver classificação',
      preview: 'tabela'
    },
  ]

  // Função para renderizar o preview baseado no tile
  const renderPreview = (tileTitle: string) => {
    switch (tileTitle) {
      case 'SALDO':
        const recentTransactions = balanceTransactions.slice(0, 3)
        const totalCredits = balanceTransactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        const totalDebits = balanceTransactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + (t.amount || 0), 0)

        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <span className="text-emerald-400 text-sm font-semibold">Saldo Disponível</span>
              <span className="text-emerald-400 font-bold text-lg">{formatBalance(team?.balance || 0)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-center">
                <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-emerald-400 font-semibold text-sm">+ {formatBalance(totalCredits)}</div>
                <div className="text-zinc-400 text-xs">Total Entradas</div>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-center">
                <TrendingDown className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <div className="text-red-400 font-semibold text-sm">- {formatBalance(totalDebits)}</div>
                <div className="text-zinc-400 text-xs">Total Saídas</div>
              </div>
            </div>

            {/* ÚLTIMAS TRANSAÇÕES */}
            {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-zinc-400 text-sm font-semibold">Últimas Movimentações:</p>
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex justify-between items-center p-2 bg-zinc-800/30 rounded text-xs"
                  >
                    <div className="flex-1 truncate">
                      <p className="text-white truncate">{transaction.description}</p>
                      {transaction.player_name && (
                        <p className="text-zinc-400 text-[10px]">{transaction.player_name}</p>
                      )}
                    </div>
                    <div className={`font-bold ${transaction.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {transaction.type === 'credit' ? '+' : '-'} {formatBalance(transaction.amount || 0)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-zinc-500 text-sm">Nenhuma transação recente</p>
              </div>
            )}
          </div>
        )
      
      case 'MEU ELENCO':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <span className="text-blue-400 text-sm font-semibold">Jogadores no Elenco</span>
              <span className={`font-bold text-lg ${getPlayerCountColor()}`}>{players.length}/28</span>
            </div>
            
            {teamStatistics.topPlayer && (
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">Melhor Jogador</div>
                    <div className="text-blue-400 text-xs">{teamStatistics.topPlayer.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">{teamStatistics.topPlayer.overall} OVR</div>
                    <div className="text-zinc-400 text-xs">{teamStatistics.topPlayer.position}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(teamStatistics.positions).slice(0, 6).map(([position, count]) => (
                <div key={position} className="bg-zinc-800/50 p-2 rounded border border-zinc-700 text-center">
                  <div className="text-white font-semibold">{count}</div>
                  <div className="text-zinc-400 text-[10px]">{position}</div>
                </div>
              ))}
            </div>

            {/* Aviso de contagem de jogadores (só aparece no tile expandido) */}
            {playerCountWarning.show && (
              <div className="mt-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm font-semibold">
                      {playerCountWarning.type === 'below' ? 'ELENCO INSUFICIENTE' : 'ELENCO EXCEDENTE'}
                    </p>
                    <p className="text-red-300 text-xs mt-1">
                      {playerCountWarning.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      
      case 'JOGADORES':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
              <span className="text-pink-400 text-sm font-semibold">Database Completa</span>
              <span className="text-pink-400 font-bold text-lg">{playersStats.totalPlayers}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Jogadores Livres</span>
                <span className="text-green-400 font-semibold">{playersStats.freePlayers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Contratados</span>
                <span className="text-blue-400 font-semibold">{playersStats.contractedPlayers}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {[
                { rating: '75+', count: playersStats.ratingDistribution['75+'], color: 'text-yellow-400' },
                { rating: '80+', count: playersStats.ratingDistribution['80+'], color: 'text-orange-400' },
                { rating: '85+', count: playersStats.ratingDistribution['85+'], color: 'text-red-400' },
                { rating: '90+', count: playersStats.ratingDistribution['90+'], color: 'text-purple-400' }
              ].map((item) => (
                <div key={item.rating} className="flex-1 bg-zinc-800/50 p-2 rounded border border-zinc-700 text-center">
                  <div className={`font-bold text-xs ${item.color}`}>{item.rating}</div>
                  <div className="text-zinc-400 text-[10px]">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'TABELA':
        const teamInTable = leagueTable.find(t => t.team_id === team?.id || t.team_name === team?.name)
        const top5Table = leagueTable.slice(0, 5)
        const nextMatches = matchSchedule.slice(0, 3)

        return (
          <div className="space-y-4">
            {/* Estatísticas do Time */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg border border-yellow-500/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-sm">Posição Atual</span>
                </div>
                <div className="text-white font-bold text-xl">{teamPosition}º Lugar</div>
              </div>
              
              {teamInTable && (
                <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                  <div className="text-center bg-zinc-800/30 p-2 rounded">
                    <div className="text-white font-bold">{teamInTable.points}</div>
                    <div className="text-zinc-400">Pontos</div>
                  </div>
                  <div className="text-center bg-zinc-800/30 p-2 rounded">
                    <div className="text-white font-bold">{teamInTable.matches_played}</div>
                    <div className="text-zinc-400">Jogos</div>
                  </div>
                  <div className="text-center bg-zinc-800/30 p-2 rounded">
                    <div className="text-white font-bold">+{teamInTable.goal_difference}</div>
                    <div className="text-zinc-400">Saldo</div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabela do Campeonato (Top 5) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-orange-400" />
                  <span className="text-zinc-400 text-sm font-semibold">Top 5 da Liga</span>
                </div>
                <span className="text-zinc-500 text-xs">Pts J V E D</span>
              </div>
              
              <div className="space-y-1">
                {top5Table.map((teamTable) => (
                  <div 
                    key={teamTable.id}
                    className={`flex items-center justify-between p-2 rounded text-xs ${
                      (teamTable.team_id === team?.id || teamTable.team_name === team?.name) 
                        ? 'bg-yellow-500/10 border border-yellow-500/20' 
                        : 'bg-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 text-center font-bold ${
                        teamTable.position === 1 ? 'text-yellow-400' :
                        teamTable.position === 2 ? 'text-zinc-300' :
                        teamTable.position === 3 ? 'text-amber-700' :
                        'text-zinc-400'
                      }`}>
                        {teamTable.position}º
                      </span>
                      <span className={`font-medium ${
                        (teamTable.team_id === team?.id || teamTable.team_name === team?.name) 
                          ? 'text-yellow-300' 
                          : 'text-white'
                      }`}>
                        {teamTable.team_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300">
                      <span className="w-8 text-center font-bold">{teamTable.points}</span>
                      <span className="w-4 text-center">{teamTable.matches_played}</span>
                      <span className="w-4 text-center text-green-400">{teamTable.wins}</span>
                      <span className="w-4 text-center text-yellow-400">{teamTable.draws}</span>
                      <span className="w-4 text-center text-red-400">{teamTable.losses}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos Jogos */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                <span className="text-zinc-400 text-sm font-semibold">Próximos Jogos</span>
              </div>
              
              <div className="space-y-2">
                {nextMatches.map((match) => (
                  <div key={match.id} className="bg-zinc-800/30 p-2 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-500 text-[10px]">
                        {formatDate(match.date)} • {match.time}
                      </span>
                      <span className="text-zinc-500 text-[10px]">{match.stadium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          match.home_team_id === team?.id ? 'bg-yellow-400' : 'bg-zinc-500'
                        }`} />
                        <span className={`${
                          match.home_team_id === team?.id ? 'text-yellow-300 font-semibold' : 'text-white'
                        }`}>
                          {match.home_team_name}
                        </span>
                      </div>
                      <span className="text-zinc-500 mx-2">×</span>
                      <div className="flex items-center gap-1">
                        <span className={`${
                          match.away_team_id === team?.id ? 'text-yellow-300 font-semibold' : 'text-white'
                        }`}>
                          {match.away_team_name}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          match.away_team_id === team?.id ? 'bg-yellow-400' : 'bg-zinc-500'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forma do Time */}
            {teamStats && (
              <div className="bg-zinc-800/30 rounded p-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Forma:</span>
                    <div className="flex gap-1">
                      {teamStats.last_5_matches.map((result, index) => (
                        <span key={index} className={`
                          w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold
                          ${result === 'V' ? 'bg-green-500/30 text-green-400' : 
                            result === 'E' ? 'bg-yellow-500/30 text-yellow-400' : 
                            'bg-red-500/30 text-red-400'}
                        `}>
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-blue-400">Próximo: {teamStats.next_match}</span>
                </div>
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
            <p className="text-zinc-400 italic text-sm">Preview em desenvolvimento</p>
          </div>
        )
    }
  }

  // Função para determinar a posição do tile expandido
  const getTilePositionClass = (tileTitle: string, index: number) => {
    if (expandedTile !== tileTitle) return ''
    
    // Tile na posição 3 (JOGADORES) - expande para a esquerda mantendo a posição
    if (index === 2) {
      return 'lg:col-start-2 lg:col-span-2 row-start-1 scale-105 shadow-2xl z-10'
    }
    
    // Demais tiles - comportamento padrão (expandem para a direita)
    return 'lg:col-span-2 scale-105 shadow-2xl z-10'
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar user={user!} profile={profile} team={team} />

      {/* Conteúdo Principal */}
      <div className="flex-1 transition-all duration-300 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-4 lg:p-6">
          <div className="mx-auto space-y-6 lg:space-y-8 max-w-7xl">
            {/* Header do conteúdo */}
            <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 pt-4 lg:pt-6">
              {team?.logo_url ? (
                <Image 
                  src={team.logo_url} 
                  alt={team.name} 
                  width={100} 
                  height={100} 
                  className="rounded-2xl lg:rounded-3xl border-4 lg:border-6 border-purple-600/30 shadow-xl lg:shadow-2xl object-cover" 
                />
              ) : (
                <Avatar className="h-24 w-24 lg:h-32 lg:w-32 border-4 lg:border-6 border-purple-600/30">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-3xl lg:text-5xl font-black">
                    {displayName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  {isEditingName ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCoachName}
                          onChange={(e) => setNewCoachName(e.target.value)}
                          onKeyDown={handleKeyPress}
                          className="text-2xl lg:text-4xl font-black text-white bg-transparent border-b-2 border-purple-500 outline-none px-2 py-1 min-w-[200px]"
                          placeholder="Digite o nome..."
                          autoFocus
                          disabled={isUpdating}
                        />
                      </div>
                      <div className="flex gap-2 justify-center md:justify-start">
                        <Button
                          onClick={updateCoachName}
                          disabled={isUpdating || !newCoachName.trim()}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white px-4"
                        >
                          {isUpdating ? 'Salvando...' : 'OK'}
                        </Button>
                        <Button
                          onClick={cancelEditing}
                          disabled={isUpdating}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl lg:text-4xl font-black text-white">{displayName}</h2>
                      <Button
                        onClick={startEditing}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        title="Editar nome do técnico"
                      >
                        <Edit className="h-4 w-4 lg:h-5 lg:w-5" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="mt-1 lg:mt-2 text-lg lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {team?.name || 'Sem time ainda'}
                </p>
                {isAdmin && (
                  <p className="mt-1 lg:mt-2 text-xs lg:text-sm font-medium text-yellow-500 flex items-center justify-center md:justify-start gap-1 lg:gap-2">
                    <Crown className="h-3 w-3 lg:h-4 lg:w-4" /> ADMINISTRADOR <Crown className="h-3 w-3 lg:h-4 lg:w-4" />
                  </p>
                )}
              </div>
            </div>

            {/* Grid de Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 auto-rows-min">
              {tiles.map((tile, index) => (
                <Card
                  key={tile.title}
                  className={`group relative overflow-hidden rounded-xl lg:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg lg:shadow-xl transition-all duration-700 cursor-pointer ${
                    expandedTile === tile.title
                      ? getTilePositionClass(tile.title, index)
                      : 'hover:scale-105 hover:shadow-purple-600/40'
                  }`}
                  onClick={() => setExpandedTile(expandedTile === tile.title ? null : tile.title)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <CardHeader className="pb-2 lg:pb-3 relative z-10">
                    <CardTitle className="text-base lg:text-lg font-bold text-white flex items-center justify-between">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <tile.icon className={`h-6 w-6 lg:h-8 lg:w-8 text-${tile.color}-400 drop-shadow-lg`} />
                        <span className="truncate">{tile.title}</span>
                        
                        {/* Ícone de aviso para MEU ELENCO se houver problema (primeiro estágio) */}
                        {tile.title === 'MEU ELENCO' && playerCountWarning.show && expandedTile !== tile.title && (
                          <button
                            onClick={openWarningModal}
                            className="ml-1 p-1 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-all group/icon"
                            title="Clique para ver detalhes do aviso"
                          >
                            <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-red-400 group-hover/icon:text-red-300" />
                          </button>
                        )}
                      </div>
                      {expandedTile === tile.title ? <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="relative z-10 space-y-3 lg:space-y-4">
                    <div className="transition-all duration-700">
                      <p className={`font-black break-words ${tile.title === 'MEU ELENCO' ? getPlayerCountColor() : 'text-white'} ${expandedTile === tile.title ? 'text-2xl lg:text-4xl' : 'text-xl lg:text-3xl'}`}>
                        {tile.value}
                        {tile.title === 'MEU ELENCO' && playerCountWarning.show && expandedTile !== tile.title && (
                          <AlertTriangle className="inline-block ml-1 w-4 h-4 text-red-400 animate-pulse" />
                        )}
                      </p>
                      <p className={`font-medium ${tile.title === 'MEU ELENCO' && playerCountWarning.show ? 'text-red-400' : `text-${tile.color}-400`} ${expandedTile === tile.title ? 'text-sm lg:text-base mt-2 lg:mt-3' : 'text-xs lg:text-sm'}`}>
                        {tile.subtitle}
                      </p>
                    </div>

                    {expandedTile === tile.title && (
                      <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
                        {renderPreview(tile.title)}
                      </div>
                    )}

                    <Link href={tile.link} onClick={(e) => e.stopPropagation()} className="block mt-3 lg:mt-4">
                      <Button className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/20 hover:to-white/30 border border-white/20 text-white font-bold text-xs lg:text-sm py-2 lg:py-3 h-auto min-h-0">
                        <span className="truncate">{tile.buttonText}</span>
                        <ArrowRight className="ml-1 lg:ml-2 h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Estatísticas Rápidas do Time */}
            {team && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mt-8">
                <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">Jogadores</p>
                      <p className={`font-bold text-xl ${players.length < 18 || players.length > 28 ? 'text-red-400' : 'text-white'}`}>
                        {players.length}/28
                        {(players.length < 18 || players.length > 28) && (
                          <button
                            onClick={openWarningModal}
                            className="inline-block ml-1 p-0.5 hover:bg-red-500/20 rounded-full transition-colors"
                            title="Clique para ver detalhes do aviso"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </p>
                    </div>
                    <Users className={`w-8 h-8 ${players.length < 18 || players.length > 28 ? 'text-red-400' : 'text-purple-400'}`} />
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">OVR Médio</p>
                      <p className="text-white font-bold text-xl">{teamStatistics.averageOverall}</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-400" />
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">Saldo</p>
                      <p className="text-white font-bold text-xl">
                        {formatBalance(team?.balance || 0).replace('R$ ', '')}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">Posição</p>
                      <p className="text-white font-bold text-xl">
                        {teamPosition || '0'}º
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Chat Components */}
        {user && team && (
          <>
            <FloatingChatButton 
              currentUser={chatUser}
              currentTeam={chatTeam}
              unreadCount={unreadCount}
              onOpenChat={() => setIsChatOpen(true)}
            />
            
            <ChatPopup
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              currentUser={chatUser}
              currentTeam={chatTeam}
            />
          </>
        )}
      </div>

      {/* Modal de Aviso */}
      <WarningModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        type={playerCountWarning.type}
      />
    </div>
  )
}