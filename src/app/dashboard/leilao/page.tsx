'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Gavel, 
  Clock, 
  DollarSign, 
  Trophy,
  Lock,
  Zap
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
import { auctionFinalizer } from '@/lib/supabase/realtime/auction-finalizer'

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
}

interface Team {
  id: string
  name: string
  logo_url: string
  balance: number
}

type TabType = 'active' | 'pending' | 'finished'

const formatToMillions = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return value.toLocaleString('pt-BR')
}

export default function PaginaLeilao() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [finalizingAuctions, setFinalizingAuctions] = useState<Set<string>>(new Set())
  const [auctionTimers, setAuctionTimers] = useState<{[key: string]: number}>({}) // 🔥 NOVO ESTADO

  // Hooks e refs
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

  const subscriptionsRef = useRef<any[]>([])
  const processedWinsRef = useRef<Set<string>>(new Set())

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
      subscriptionsRef.current.forEach(sub => {
        supabase.removeChannel(sub)
      })
    }
  }, [])

  // 🔧 CONFIGURAÇÃO REALTIME OTIMIZADA (SOLUÇÃO 2)
  useEffect(() => {
    if (!user || !team) return

    console.log('🚀 Configurando REALTIME otimizado...')
    
    let isConnected = true
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5
    let auctionsChannel: any = null
    let balanceChannel: any = null

    const setupChannels = () => {
      // CANAL 1: LEILÕES (prioritário)
      auctionsChannel = supabase
        .channel('auctions_updates_fast', {
          config: {
            broadcast: { self: false },
            presence: { key: 'auctions' }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auctions',
          },
          async (payload) => {
            console.log('⚡ Atualização RÁPIDA de leilão:', payload.eventType)
            if (payload.new) {
              await handleAuctionUpdate(payload.new.id)
            }
          }
        )
        .on('system', { event: 'disconnect' }, () => {
          console.warn('⚠️ WebSocket desconectado - Tentando reconectar...')
          isConnected = false
          
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = 1000 * Math.pow(2, reconnectAttempts) // 1s, 2s, 4s, 8s, 16s
            console.log(`🔄 Tentativa ${reconnectAttempts + 1} em ${delay}ms`)
            
            setTimeout(() => {
              reconnectAttempts++
              if (auctionsChannel) supabase.removeChannel(auctionsChannel)
              if (balanceChannel) supabase.removeChannel(balanceChannel)
              setupChannels()
            }, delay)
          } else {
            console.error('❌ Máximo de tentativas de reconexão atingido')
            // Fallback: recarrega dados uma vez
            loadAuctions()
            loadPendingReserves(team.id)
          }
        })
        .on('system', { event: 'reconnect' }, () => {
          console.log('✅ WebSocket reconectado com sucesso!')
          isConnected = true
          reconnectAttempts = 0
        })
        .subscribe((status) => {
          console.log('📡 Status do canal de leilões:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Canal de leilões ATIVO')
          }
        })

      // CANAL 2: SALDO (separado)
      balanceChannel = supabase
        .channel(`team_balance_${team.id}_fast`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'teams',
            filter: `id=eq.${team.id}`
          },
          (payload) => {
            console.log('⚡ Saldo atualizado RÁPIDO:', payload.new.balance)
            setTeam(prev => prev ? { 
              ...prev, 
              balance: payload.new.balance
            } : null)
          }
        )
        .subscribe((status) => {
          console.log('💰 Status do canal de saldo:', status)
        })

      subscriptionsRef.current = [auctionsChannel, balanceChannel]
    }

    setupChannels()

    // MONITORAMENTO DE CONEXÃO
    const checkConnectionInterval = setInterval(() => {
      if (!isConnected) {
        console.log('🔍 Verificando conexão...')
        // Força recarga se desconectado por mais de 30s
        loadAuctions()
        if (team.id) loadPendingReserves(team.id)
      }
    }, 30000)

    return () => {
      console.log('🧹 Limpando canais realtime...')
      isConnected = false
      clearInterval(checkConnectionInterval)
      
      if (auctionsChannel) supabase.removeChannel(auctionsChannel)
      if (balanceChannel) supabase.removeChannel(balanceChannel)
      
      subscriptionsRef.current = []
    }
  }, [user, team])

  // 🔥 NOVO: Sincroniza timers a cada 3 segundos
  useEffect(() => {
    if (auctions.length === 0) return

    const syncTimers = async () => {
      const activeAuctions = auctions.filter(a => a.status === 'active')
      
      for (const auction of activeAuctions) {
        try {
          const syncTime = await auctionFinalizer.getSynchronizedRemainingTime(auction.id)
          
          setAuctionTimers(prev => ({
            ...prev,
            [auction.id]: syncTime
          }))
          
          // Se tempo acabou, finaliza
          if (syncTime <= 0 && !finalizingAuctions.has(auction.id)) {
            console.log(`⏰ TEMPO ESGOTADO (sincronizado): ${auction.id}`)
            handleForceFinish(auction.id)
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao sincronizar timer ${auction.id}:`, error)
        }
      }
    }

    // Sincroniza imediatamente
    syncTimers()
    
    // Sincroniza a cada 3 segundos
    const syncInterval = setInterval(syncTimers, 3000)
    
    return () => clearInterval(syncInterval)
  }, [auctions, finalizingAuctions])

  // 🔥 NOVO: Timer local como fallback (atualização suave a cada segundo)
  useEffect(() => {
    if (auctions.length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      
      setAuctionTimers(prev => {
        const newTimers = { ...prev }
        
        auctions.forEach(auction => {
          if (auction.status === 'active' && auction.end_time) {
            const endTime = new Date(auction.end_time).getTime()
            const localRemaining = Math.max(0, endTime - now)
            
            // Mantém o valor atual se não houver sincronização recente
            if (!newTimers[auction.id] || Math.abs(newTimers[auction.id] - localRemaining) > 5000) {
              newTimers[auction.id] = localRemaining
            }
          } else {
            newTimers[auction.id] = 0
          }
        })
        
        return newTimers
      })
      
    }, 1000) // Atualiza a cada segundo para contagem suave

    return () => clearInterval(interval)
  }, [auctions])

  // 🔥 NOVO: Verifica leilões expirados a cada 30 segundos
  useEffect(() => {
    const checkExpiredInterval = setInterval(() => {
      auctionFinalizer.checkAndFinalizeExpiredAuctions()
    }, 30000)

    return () => clearInterval(checkExpiredInterval)
  }, [])

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
        const auctionsWithTime = auctionsData.map(auction => {
          // Calcula tempo local inicial
          const timeRemaining = auction.end_time && auction.status === 'active' 
            ? Math.max(0, new Date(auction.end_time).getTime() - Date.now())
            : 0
          
          // Armazena no estado de timers
          setAuctionTimers(prev => ({
            ...prev,
            [auction.id]: timeRemaining
          }))
          
          return {
            ...auction,
            time_remaining: timeRemaining
          }
        })
        
        setAuctions(auctionsWithTime)
        
        // Sincroniza timers com servidor em background
        setTimeout(async () => {
          const activeAuctions = auctionsWithTime.filter(a => a.status === 'active')
          for (const auction of activeAuctions) {
            try {
              const syncTime = await auctionFinalizer.getSynchronizedRemainingTime(auction.id)
              setAuctionTimers(prev => ({
                ...prev,
                [auction.id]: syncTime
              }))
            } catch (error) {
              console.warn(`⚠️ Erro ao sincronizar timer inicial ${auction.id}:`, error)
            }
          }
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar leilões:', error)
      toast.error('Erro ao carregar leilões')
    }
  }

  const handleAuctionUpdate = async (auctionId: string) => {
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

      if (error) {
        console.error('❌ Erro ao buscar leilão:', error)
        return
      }

      if (fullAuction) {
        // Calcula tempo sincronizado
        let timeRemaining = 0
        if (fullAuction.end_time && fullAuction.status === 'active') {
          try {
            timeRemaining = await auctionFinalizer.getSynchronizedRemainingTime(auctionId)
          } catch (syncError) {
            // Fallback: tempo local
            const endTime = new Date(fullAuction.end_time).getTime()
            const now = Date.now()
            timeRemaining = Math.max(0, endTime - now)
          }
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
        
        // Atualiza timer no estado
        setAuctionTimers(prev => ({
          ...prev,
          [auctionId]: timeRemaining
        }))
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar leilão:', error)
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
      const { error } = await supabase
        .from('auctions')
        .update({ 
          status: 'active',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 5 * 60000).toISOString()
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
      // Primeiro deletar os bids
      await supabase
        .from('bids')
        .delete()
        .eq('auction_id', auctionId)

      // Depois deletar o leilão
      await supabase
        .from('auctions')
        .delete()
        .eq('id', auctionId)

      toast.success('Leilão cancelado!')
      await loadAuctions()

      if (team?.id) {
        await loadPendingReserves(team.id)
      }

    } catch (error: any) {
      console.error('❌ Erro ao cancelar leilão:', error)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const handleForceFinish = async (auctionId: string) => {
    if (!confirm('Forçar finalização do leilão?')) return
    
    try {
      setFinalizingAuctions(prev => new Set(prev).add(auctionId))
      
      const result = await auctionFinalizer.finalizeAuction(auctionId)
      
      if (result?.success) {
        toast.success('Leilão finalizado!')
        await loadAuctions()
      } else {
        toast.error(result?.error || 'Erro ao finalizar leilão')
      }
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setTimeout(() => {
        setFinalizingAuctions(prev => {
          const newSet = new Set(prev)
          newSet.delete(auctionId)
          return newSet
        })
      }, 3000)
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
                      onForceFinish={handleForceFinish}
                      isAdmin={isAdmin}
                      finalizing={finalizingAuctions.has(auction.id)}
                      synchronizedTime={auctionTimers[auction.id]} // 🔥 TIMER SINCRONIZADO
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
    </div>
  )
}