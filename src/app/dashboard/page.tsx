// src/app/dashboard/page.tsx - VERSÃO COMPLETA CORRIGIDA
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DollarSign, Shirt, Calendar, Crown, ArrowRight, ArrowLeftRight, Users, ChevronDown, ChevronUp, Edit, TrendingUp, TrendingDown, Building2, Target, Footprints, Clock } from 'lucide-react'
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

function formatBalance(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString('pt-BR')}`
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
  const [completedTransfers, setCompletedTransfers] = useState(0) // NOVO ESTADO

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
      loadCompletedTransfers() // NOVA FUNÇÃO
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

  // NOVA FUNÇÃO: Carregar transferências completadas
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
  const teamStats = {
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
      value: `${players.length}/25`, 
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
      title: 'LEILÃO', 
      icon: Calendar, 
      color: 'red', 
      value: 'EM BREVE', 
      subtitle: 'próximo evento', 
      link: '/dashboard/leilao',
      buttonText: 'Ver leilão',
      preview: 'leilao'
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
              <span className="text-blue-400 font-bold text-lg">{players.length}/25</span>
            </div>
            
            {teamStats.topPlayer && (
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">Melhor Jogador</div>
                    <div className="text-blue-400 text-xs">{teamStats.topPlayer.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">{teamStats.topPlayer.overall} OVR</div>
                    <div className="text-zinc-400 text-xs">{teamStats.topPlayer.position}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(teamStats.positions).slice(0, 6).map(([position, count]) => (
                <div key={position} className="bg-zinc-800/50 p-2 rounded border border-zinc-700 text-center">
                  <div className="text-white font-semibold">{count}</div>
                  <div className="text-zinc-400 text-[10px]">{position}</div>
                </div>
              ))}
            </div>
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
      
      case 'LEILÃO':
        const hasActiveAuctions = activeAuctions.length > 0
        
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-red-400 text-sm font-semibold">
                {hasActiveAuctions ? 'Leilões Ativos' : 'Próximo Leilão'}
              </span>
              <span className="text-red-400 font-bold text-lg">
                {hasActiveAuctions ? activeAuctions.length : 'EM BREVE'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              {hasActiveAuctions ? (
                <div className="space-y-2">
                  <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                    <div className="text-orange-400 font-semibold text-center">
                      {activeAuctions.length} Leilão{activeAuctions.length > 1 ? 's' : ''} Ativo{activeAuctions.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-zinc-400 text-xs text-center mt-1">
                      Participe agora dos leilões
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-800/30 p-2 rounded text-center">
                      <Target className="w-3 h-3 text-yellow-400 mx-auto mb-1" />
                      <div className="text-white font-semibold">{activeAuctions.length}</div>
                      <div className="text-zinc-400">Ativos</div>
                    </div>
                    <div className="bg-zinc-800/30 p-2 rounded text-center">
                      <DollarSign className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                      <div className="text-white font-semibold">
                        {activeAuctions.length > 0 ? formatBalance(activeAuctions[0].current_bid || 0) : 'R$ 0'}
                      </div>
                      <div className="text-zinc-400">Maior Lance</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-center">
                  <div className="text-orange-400 font-semibold">Aguardando Início</div>
                  <div className="text-zinc-400 text-xs mt-1">Novos leilões em breve</div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'TRANSFERÊNCIAS':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <span className="text-purple-400 text-sm font-semibold">Mercado de Transferências</span>
              <span className="text-purple-400 font-bold text-lg">{pendingTransfers}</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-center">
                  <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <div className="text-blue-400 font-semibold">{pendingTransfers}</div>
                  <div className="text-zinc-400 text-xs">Pendentes</div>
                </div>
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-center">
                  <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <div className="text-green-400 font-semibold">{completedTransfers}</div>
                  <div className="text-zinc-400 text-xs">Concluídas</div>
                </div>
              </div>
              
              <div className="bg-zinc-800/30 p-2 rounded text-center">
                <div className="text-zinc-400 text-xs">
                  {pendingTransfers > 0 
                    ? `${pendingTransfers} negociação${pendingTransfers > 1 ? 'ões' : ''} aguardando aprovação`
                    : completedTransfers > 0
                    ? `${completedTransfers} transferência${completedTransfers > 1 ? 's' : ''} concluída${completedTransfers > 1 ? 's' : ''}`
                    : 'Nenhuma negociação pendente'
                  }
                </div>
              </div>
            </div>
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

  // Função para determinar a posição do tile expandido - CORRIGIDA
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

            {/* Grid de Tiles - CORRIGIDO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 auto-rows-min">
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
                      </div>
                      {expandedTile === tile.title ? <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="relative z-10 space-y-3 lg:space-y-4">
                    <div className="transition-all duration-700">
                      <p className={`font-black text-white break-words ${expandedTile === tile.title ? 'text-2xl lg:text-4xl' : 'text-xl lg:text-3xl'}`}>
                        {tile.value}
                      </p>
                      <p className={`font-medium text-${tile.color}-400 ${expandedTile === tile.title ? 'text-sm lg:text-base mt-2 lg:mt-3' : 'text-xs lg:text-sm'}`}>
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
                      <p className="text-white font-bold text-xl">{players.length}/25</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">OVR Médio</p>
                      <p className="text-white font-bold text-xl">{teamStats.averageOverall}</p>
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

                <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">Melhor Jogador</p>
                      <p className="text-white font-bold text-xl">
                        {teamStats.topPlayer ? teamStats.topPlayer.overall : '0'}
                      </p>
                    </div>
                    <Footprints className="w-8 h-8 text-orange-400" />
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
    </div>
  )
}