// src/app/dashboard/transferencias/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Clock, CheckCircle, DollarSign, ArrowRight, Calendar, Users, ArrowRightLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'

// Função de formatar valor
function formatBalance(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

// Função para formatar data e hora
function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
}

interface UserProfile {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface Team {
  id: string
  name: string
  logo_url: string
  balance: number
}

export default function PaginaTransferencias() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [allTransfers, setAllTransfers] = useState<any[]>([])
  const [userTeamId, setUserTeamId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [exchangePlayersDetails, setExchangePlayersDetails] = useState<{[key: string]: any[]}>({})
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [team, setTeam] = useState<Team | null>(null)

  // Estados para o chat
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
    
    // Subscribe para atualizações em tempo real
    const subscription = supabase
      .channel('transferencias')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'player_transfers' },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

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

  // Carregar detalhes dos jogadores de troca
  const loadExchangePlayersDetails = async (transfer: any) => {
    if (!transfer.exchange_players || transfer.exchange_players.length === 0) return []

    try {
      const { data } = await supabase
        .from('players')
        .select('id, name, photo_url, position, base_price')
        .in('id', transfer.exchange_players)

      return data || []
    } catch (error) {
      console.error('Erro ao carregar detalhes dos jogadores:', error)
      return []
    }
  }

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setUser(session.user)

    // 1. Pega perfil do usuário (team_id e se é admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, teams(*)')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      setProfile(profile)
      setUserTeamId(profile?.team_id || null)
      setIsAdmin(profile?.role === 'admin')
      
      // Definir time diretamente do perfil
      if (profile.teams) {
        setTeam(profile.teams)
      } else {
        setTeam(null)
      }
    }

    // 2. Carrega TODAS as negociações
    const { data: transferData } = await supabase
      .from('player_transfers')
      .select(`
        *,
        from_team:teams!from_team_id (id, name, logo_url, balance),
        to_team:teams!to_team_id (id, name, logo_url, balance),
        player:players (id, name, photo_url, position)
      `)
      .order('created_at', { ascending: false })

    setAllTransfers(transferData || [])
    
    // Carregar detalhes dos jogadores de troca
    const exchangeDetails: {[key: string]: any[]} = {}
    if (transferData) {
      for (const transfer of transferData) {
        if (transfer.is_exchange && transfer.exchange_players) {
          exchangeDetails[transfer.id] = await loadExchangePlayersDetails(transfer)
        }
      }
    }
    setExchangePlayersDetails(exchangeDetails)
    
    // Filtra baseado na aba ativa
    const filtered = activeTab === 'pending' 
      ? (transferData || []).filter(t => t.status === 'pending')
      : (transferData || []).filter(t => t.status === 'approved')
    
    setTransfers(filtered)
    setLoading(false)
  }

  // Recarregar quando mudar a aba
  useEffect(() => {
    if (allTransfers.length > 0) {
      const filtered = activeTab === 'pending' 
        ? allTransfers.filter(t => t.status === 'pending')
        : allTransfers.filter(t => t.status === 'approved')
      
      setTransfers(filtered)
    }
  }, [activeTab, allTransfers])

  // Função para verificar saldo e executar transferência
  const checkAndExecuteTransfer = async (transfer: any) => {
    try {
      // Verifica se todos aprovaram
      if (transfer.approved_by_seller && transfer.approved_by_buyer && transfer.approved_by_admin) {
        
        // Para trocas, verifica se o time tem os jogadores
        if (transfer.is_exchange) {
          const { data: exchangePlayers } = await supabase
            .from('players')
            .select('id, team_id')
            .in('id', transfer.exchange_players || [])
          
          // Verifica se todos os jogadores ainda estão no time
          const invalidPlayers = exchangePlayers?.filter(p => p.team_id !== transfer.to_team_id) || []
          if (invalidPlayers.length > 0) {
            alert('❌ Troca rejeitada! Alguns jogadores não estão mais disponíveis no time.')
            
            const { error: rejectError } = await supabase
              .from('player_transfers')
              .update({ 
                status: 'rejected',
                approved_by_seller: false,
                approved_by_buyer: false,
                approved_by_admin: false
              })
              .eq('id', transfer.id)
            return
          }
        } else {
          // Para vendas normais, verifica saldo
          const { data: buyerTeam, error: balanceError } = await supabase
            .from('teams')
            .select('balance, name')
            .eq('id', transfer.to_team_id)
            .single()

          if (balanceError) return

          if (buyerTeam.balance < transfer.value) {
            // Saldo insuficiente - rejeita a transferência
            const { error: rejectError } = await supabase
              .from('player_transfers')
              .update({ 
                status: 'rejected',
                approved_by_seller: false,
                approved_by_buyer: false,
                approved_by_admin: false
              })
              .eq('id', transfer.id)

            if (!rejectError) {
              alert(`❌ Transferência rejeitada! ${buyerTeam.name} não tem saldo suficiente.`)
            }
            return
          }
        }

        // Chama a função do Supabase
        const { data, error } = await supabase.rpc('executar_transferencia_completa', {
          p_transfer_id: transfer.id,
          p_player_id: transfer.player_id,
          p_from_team_id: transfer.from_team_id,
          p_to_team_id: transfer.to_team_id,
          p_value: transfer.value
        })

        if (error) {
          alert(`Erro ao processar transferência: ${error.message}`)
          return
        }

        if (data && !data.success) {
          alert(`Transferência falhou: ${data.message}`)
          return
        }

        if (data && data.success) {
          const message = transfer.is_exchange 
            ? '✅ Troca concluída com sucesso! Jogadores foram transferidos.'
            : '✅ Transferência concluída com sucesso! Jogador foi transferido.'
          alert(message)
          loadData()
        }
      }
    } catch (error) {
      alert('Erro inesperado ao processar transferência')
    }
  }

  // Função de aprovação
  const aprovar = async (transferId: string, type: 'seller' | 'buyer' | 'admin') => {
    const field = `approved_by_${type}`

    const { error } = await supabase
      .from('player_transfers')
      .update({ [field]: true } as any)
      .eq('id', transferId)

    if (error) return

    // Atualiza o estado local pra refletir a aprovação imediatamente
    const updatedTransfers = transfers.map(t =>
      t.id === transferId ? { ...t, [field]: true } : t
    )
    setTransfers(updatedTransfers)

    // Encontra a transferência atualizada e verifica se pode executar
    const updatedTransfer = updatedTransfers.find(t => t.id === transferId)
    if (updatedTransfer) {
      await checkAndExecuteTransfer(updatedTransfer)
    }
  }

  // Componente para exibir jogadores da troca
  const ExchangePlayers = ({ transfer }: { transfer: any }) => {
    const players = exchangePlayersDetails[transfer.id] || []
    
    if (players.length === 0) return null

    return (
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-semibold text-sm">Jogadores na Troca</span>
        </div>
        <div className="space-y-2">
          {players.map((player: any) => (
            <div key={player.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={player.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{player.position}</span>
                  </div>
                )}
                <span className="text-white">{player.name}</span>
                <Badge className="bg-blue-600 text-xs">{player.position}</Badge>
              </div>
              <span className="text-emerald-400 text-xs">
                R$ {player.base_price?.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
          {transfer.exchange_value > 0 && (
            <div className="flex items-center justify-between border-t border-blue-500/30 pt-2">
              <span className="text-blue-300 text-sm">+ Dinheiro</span>
              <span className="text-emerald-400 text-sm font-semibold">
                R$ {transfer.exchange_value.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Contadores para as abas
  const pendingCount = allTransfers.filter(t => t.status === 'pending').length
  const completedCount = allTransfers.filter(t => t.status === 'approved').length

  // Criar objetos compatíveis com os componentes de chat
  const chatUser = {
    id: user?.id || '',
    name: profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico',
    email: user?.email || ''
  }

  const chatTeam = {
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-2xl text-white animate-pulse">Carregando negociações...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar 
        user={user!}
        profile={profile}
        team={team}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-5xl font-black text-white mb-2 text-center md:text-left">
              NEGOCIAÇÕES DE JOGADORES
            </h1>
            <p className="text-zinc-400 mb-8 text-center md:text-left">Gerencie todas as transferências do campeonato</p>

            {/* Seletor de Abas */}
            <div className="flex gap-4 mb-8 justify-center md:justify-start">
              <Button
                onClick={() => setActiveTab('pending')}
                variant={activeTab === 'pending' ? 'default' : 'outline'}
                className={cn(
                  "flex items-center gap-2",
                  activeTab === 'pending' ? "bg-purple-600 hover:bg-purple-700" : "bg-zinc-800/50 border-zinc-600"
                )}
              >
                <Clock className="w-4 h-4" />
                Em Andamento
                <Badge variant="secondary" className="ml-2 bg-zinc-700">
                  {pendingCount}
                </Badge>
              </Button>
              
              <Button
                onClick={() => setActiveTab('completed')}
                variant={activeTab === 'completed' ? 'default' : 'outline'}
                className={cn(
                  "flex items-center gap-2",
                  activeTab === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-zinc-800/50 border-zinc-600"
                )}
              >
                <CheckCircle className="w-4 h-4" />
                Finalizadas
                <Badge variant="secondary" className="ml-2 bg-zinc-700">
                  {completedCount}
                </Badge>
              </Button>
            </div>

            {transfers.length === 0 ? (
              <Card className="p-16 text-center bg-white/5 border-white/10">
                <p className="text-xl text-zinc-400">
                  {activeTab === 'pending' 
                    ? 'Nenhuma negociação pendente no momento.' 
                    : 'Nenhuma transferência finalizada.'
                  }
                </p>
                <p className="text-zinc-500 mt-2">
                  {activeTab === 'pending' 
                    ? 'O mercado está calmo... por enquanto.' 
                    : 'Todas as negociações estão em andamento.'
                  }
                </p>
              </Card>
            ) : (
              <div className={cn(
                "gap-6",
                activeTab === 'completed' ? "grid grid-cols-1 md:grid-cols-2" : "space-y-6"
              )}>
                {transfers.map((t) => {
                  // Verificar se é uma dispensa (to_team_id é null ou transfer_type é 'dismiss')
                  const isDismissal = t.to_team_id === null || t.transfer_type === 'dismiss'
                  
                  return (
                    <Card
                      key={t.id}
                      className={cn(
                        "bg-white/5 backdrop-blur-xl border transition-all",
                        t.status === 'approved' 
                          ? "border-green-500/20 hover:border-green-500/40 p-4" 
                          : "border-white/10 hover:border-white/20 p-6",
                        t.is_exchange && "border-blue-500/20 hover:border-blue-500/40",
                        isDismissal && "border-red-500/20 hover:border-red-500/40"
                      )}
                    >
                      {/* Badge de tipo de transferência */}
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={cn(
                          t.is_exchange ? "bg-blue-600" : 
                          isDismissal ? "bg-red-600" : "bg-purple-600"
                        )}>
                          {t.is_exchange ? (
                            <>
                              <ArrowRightLeft className="w-3 h-3 mr-1" />
                              Troca
                            </>
                          ) : isDismissal ? (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Dispensa
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3 mr-1" />
                              Venda
                            </>
                          )}
                        </Badge>
                        {t.status === 'approved' && (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Concluída
                          </Badge>
                        )}
                      </div>

                      {t.status === 'pending' ? (
                        // LAYOUT PARA TRANSFERÊNCIAS PENDENTES (completo)
                        <>
                          {/* ANÚNCIO CENTRALIZADO */}
                          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-6">
                            {/* Time Vendedor */}
                            <div className="flex flex-col items-center text-center">
                              {t.from_team.logo_url ? (
                                <img 
                                  src={t.from_team.logo_url} 
                                  alt={t.from_team.name}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-red-500/50 mb-2"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center mb-2">
                                  <span className="text-sm font-bold text-white">{t.from_team.name.substring(0, 2)}</span>
                                </div>
                              )}
                              <div>
                                <p className="text-zinc-400 text-sm mb-1">Vendedor</p>
                                <p className="text-white font-bold text-lg">{t.from_team.name}</p>
                              </div>
                            </div>

                            {/* Seta e Valor - CENTRO */}
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-4">
                                <ArrowRight className="w-8 h-8 text-yellow-400" />
                                
                                {/* Valor */}
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    {t.is_exchange ? (
                                      <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                                    ) : (
                                      <DollarSign className="w-5 h-5 text-emerald-400" />
                                    )}
                                    <span className={cn(
                                      "font-bold text-2xl",
                                      t.is_exchange ? "text-blue-400" : "text-emerald-400"
                                    )}>
                                      {formatBalance(t.value)}
                                    </span>
                                  </div>
                                  <p className="text-zinc-400 text-sm mt-1">
                                    {t.is_exchange ? 'Valor Total da Troca' : 'Valor da Transferência'}
                                  </p>
                                </div>
                                
                                <ArrowRight className="w-8 h-8 text-yellow-400" />
                              </div>
                            </div>

                            {/* Time Comprador */}
                            <div className="flex flex-col items-center text-center">
                              {t.to_team.logo_url ? (
                                <img 
                                  src={t.to_team.logo_url} 
                                  alt={t.to_team.name}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-green-500/50 mb-2"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mb-2">
                                  <span className="text-sm font-bold text-white">{t.to_team.name.substring(0, 2)}</span>
                                </div>
                              )}
                              <div>
                                <p className="text-zinc-400 text-sm mb-1">Comprador</p>
                                <p className="text-white font-bold text-lg">{t.to_team.name}</p>
                              </div>
                            </div>
                          </div>

                          {/* Jogador Principal */}
                          <div className="flex flex-col items-center gap-4 p-4 bg-zinc-800/30 rounded-lg mb-6">
                            {t.player.photo_url ? (
                              <img 
                                src={t.player.photo_url} 
                                alt={t.player.name}
                                className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                                <span className="text-xl font-black text-white">{t.player.position}</span>
                              </div>
                            )}
                            <div className="text-center">
                              <h3 className="text-2xl font-bold text-white mb-2">{t.player.name}</h3>
                              <div className="flex items-center gap-2 justify-center">
                                <Badge className="bg-purple-600 text-base py-1 px-3">{t.player.position}</Badge>
                                <span className="text-yellow-400 text-sm font-semibold">
                                  ⏳ Aguardando Aprovações
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Jogadores da Troca (se for troca) */}
                          {t.is_exchange && <ExchangePlayers transfer={t} />}

                          {/* Aprovações */}
                          <div className="flex gap-8 items-center justify-center mb-6">
                            {/* Vendedor */}
                            <div className="text-center group relative">
                              <CheckCircle2
                                className={cn(
                                  "h-12 w-12 transition-all",
                                  t.approved_by_seller ? "text-green-400" : "text-zinc-600"
                                )}
                              />
                              <p className="text-sm text-zinc-400 mt-1">Vendedor</p>
                              <div className="invisible group-hover:visible absolute bg-black/90 text-white text-xs px-3 py-2 rounded-lg -mt-16 z-10">
                                {t.from_team.name}
                              </div>
                            </div>

                            {/* Comprador */}
                            <div className="text-center group relative">
                              <CheckCircle2
                                className={cn(
                                  "h-12 w-12 transition-all",
                                  t.approved_by_buyer ? "text-green-400" : "text-zinc-600"
                                )}
                              />
                              <p className="text-sm text-zinc-400 mt-1">Comprador</p>
                              <div className="invisible group-hover:visible absolute bg-black/90 text-white text-xs px-3 py-2 rounded-lg -mt-16 z-10">
                                {t.to_team.name}
                              </div>
                            </div>

                            {/* Admin */}
                            <div className="text-center group relative">
                              <CheckCircle2
                                className={cn(
                                  "h-12 w-12 transition-all",
                                  t.approved_by_admin ? "text-green-400" : "text-zinc-600"
                                )}
                              />
                              <p className="text-sm text-zinc-400 mt-1">Admin</p>
                              <div className="invisible group-hover:visible absolute bg-black/90 text-white text-xs px-3 py-2 rounded-lg -mt-16 z-10">
                                Sistema
                              </div>
                            </div>
                          </div>

                          {/* Botões de aprovação */}
                          {(userTeamId === t.from_team_id || userTeamId === t.to_team_id || isAdmin) && (
                            <div className="mt-6 flex flex-wrap gap-4 justify-center">
                              {userTeamId === t.from_team_id && !t.approved_by_seller && (
                                <Button
                                  onClick={() => aprovar(t.id, 'seller')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Aprovar como Vendedor
                                </Button>
                              )}
                              {userTeamId === t.to_team_id && !t.approved_by_buyer && (
                                <Button
                                  onClick={() => aprovar(t.id, 'buyer')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Aprovar como Comprador
                                </Button>
                              )}
                              {isAdmin && !t.approved_by_admin && (
                                <Button
                                  onClick={() => aprovar(t.id, 'admin')}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Aprovar como Admin
                                </Button>
                              )}
                              {/* Mensagem se já aprovou */}
                              {((userTeamId === t.from_team_id && t.approved_by_seller) ||
                                (userTeamId === t.to_team_id && t.approved_by_buyer) ||
                                (isAdmin && t.approved_by_admin)) && (
                                <p className="text-green-400 font-bold flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Você já aprovou esta negociação
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        // LAYOUT PARA TRANSFERÊNCIAS FINALIZADAS (compacto)
                        <div className="space-y-4">
                          {/* Header com data/hora */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                {formatDateTime(t.created_at).date} às {formatDateTime(t.created_at).time}
                              </span>
                            </div>
                          </div>

                          {/* Conteúdo principal */}
                          <div className="flex items-center justify-between">
                            {/* Time de Origem */}
                            <div className="flex items-center gap-3">
                              {t.from_team.logo_url ? (
                                <img 
                                  src={t.from_team.logo_url} 
                                  alt={t.from_team.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-red-500/50"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">{t.from_team.name.substring(0, 2)}</span>
                                </div>
                              )}
                              <div className="text-right">
                                <p className="text-white font-semibold text-sm">{t.from_team.name}</p>
                                <p className="text-zinc-400 text-xs">
                                  {isDismissal ? 'Clube Anterior' : 'Vendedor'}
                                </p>
                              </div>
                            </div>

                            {/* Setas e Valor */}
                            <div className="flex flex-col items-center flex-1 mx-4">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-5 h-5 text-yellow-400" />
                                <div className="flex items-center gap-1">
                                  {isDismissal ? (
                                    <X className="w-4 h-4 text-red-400" />
                                  ) : t.is_exchange ? (
                                    <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                                  ) : (
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                  )}
                                  <span className={cn(
                                    "font-bold text-lg",
                                    isDismissal ? "text-red-400" : 
                                    t.is_exchange ? "text-blue-400" : "text-emerald-400"
                                  )}>
                                    {formatBalance(t.value)}
                                  </span>
                                </div>
                                <ArrowRight className="w-5 h-5 text-yellow-400" />
                              </div>
                              <p className="text-zinc-400 text-xs mt-1">
                                {isDismissal ? 'Dispensa' : t.is_exchange ? 'Troca' : 'Venda'}
                              </p>
                            </div>

                            {/* Destino - para dispensas mostra "Sem Clube" */}
                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <p className="text-white font-semibold text-sm">
                                  {isDismissal ? 'Sem Clube' : t.to_team.name}
                                </p>
                                <p className="text-zinc-400 text-xs">
                                  {isDismissal ? 'Destino' : 'Comprador'}
                                </p>
                              </div>
                              {isDismissal ? (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center">
                                  <Users className="w-6 h-6 text-gray-300" />
                                </div>
                              ) : t.to_team.logo_url ? (
                                <img 
                                  src={t.to_team.logo_url} 
                                  alt={t.to_team.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-green-500/50"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">{t.to_team.name.substring(0, 2)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Jogador Principal */}
                          <div className="flex items-center gap-3 pt-3 border-t border-zinc-700/50">
                            {t.player.photo_url ? (
                              <img 
                                src={t.player.photo_url} 
                                alt={t.player.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                                <span className="text-sm font-black text-white">{t.player.position}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-white font-semibold">{t.player.name}</p>
                              <Badge className="bg-purple-600 text-xs">{t.player.position}</Badge>
                            </div>
                          </div>

                          {/* Jogadores da Troca (se for troca) */}
                          {t.is_exchange && <ExchangePlayers transfer={t} />}
                        </div>
                      )}
                    </Card>
                  )
                })}
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