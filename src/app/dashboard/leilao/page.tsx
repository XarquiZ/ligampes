'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Gavel, 
  Clock, 
  DollarSign, 
  Trophy,
  Lock,
  Zap,
  Award,
  Frown,
  PartyPopper,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'

// Componentes
import { AuctionCard } from '@/components/leilao/auction-card'
import { CreateAuctionModal } from '@/components/leilao/create-auction-modal'
import { SaldoUpdateIndicator } from '@/components/leilao/saldo-update-indicator'
import { useSaldoReservado } from '@/hooks/use-saldo-reservado'
import { WinnerCelebrationModal } from '@/components/leilao/winner-celebration-modal'
import { ConsolationModal } from '@/components/leilao/consolation-modal'

interface Player {
  id: string
  name: string
  position: string
  overall: number
  photo_url: string | null
}

interface Auction {
  id: string
  player_id: string
  start_price: number
  current_bid: number
  current_bidder: string | null
  status: 'pending' | 'active' | 'finished'
  start_time: string
  end_time: string | null
  player?: Player
  current_bidder_team?: {
    name: string
    logo_url: string
  }
  time_remaining?: number
  auction_duration?: number
}

interface Team {
  id: string
  name: string
  logo_url: string
  balance: number
}

export interface FinishedAuctionResult {
  auctionId: string
  auction: Auction
  isWinner: boolean
  playerName: string
  winningAmount: number
  winningTeamName?: string
}

type TabType = 'active' | 'pending' | 'finished'

const formatToMillions = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return value.toLocaleString('pt-BR')
}

// Função para formatar o tempo restante de forma mais legível para durações longas
const formatTimeRemaining = (milliseconds: number) => {
  if (milliseconds <= 0) return '00:00:00'

  const totalSeconds = Math.floor(milliseconds / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  // Se tiver mais de 1 dia: Retorna "2d 05:30:00"
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Se tiver horas (menos de 1 dia): Retorna "10:12:26"
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Se tiver apenas minutos: Retorna "00:12:26"
  return `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function PaginaLeilao() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [finishedAuctionResults, setFinishedAuctionResults] = useState<FinishedAuctionResult[]>([])
  
  // Modal states
  const [winnerCelebrationOpen, setWinnerCelebrationOpen] = useState(false)
  const [consolationModalOpen, setConsolationModalOpen] = useState(false)
  const [currentFinishedResult, setCurrentFinishedResult] = useState<FinishedAuctionResult | null>(null)

  // Hooks
  const {
    saldoReservado,
    lastUpdate,
    lastSaldoUpdate,
    reservarSaldo,
    liberarSaldo,
    debitarSaldoVencedor,
    getSaldoReservado,
    getSaldoReservadoParaLeilao,
    loadPendingReserves,
    temSaldoReservado,
    isLoading: isLoadingSaldo
  } = useSaldoReservado({
    teamId: team?.id,
    enableRealtime: true
  })

  // Função segura para evitar erros
  const safeTemSaldoReservado = useCallback((auctionId: string) => {
    if (!temSaldoReservado) return false
    try {
      return temSaldoReservado(auctionId)
    } catch (error) {
      console.error('Erro em temSaldoReservado:', error)
      return false
    }
  }, [temSaldoReservado])

  // Carregamento inicial
  useEffect(() => {
    loadInitialData()
    
    return () => {
      // Limpeza será feita no useEffect do WebSocket
    }
  }, [])

  // ⚡ WEB SOCKET SIMPLIFICADO - APENAS LANCES EM TEMPO REAL
  useEffect(() => {
    if (!user || !team) return

    console.log('🔌 Configurando WebSocket para lances em tempo real...')
    
    // CANAL ÚNICO para todos os leilões
    const channel = supabase.channel('auctions-essential')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
        },
        async (payload) => {
          console.log('📡 Update de leilão:', payload.eventType, payload.new?.id)
          
          // ⚡ ATUALIZAÇÃO DE LANCE
          if (payload.eventType === 'UPDATE' && payload.new) {
            const oldStatus = payload.old?.status
            const newStatus = payload.new.status
            
            // Verificar se o leilão acabou de ser finalizado
            if (oldStatus === 'active' && newStatus === 'finished') {
              await handleAuctionFinished(payload.new.id)
            }
            
            // Atualiza APENAS o leilão específico
            await updateSingleAuction(payload.new.id)
          }
          
          // ⚡ NOVO LEILÃO CRIADO
          if (payload.eventType === 'INSERT' && payload.new) {
            // Recarrega a lista completa
            await loadAuctions()
          }
          
          // ⚡ LEILÃO DELETADO/CANCELADO
          if (payload.eventType === 'DELETE' && payload.old) {
            // Remove da lista local
            setAuctions(prev => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do WebSocket:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ WebSocket ativo para lances em tempo real')
        }
      })

    // Monitoramento de desconexão
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Página visível, verificando conexão...')
        loadAuctions()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      console.log('🧹 Limpando WebSocket...')
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, team])

  // Funções principais
  const loadInitialData = async () => {
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('❌ Usuário não autenticado')
        setLoading(false)
        return
      }

      setUser(session.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          teams (*)
        `)
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setIsAdmin(profile?.role === 'admin')
        if (profile.teams) {
          setTeam(profile.teams)
          // Carregar saldos reservados
          loadPendingReserves(profile.teams.id)
        }
      }

      await loadAuctions()
      toast.success('Dados carregados com sucesso!')

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do leilão')
    } finally {
      setLoading(false)
    }
  }

  const loadAuctions = async () => {
    try {
      const { data: auctionsData, error } = await supabase
        .from('auctions')
        .select(`
          *,
          player:players(*),
          current_bidder_team:teams!auctions_current_bidder_fkey(name, logo_url)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar leilões:', error)
        throw error
      }

      if (auctionsData) {
        // ⚡ TODOS CALCULAM COM O MESMO end_time DO BANCO
        const auctionsWithTime = auctionsData.map(auction => {
          let timeRemaining = 0
          if (auction.end_time && auction.status === 'active') {
            const endTime = new Date(auction.end_time).getTime()
            const now = Date.now()
            timeRemaining = Math.max(0, endTime - now)
          }
          
          return {
            ...auction,
            time_remaining: timeRemaining
          }
        })
        
        setAuctions(auctionsWithTime)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar leilões:', error)
      toast.error('Erro ao carregar leilões')
    }
  }

  // ⚡ FUNÇÃO QUE ATUALIZA UM LEILÃO ESPECÍFICO
  const updateSingleAuction = async (auctionId: string) => {
    try {
      const { data: fullAuction, error } = await supabase
        .from('auctions')
        .select(`
          *,
          player:players(*),
          current_bidder_team:teams!auctions_current_bidder_fkey(name, logo_url)
        `)
        .eq('id', auctionId)
        .single()

      if (error || !fullAuction) {
        console.error('❌ Erro ao buscar leilão:', error)
        return
      }

      // ⚡ CRONÔMETRO IGUAL PARA TODOS
      let timeRemaining = 0
      if (fullAuction.end_time && fullAuction.status === 'active') {
        // Usa end_time do BANCO (igual para todos)
        const endTime = new Date(fullAuction.end_time).getTime()
        const now = Date.now()
        timeRemaining = Math.max(0, endTime - now)
      }

      const updatedAuction = {
        ...fullAuction,
        time_remaining: timeRemaining
      }

      setAuctions(prev => {
        const index = prev.findIndex(a => a.id === auctionId)
        if (index >= 0) {
          const newAuctions = [...prev]
          newAuctions[index] = updatedAuction
          return newAuctions
        } else {
          return [updatedAuction, ...prev]
        }
      })

      console.log(`⚡ Leilão ${auctionId} atualizado em tempo real`)

    } catch (error) {
      console.error('❌ Erro ao atualizar leilão:', error)
    }
  }

  // Função para lidar com leilão finalizado
  const handleAuctionFinished = async (auctionId: string) => {
    try {
      const { data: auction, error } = await supabase
        .from('auctions')
        .select(`
          *,
          player:players(*),
          current_bidder_team:teams!auctions_current_bidder_fkey(name, logo_url)
        `)
        .eq('id', auctionId)
        .single()

      if (error || !auction) {
        console.error('❌ Erro ao buscar leilão finalizado:', error)
        return
      }

      const isWinner = auction.current_bidder === team?.id
      const result: FinishedAuctionResult = {
        auctionId: auction.id,
        auction,
        isWinner,
        playerName: auction.player?.name || 'Jogador',
        winningAmount: auction.current_bid,
        winningTeamName: auction.current_bidder_team?.name
      }

      // Adicionar ao histórico de resultados
      setFinishedAuctionResults(prev => [...prev, result])

      // Mostrar modal apropriado
      if (isWinner) {
        setCurrentFinishedResult(result)
        setTimeout(() => {
          setWinnerCelebrationOpen(true)
        }, 1000) // Pequeno delay para transição
      } else if (auction.current_bidder) {
        // Verificar se o time participou do leilão
        const { data: bids } = await supabase
          .from('bids')
          .select('*')
          .eq('auction_id', auctionId)
          .eq('team_id', team?.id)
          .limit(1)

        if (bids && bids.length > 0) {
          // O time participou mas não ganhou
          setCurrentFinishedResult(result)
          setTimeout(() => {
            setConsolationModalOpen(true)
          }, 1000)
        }
      }

      // Atualizar saldo reservado
      if (team?.id) {
        await loadPendingReserves(team.id)
      }

    } catch (error) {
      console.error('❌ Erro ao processar leilão finalizado:', error)
    }
  }

  const handlePlaceBid = async (auctionId: string, amount: number) => {
    if (!team?.id) {
      toast.error('❌ Você precisa ter um time para dar lances.')
      return
    }

    try {
      const { data, error } = await supabase.rpc('place_bid_atomic', {
        p_auction_id: auctionId,
        p_team_id: team.id,
        p_amount: amount
      })

      if (error) {
        console.error('❌ Erro na RPC:', error)
        toast.error(`Erro: ${error.message}`)
        return
      }

      if (data?.success) {
        toast.success(data.message || 'Lance realizado com sucesso!')
        
        // ⚡ ATUALIZA LOCALMENTE TAMBÉM (feedback imediato)
        setTimeout(() => {
          updateSingleAuction(auctionId)
        }, 500)
        
        if (team.id) {
          loadPendingReserves(team.id)
        }
      } else {
        toast.error(data?.error || 'Erro ao processar lance')
      }
    } catch (error: any) {
      console.error('❌ ERRO NO LANCE:', error)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const handleStartAuction = async (auctionId: string) => {
    try {
      const auction = auctions.find(a => a.id === auctionId)
      if (!auction) return

      // Obter a duração do leilão (se disponível)
      const durationMinutes = auction.auction_duration || 5
      
      const { error } = await supabase
        .from('auctions')
        .update({ 
          status: 'active',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + durationMinutes * 60000).toISOString()
        })
        .eq('id', auctionId)

      if (error) throw error

      toast.success('Leilão iniciado!')
      await loadAuctions()
      setActiveTab('active')

    } catch (error: any) {
      console.error('❌ Erro ao iniciar leilão:', error)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const handleCancelAuction = async (auctionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este leilão?')) return
  
    try {
      console.log(`🗑️ Tentando cancelar leilão: ${auctionId}`)
      
      // 1. Primeiro, verificar se há lances no leilão
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
  
      if (bidsError) throw bidsError
  
      // 2. Se houver lances, primeiro liberar o saldo reservado dos times
      if (bids && bids.length > 0) {
        console.log(`📊 Encontrados ${bids.length} lances no leilão`)
        
        // Agrupar lances por time
        const teamIds = [...new Set(bids.map(bid => bid.team_id))]
        
        // Para cada time, liberar o saldo reservado
        for (const teamId of teamIds) {
          const teamBids = bids.filter(bid => bid.team_id === teamId)
          const highestBid = Math.max(...teamBids.map(bid => bid.amount))
          
          // Atualizar saldo do time
          const { error: updateError } = await supabase.rpc('liberar_saldo_reservado', {
            p_team_id: teamId,
            p_auction_id: auctionId,
            p_amount: highestBid
          })
          
          if (updateError) {
            console.error(`❌ Erro ao liberar saldo do time ${teamId}:`, updateError)
          } else {
            console.log(`✅ Saldo liberado para o time ${teamId}`)
          }
        }
      }
  
      // 3. Depois deletar todos os lances
      const { error: deleteBidsError } = await supabase
        .from('bids')
        .delete()
        .eq('auction_id', auctionId)
  
      if (deleteBidsError) throw deleteBidsError
      console.log('✅ Todos os lances deletados')
  
      // 4. Finalmente deletar o leilão
      const { error: deleteAuctionError } = await supabase
        .from('auctions')
        .delete()
        .eq('id', auctionId)
  
      if (deleteAuctionError) throw deleteAuctionError
      console.log('✅ Leilão deletado')
  
      toast.success('Leilão cancelado com sucesso!')
      
      // Recarregar dados
      await loadAuctions()
      
      if (team?.id) {
        await loadPendingReserves(team.id)
      }
  
    } catch (error: any) {
      console.error('❌ Erro completo ao cancelar leilão:', error)
      
      if (error.code === '23503') {
        toast.error('Não foi possível cancelar o leilão. Existem referências ativas. Tente novamente.')
      } else {
        toast.error(`Erro: ${error.message || 'Falha ao cancelar leilão'}`)
      }
    }
  }

  const getSaldoDisponivel = () => {
    if (!team) return 0
    const saldoReservadoTotal = getSaldoReservado()
    return team.balance - saldoReservadoTotal
  }

  const getAuctionsByTab = () => {
    return auctions.filter(auction => {
      switch (activeTab) {
        case 'active': return auction.status === 'active'
        case 'pending': return auction.status === 'pending'
        case 'finished': return auction.status === 'finished'
        default: return false
      }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl text-white animate-pulse">Carregando leilão...</p>
        </div>
      </div>
    )
  }

  const tabAuctions = getAuctionsByTab()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar user={user} team={team} />
      
      <div className="flex-1 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-orange-950/20 to-zinc-950 text-white p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2">LEILÃO DE JOGADORES</h1>
                <p className="text-zinc-400 text-sm md:text-lg">
                  Adquira os melhores jogadores livres no mercado
                </p>
              </div>

              {/* Info do time */}
              {team && (
                <div className="w-full lg:w-auto">
                  <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 backdrop-blur-lg rounded-2xl p-4 border border-zinc-700/50 shadow-xl">
                    <div className="flex items-center gap-4">
                      {team.logo_url && (
                        <img 
                          src={team.logo_url} 
                          alt={team.name}
                          className="w-12 h-12 rounded-full border-2 border-orange-500/50 object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">{team.name}</h3>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-green-300 font-medium">Disponível</span>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-white">
                              R$ {formatToMillions(getSaldoDisponivel())}
                            </p>
                            <SaldoUpdateIndicator 
                              lastSaldoUpdate={lastSaldoUpdate} 
                              className="mt-1"
                            />
                          </div>
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Lock className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs text-yellow-300 font-medium">Reservado</span>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-white">
                              R$ {formatToMillions(getSaldoReservado())}
                            </p>
                            <SaldoUpdateIndicator 
                              lastSaldoUpdate={lastSaldoUpdate} 
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="mt-3 bg-zinc-800/50 rounded-lg p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Saldo Total:</span>
                            <span className="text-base md:text-lg font-bold text-white">
                              R$ {formatToMillions(team.balance)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <SaldoUpdateIndicator 
                              lastSaldoUpdate={lastSaldoUpdate} 
                              className="text-xs"
                            />
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400">Auto-atualizando</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão criar leilão (admin) */}
              {isAdmin && (
                <Button 
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg w-full lg:w-auto mt-4 lg:mt-0"
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Criar Leilão
                </Button>
              )}
            </div>

            {/* Abas */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-zinc-800/50 rounded-lg p-1">
                <Button
                  variant={activeTab === 'active' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('active')}
                  className={cn(
                    "flex-1 transition-all duration-200",
                    activeTab === 'active' 
                      ? "bg-orange-600 text-white shadow-lg" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                  )}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Abertos
                  {auctions.filter(a => a.status === 'active').length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-red-500 text-white">
                      {auctions.filter(a => a.status === 'active').length}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant={activeTab === 'pending' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('pending')}
                  className={cn(
                    "flex-1 transition-all duration-200",
                    activeTab === 'pending' 
                      ? "bg-yellow-600 text-white shadow-lg" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                  )}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Agendados
                  {auctions.filter(a => a.status === 'pending').length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white">
                      {auctions.filter(a => a.status === 'pending').length}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant={activeTab === 'finished' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('finished')}
                  className={cn(
                    "flex-1 transition-all duration-200",
                    activeTab === 'finished' 
                      ? "bg-green-600 text-white shadow-lg" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                  )}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Finalizados
                  {auctions.filter(a => a.status === 'finished').length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-green-500 text-white">
                      {auctions.filter(a => a.status === 'finished').length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Lista de leilões */}
            <div className="min-h-[400px]">
              {tabAuctions.length === 0 ? (
                <div className="p-8 md:p-16 text-center bg-white/5 border-white/10 rounded-lg">
                  {activeTab === 'active' && <Gavel className="w-12 h-12 md:w-16 md:h-16 text-zinc-600 mx-auto mb-4" />}
                  {activeTab === 'pending' && <Clock className="w-12 h-12 md:w-16 md:h-16 text-zinc-600 mx-auto mb-4" />}
                  {activeTab === 'finished' && <Trophy className="w-12 h-12 md:w-16 md:h-16 text-zinc-600 mx-auto mb-4" />}
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    {activeTab === 'active' && 'Nenhum leilão ativo'}
                    {activeTab === 'pending' && 'Nenhum leilão agendado'}
                    {activeTab === 'finished' && 'Nenhum leilão finalizado'}
                  </h3>
                  <p className="text-zinc-400 text-sm md:text-base">
                    {activeTab === 'active' && (isAdmin 
                      ? 'Crie um leilão ou inicie um leilão agendado!' 
                      : 'Aguarde o administrador iniciar um leilão.'
                    )}
                    {activeTab === 'pending' && (isAdmin 
                      ? 'Crie um leilão agendado para aparecer aqui!' 
                      : 'Aguarde o administrador agendar um leilão.'
                    )}
                    {activeTab === 'finished' && 'Os leilões finalizados aparecerão aqui'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {tabAuctions.map(auction => (
                    <AuctionCard 
                      key={auction.id} 
                      auction={auction} 
                      type={activeTab}
                      onBid={handlePlaceBid}
                      team={team}
                      saldoReservado={saldoReservado}
                      getSaldoReservadoParaLeilao={getSaldoReservadoParaLeilao}
                      temSaldoReservado={safeTemSaldoReservado}
                      onCancelAuction={handleCancelAuction}
                      onStartAuction={handleStartAuction}
                      isAdmin={isAdmin}
                      formatTimeRemaining={formatTimeRemaining}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de criação */}
      <CreateAuctionModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          loadAuctions()
          setActiveTab('pending')
        }}
      />

      {/* Modal de celebração do vencedor */}
      <WinnerCelebrationModal 
        open={winnerCelebrationOpen}
        onOpenChange={setWinnerCelebrationOpen}
        result={currentFinishedResult}
      />

      {/* Modal de consolação */}
      <ConsolationModal 
        open={consolationModalOpen}
        onOpenChange={setConsolationModalOpen}
        result={currentFinishedResult}
      />
    </div>
  )
}