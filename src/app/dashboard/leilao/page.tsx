// src/app/dashboard/leilao/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Gavel, 
  Clock, 
  User, 
  DollarSign, 
  Play, 
  Trophy,
  Timer,
  Minus,
  Crown,
  Calendar,
  RefreshCw,
  AlertCircle,
  Lock,
  Trash2,
  PartyPopper,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'
import { toast } from 'sonner'

interface Player {
  id: string
  name: string
  position: string
  overall: number
  team_id: string | null
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
  created_by: string
  auction_duration?: number
  player?: Player
  current_bidder_team?: {
    name: string
    logo_url: string
  }
  time_remaining?: number
  updated_at?: string
  synchronized_end_time?: number
}

interface Bid {
  id: string
  auction_id: string
  team_id: string
  amount: number
  created_at: string
  is_leading?: boolean
  team?: {
    name: string
    logo_url: string
  }
}

interface Team {
  id: string
  name: string
  logo_url: string
  balance: number
  updated_at?: string
  last_balance_update?: string
}

interface UserProfile {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

type TabType = 'active' | 'pending' | 'finished'

interface WinNotification {
  auctionId: string
  playerName: string
  amount: number
  teamName: string
  show: boolean
  timestamp: number
}

interface BidCoveredNotification {
  auctionId: string
  playerName: string
  coveredAmount: number
  show: boolean
  timestamp: number
}

// Formatar valores para exibição (ex: 50M)
const formatToMillions = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return value.toLocaleString('pt-BR')
}


const refreshSingleAuction = async (auctionId: string) => {
  try {
    const { data: updatedAuction, error } = await supabase
      .from('auctions')
      .select(`
        *,
        player:players(*),
        current_bidder_team:teams!auctions_current_bidder_fkey(name, logo_url)
      `)
      .eq('id', auctionId)
      .single();
    
    if (error) {
      console.error('Erro ao atualizar leilão:', error);
      return;
    }
    
    if (updatedAuction) {
      setAuctions(prev => {
        const index = prev.findIndex(a => a.id === auctionId);
        if (index >= 0) {
          const newAuctions = [...prev];
          newAuctions[index] = {
            ...updatedAuction,
            time_remaining: updatedAuction.end_time && updatedAuction.status === 'active' 
              ? Math.max(0, new Date(updatedAuction.end_time).getTime() - serverTime)
              : 0,
            synchronized_end_time: updatedAuction.end_time ? 
              new Date(updatedAuction.end_time).getTime() : undefined
          };
          return newAuctions;
        }
        return prev;
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar leilão individual:', error);
  }
};

// Gerar opções de lance
const generateBidOptions = (currentBid: number): { value: number; label: string }[] => {
  const options = []
  const minBid = currentBid + 1000000 // Lance mínimo: 1 milhão acima
  
  for (let i = 0; i < 20; i++) {
    const bidValue = minBid + (i * 1000000)
    options.push({
      value: bidValue,
      label: `${formatToMillions(bidValue)}`
    })
  }
  
  return options
}

// Classe para gerenciar sincronização de finalização
class AuctionFinalizer {
  private static instance: AuctionFinalizer
  private processingSet: Set<string> = new Set()
  private notificationQueue: Map<string, WinNotification> = new Map()
  private callbacks: Map<string, Function[]> = new Map()
  private lastSyncTime: number = 0
  private syncInterval: NodeJS.Timeout | null = null

  static getInstance(): AuctionFinalizer {
    if (!AuctionFinalizer.instance) {
      AuctionFinalizer.instance = new AuctionFinalizer()
    }
    return AuctionFinalizer.instance
  }

  async finalizeAuction(auctionId: string, serverTimeOffset: number): Promise<any> {
    if (this.processingSet.has(auctionId)) {
      console.log(`⏳ Leilão ${auctionId} já está sendo finalizado, aguardando...`)
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.processingSet.has(auctionId)) {
            clearInterval(checkInterval)
            resolve({ alreadyProcessed: true })
          }
        }, 500)
      })
    }

    this.processingSet.add(auctionId)
    
    try {
      console.log(`🔄 FINALIZANDO LEILÃO PARA TODOS: ${auctionId}`)
      
      // Usar função RPC que garante finalização atômica
      const { data, error } = await supabase.rpc('finalize_expired_auction', {
        p_auction_id: auctionId
      })

      if (error) {
        console.error(`❌ Erro ao finalizar leilão ${auctionId}:`, error)
        throw error
      }

      console.log(`✅ LEILÃO FINALIZADO PARA TODOS:`, data)

      // Notificar todos os ouvintes
      this.notifyListeners(auctionId, data)
      
      return data

    } finally {
      // Remover após 5 segundos para evitar conflitos
      setTimeout(() => {
        this.processingSet.delete(auctionId)
      }, 5000)
    }
  }

  registerCallback(auctionId: string, callback: Function) {
    if (!this.callbacks.has(auctionId)) {
      this.callbacks.set(auctionId, [])
    }
    this.callbacks.get(auctionId)!.push(callback)
  }

  unregisterCallback(auctionId: string, callback: Function) {
    if (this.callbacks.has(auctionId)) {
      const callbacks = this.callbacks.get(auctionId)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private notifyListeners(auctionId: string, data: any) {
    if (this.callbacks.has(auctionId)) {
      this.callbacks.get(auctionId)!.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Erro ao notificar callback:', error)
        }
      })
    }
  }

  addWinNotification(notification: WinNotification) {
    this.notificationQueue.set(notification.auctionId, notification)
  }

  getWinNotification(auctionId: string): WinNotification | null {
    return this.notificationQueue.get(auctionId) || null
  }

  clearNotification(auctionId: string) {
    this.notificationQueue.delete(auctionId)
  }

  startSyncService() {
    if (this.syncInterval) return
    
    this.syncInterval = setInterval(async () => {
      try {
        this.lastSyncTime = Date.now()
      } catch (error) {
        console.error('Erro no serviço de sincronização:', error)
      }
    }, 30000)
  }

  stopSyncService() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

// Hook para saldo reservado - ATUALIZADO COM POLLING DE 1 SEGUNDO
const useSaldoReservado = (teamId: string | null) => {
  const [saldoReservado, setSaldoReservado] = useState<{[key: string]: number}>({})
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [isLoading, setIsLoading] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout>()
  const lastFetchedRef = useRef<{[key: string]: number}>({})

  const loadPendingReserves = useCallback(async (teamId: string, force: boolean = false) => {
    if (!teamId) return
    
    const now = Date.now()
    const cacheKey = `saldo_${teamId}`
    
    // Cache de 500ms para evitar chamadas excessivas
    if (!force && lastFetchedRef.current[cacheKey] && 
        now - lastFetchedRef.current[cacheKey] < 500) {
      return
    }
    
    setIsLoading(true)
    try {
      // Buscar APENAS leilões ATIVOS com reservas pendentes
      const { data: pendingTransactions, error } = await supabase
        .from('balance_transactions')
        .select(`
          amount,
          auction_id,
          auctions!inner (
            id,
            status
          )
        `)
        .eq('team_id', teamId)
        .eq('type', 'bid_pending')
        .eq('is_processed', false)
        .eq('auctions.status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar transações pendentes:', error)
        return
      }

      const reserves: {[key: string]: number} = {}
      pendingTransactions?.forEach(transaction => {
        if (transaction.auction_id) {
          reserves[transaction.auction_id] = transaction.amount
        }
      })

      setSaldoReservado(reserves)
      setLastUpdate(now)
      lastFetchedRef.current[cacheKey] = now

    } catch (error) {
      console.error('❌ Erro ao carregar saldos reservados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Iniciar polling automático de 1 segundo
  useEffect(() => {
    if (!teamId) return
    
    console.log('🔄 Iniciando polling de saldo reservado para time:', teamId)
    
    // Carregar imediatamente
    loadPendingReserves(teamId, true)
    
    // Configurar polling a cada 1 segundo
    pollingIntervalRef.current = setInterval(() => {
      loadPendingReserves(teamId, false)
    }, 1000)
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = undefined
      }
    }
  }, [teamId, loadPendingReserves])

  const liberarSaldo = async (auctionId: string, teamId: string) => {
    if (!auctionId || !teamId) return
    
    try {
      setSaldoReservado(prev => {
        const novo = { ...prev }
        delete novo[auctionId]
        return novo
      })

      setLastUpdate(Date.now())
      
    } catch (error) {
      console.error('❌ Erro ao liberar saldo:', error)
    }
  }

  const debitarSaldoVencedor = async (auctionId: string, teamId: string, valor: number) => {
    if (!auctionId || !teamId || !valor) return
    
    try {
      setSaldoReservado(prev => {
        const novo = { ...prev }
        delete novo[auctionId]
        return novo
      })

      setLastUpdate(Date.now())
      
    } catch (error) {
      console.error('❌ Erro ao processar débito do vencedor:', error)
    }
  }

  const getSaldoReservado = () => {
    return Object.values(saldoReservado).reduce((total, valor) => total + valor, 0)
  }

  const verificarLeiloesAtivos = async (teamId: string, auctionIds: string[]) => {
    try {
      const leiloesParaManter: string[] = []
      
      for (const auctionId of auctionIds) {
        const { data: auction, error } = await supabase
          .from('auctions')
          .select('id, status, current_bidder')
          .eq('id', auctionId)
          .single()
        
        if (!error && auction && auction.status === 'active') {
          leiloesParaManter.push(auctionId)
        }
      }
      
      return leiloesParaManter
    } catch (error) {
      console.error('Erro ao verificar leilões ativos:', error)
      return auctionIds
    }
  }

  return {
    saldoReservado,
    isLoading,
    lastUpdate,
    liberarSaldo,
    debitarSaldoVencedor,
    getSaldoReservado,
    loadPendingReserves,
    verificarLeiloesAtivos
  }
}

// Componente para indicador de atualização de saldo
const SaldoUpdateIndicator = ({ lastUpdate }: { lastUpdate: number }) => {
  const [now, setNow] = useState(Date.now())
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  
  const secondsAgo = Math.floor((now - lastUpdate) / 1000)
  const isRecent = secondsAgo < 2
  const isStale = secondsAgo > 5
  
  return (
    <div className="flex items-center gap-1 justify-end">
      <div className={`w-2 h-2 rounded-full animate-pulse ${
        isRecent ? 'bg-green-500' : 
        isStale ? 'bg-red-500' : 
        'bg-yellow-500'
      }`} />
      <span className={`text-xs ${
        isRecent ? 'text-green-400' : 
        isStale ? 'text-red-400' : 
        'text-yellow-400'
      }`}>
        {isRecent ? 'Agora' : `${secondsAgo}s atrás`}
      </span>
    </div>
  )
}

export default function PaginaLeilao() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [createAuctionModalOpen, setCreateAuctionModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [startPrice, setStartPrice] = useState('')
  const [auctionDuration, setAuctionDuration] = useState('5')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [freePlayers, setFreePlayers] = useState<Player[]>([])
  const [creatingAuction, setCreatingAuction] = useState(false)

  const [auctions, setAuctions] = useState<Auction[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('active')

  const [biddingAuctionId, setBiddingAuctionId] = useState<string | null>(null)
  const [selectedBidAmount, setSelectedBidAmount] = useState<number | null>(null)
  const [bidding, setBidding] = useState(false)
  const [bids, setBids] = useState<{[key: string]: Bid[]}>({})

  const [winNotification, setWinNotification] = useState<WinNotification | null>(null)
  const [bidCoveredNotification, setBidCoveredNotification] = useState<BidCoveredNotification | null>(null)

  // Estados para polling
  const [lastUpdateTimes, setLastUpdateTimes] = useState<{[key: string]: number}>({})
  const [forceRefresh, setForceRefresh] = useState(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout>()
  const bidsPollingIntervalRef = useRef<NodeJS.Timeout>() // NOVO: Intervalo separado para lances

  // Estados para server time
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0)
  const [isSyncingTime, setIsSyncingTime] = useState<boolean>(false)
  const [isTimeSynced, setIsTimeSynced] = useState<boolean>(false)
  const [serverTime, setServerTime] = useState<number>(Date.now())

  // Instância do finalizador global
  const auctionFinalizer = useRef(AuctionFinalizer.getInstance())
  const [finalizingAuctions, setFinalizingAuctions] = useState<Set<string>>(new Set())

  const {
    saldoReservado,
    isLoading: isLoadingSaldo,
    lastUpdate: lastSaldoUpdate,
    liberarSaldo,
    debitarSaldoVencedor,
    getSaldoReservado,
    loadPendingReserves,
    verificarLeiloesAtivos
  } = useSaldoReservado(team?.id || null)

  const [currentTime, setCurrentTime] = useState(Date.now())

  const isProcessingRef = useRef(false)
  const subscriptionsRef = useRef<any[]>([])
  const processingAuctionsRef = useRef<Set<string>>(new Set())
  const lastBalanceUpdateRef = useRef<number>(0)

  // PATCH: Guard para evitar processar a mesma finalização duas vezes no front
  const processedWinsRef = useRef<Set<string>>(new Set())

  // Função utilitária para marcar/checar se já processamos um win localmente
  const markAsProcessedWin = (auctionId: string) => {
    processedWinsRef.current.add(auctionId)
  }
  const hasProcessedWin = (auctionId: string) => processedWinsRef.current.has(auctionId)

  // Atualizar tempo do servidor periodicamente
  useEffect(() => {
    const updateServerTime = async () => {
      try {
        const { data, error } = await supabase.rpc('get_server_time')
        if (!error && data) {
          const serverTimestamp = new Date(data).getTime()
          const localTime = Date.now()
          const offset = serverTimestamp - localTime
          
          setServerTimeOffset(offset)
          setServerTime(serverTimestamp)
          
          if (!isTimeSynced) {
            setIsTimeSynced(true)
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar tempo do servidor:', error)
      }
    }
    
    const interval = setInterval(updateServerTime, 30000)
    
    return () => clearInterval(interval)
  }, [isTimeSynced])

  // FUNÇÃO SINCRONIZAR TEMPO DO SERVIDOR
  const syncServerTime = async () => {
    if (isSyncingTime) return
    
    setIsSyncingTime(true)
    
    try {
      console.log('🕐 Sincronizando tempo com servidor...')
      
      const { data, error } = await supabase.rpc('get_server_time')
      
      if (error) {
        console.error('❌ Erro ao obter tempo do servidor:', error)
        setIsTimeSynced(true)
        return
      }
      
      const serverTimestamp = new Date(data).getTime()
      const localTime = Date.now()
      const offset = serverTimestamp - localTime
      
      setServerTimeOffset(offset)
      setServerTime(serverTimestamp)
      setIsTimeSynced(true)
      
      console.log('✅ Tempo sincronizado. Offset:', offset, 'ms')
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar tempo:', error)
      setIsTimeSynced(true)
    } finally {
      setIsSyncingTime(false)
    }
  }

  // CARREGAMENTO INICIAL
  useEffect(() => {
    loadInitialData()
    
    auctionFinalizer.current.startSyncService()
    
    return () => {
      subscriptionsRef.current.forEach(sub => {
        supabase.removeChannel(sub)
      })
      auctionFinalizer.current.stopSyncService()
      
      // Limpar intervalos de polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (bidsPollingIntervalRef.current) {
        clearInterval(bidsPollingIntervalRef.current)
      }
    }
  }, [])

  // CARREGAR SALDOS RESERVADOS QUANDO TIME MUDAR
  useEffect(() => {
    if (team?.id) {
      loadPendingReserves(team.id, true)
    }
  }, [team?.id, loadPendingReserves])

  // CONTAGEM REGRESSIVA SINCRONIZADA
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCurrentTime(now)
      
      if (serverTimeOffset !== 0) {
        setServerTime(now + serverTimeOffset)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [serverTimeOffset])

  // NOVO: POLLING DE LEILÕES ATIVOS - ATUALIZADO PARA 1 SEGUNDO
  useEffect(() => {
    if (activeTab !== 'active') {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      return
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        setForceRefresh(prev => prev + 1)
        
        const activeAuctions = auctions.filter(a => a.status === 'active')
        if (activeAuctions.length === 0) return
        
        // Buscar TODOS os leilões ativos sem filtros complexos
        const { data: recentUpdates, error } = await supabase
          .from('auctions')
          .select('id, updated_at, current_bid, current_bidder, end_time, status')
          .in('status', ['active'])
          .order('updated_at', { ascending: false })

        if (error) {
          console.error('❌ Erro ao verificar atualizações de leilões:', error)
          return
        }

        if (!recentUpdates || recentUpdates.length === 0) return

        const auctionsToUpdate: string[] = []
        const updatedTimes: {[key: string]: number} = {}
        
        recentUpdates.forEach(auction => {
          const lastUpdate = lastUpdateTimes[auction.id] || 0
          const newUpdateTime = new Date(auction.updated_at).getTime()
          updatedTimes[auction.id] = newUpdateTime
          
          // SEMPRE atualizar leilões ativos
          if (auction.status === 'active') {
            auctionsToUpdate.push(auction.id)
          }
        })

        if (auctionsToUpdate.length > 0) {
          console.log('🔄 Polling (1s): Atualizando leilões ativos:', auctionsToUpdate)
          
          const { data: updatedAuctions, error: fetchError } = await supabase
            .from('auctions')
            .select(`
              *,
              player:players(*),
              current_bidder_team:teams!auctions_current_bidder_fkey(name, logo_url)
            `)
            .in('id', auctionsToUpdate)

          if (!fetchError && updatedAuctions) {
            setAuctions(prev => {
              const newAuctions = [...prev]
              
              updatedAuctions.forEach(updatedAuction => {
                const index = newAuctions.findIndex(a => a.id === updatedAuction.id)
                if (index >= 0) {
                  const synchronizedTime = serverTime
                  newAuctions[index] = {
                    ...updatedAuction,
                    time_remaining: updatedAuction.end_time && updatedAuction.status === 'active' 
                      ? Math.max(0, new Date(updatedAuction.end_time).getTime() - synchronizedTime)
                      : 0,
                    synchronized_end_time: updatedAuction.end_time ? 
                      new Date(updatedAuction.end_time).getTime() : undefined
                  }
                }
              })
              
              return newAuctions
            })

            setLastUpdateTimes(prev => ({
              ...prev,
              ...updatedTimes
            }))
          }
        }
      } catch (error) {
        console.error('❌ Erro no polling de leilões:', error)
      }
    }, 1000) // 1 SEGUNDO

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [activeTab, auctions, serverTime])

  // NOVO: POLLING DE LANCES - ATUALIZADO PARA 1 SEGUNDO
  useEffect(() => {
    if (activeTab !== 'active') {
      if (bidsPollingIntervalRef.current) {
        clearInterval(bidsPollingIntervalRef.current)
      }
      return
    }

    const loadBidsForActiveAuctions = async () => {
      try {
        const activeAuctions = auctions.filter(a => a.status === 'active')
        if (activeAuctions.length === 0) return
        
        console.log('💰 Polling (1s): Carregando lances para', activeAuctions.length, 'leilões ativos')
        
        // Carregar lances para todos os leilões ativos
        for (const auction of activeAuctions) {
          try {
            const { data: bidsData, error } = await supabase
              .from('bids')
              .select(`
                *,
                team:teams(name, logo_url)
              `)
              .eq('auction_id', auction.id)
              .order('created_at', { ascending: false })
              .limit(10) // Limitar a 10 lances mais recentes

            if (error) {
              console.error(`❌ Erro ao carregar lances para leilão ${auction.id}:`, error)
              continue
            }
            
            if (bidsData) {
              setBids(prev => ({
                ...prev,
                [auction.id]: bidsData
              }))
            }
          } catch (error) {
            console.error(`❌ Erro ao processar lances do leilão ${auction.id}:`, error)
          }
        }
      } catch (error) {
        console.error('❌ Erro no polling de lances:', error)
      }
    }

    // Executar imediatamente
    loadBidsForActiveAuctions()
    
    // Configurar polling a cada 1 segundo
    bidsPollingIntervalRef.current = setInterval(loadBidsForActiveAuctions, 1000)

    return () => {
      if (bidsPollingIntervalRef.current) {
        clearInterval(bidsPollingIntervalRef.current)
      }
    }
  }, [activeTab, auctions])

  // VERIFICAÇÃO SINCRONIZADA DE LEILÕES EXPIRADOS
  useEffect(() => {
    if (!team || !isTimeSynced) return
    
    const checkExpiredAuctions = async () => {
      try {
        const now = serverTime
        const activeAuctions = auctions.filter(a => a.status === 'active')
        
        for (const auction of activeAuctions) {
          if (finalizingAuctions.has(auction.id) || 
              processingAuctionsRef.current.has(auction.id)) {
            continue
          }
          
          if (auction.end_time) {
            const endTime = new Date(auction.end_time).getTime()
            const timeRemaining = endTime - now
            
            if (timeRemaining <= 1000) {
              console.log(`⏰ LEILÃO EXPIRADO (sincronizado): ${auction.id}`)
              
              setFinalizingAuctions(prev => new Set(prev).add(auction.id))
              processingAuctionsRef.current.add(auction.id)
              
              try {
                const result = await auctionFinalizer.current.finalizeAuction(
                  auction.id, 
                  serverTimeOffset
                )
                
                if (result && result.success) {
                  console.log(`✅ Leilão ${auction.id} finalizado para todos os usuários`)
                  
                  // PATCH: Aplicar guard para evitar processamento duplo
                  if (team?.id && result.winner_team_id === team.id) {
                    if (!hasProcessedWin(auction.id)) {
                      markAsProcessedWin(auction.id)
                      setTimeout(() => {
                        setWinNotification({
                          auctionId: auction.id,
                          playerName: auction.player?.name || 'Jogador',
                          amount: result.final_amount || auction.current_bid,
                          teamName: team.name,
                          show: true,
                          timestamp: Date.now()
                        })
                        
                        debitarSaldoVencedor(
                          auction.id,
                          team.id,
                          result.final_amount || auction.current_bid
                        )
                      }, 1000)
                    } else {
                      console.log('Leilão já processado localmente (checkExpiredAuctions):', auction.id)
                    }
                  }
                  
                  setTimeout(() => {
                    loadAuctions()
                    if (team.id) {
                      loadPendingReserves(team.id, true)
                    }
                  }, 2000)
                }
              } catch (error) {
                console.error(`❌ Erro ao finalizar leilão ${auction.id}:`, error)
              } finally {
                setTimeout(() => {
                  setFinalizingAuctions(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(auction.id)
                    return newSet
                  })
                  processingAuctionsRef.current.delete(auction.id)
                }, 3000)
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro na verificação de leilões expirados:', error)
      }
    }
    
    const interval = setInterval(checkExpiredAuctions, 500)
    return () => clearInterval(interval)
  }, [team, auctions, isTimeSynced, serverTime, serverTimeOffset, debitarSaldoVencedor, loadPendingReserves])

  // CONFIGURAR REALTIME SUPABASE - ATUALIZADO
  useEffect(() => {
    if (!user || !team) return

    console.log('🔌 Configurando subscriptions para leilões...')

    const auctionsChannel = supabase
      .channel('auctions_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
        },
        async (payload) => {
          console.log('🔄 Atualização de leilão em tempo real:', {
            event: payload.eventType,
            id: payload.new?.id,
            status: payload.new?.status,
            old_current_bidder: payload.old?.current_bidder,
            new_current_bidder: payload.new?.current_bidder,
            team_id: team?.id
          })
          
          // Quando alguém cobre seu lance
          if (team && 
              payload.old?.current_bidder === team.id && 
              payload.new?.current_bidder !== team.id) {
            
            console.log('⚠️ USUÁRIO PERDEU A LIDERANÇA NO LEILÃO:', payload.new?.id)
            
            const { data: auctionData } = await supabase
              .from('auctions')
              .select(`
                *,
                player:players(name)
              `)
              .eq('id', payload.new?.id)
              .single()
            
            if (auctionData?.player) {
              setBidCoveredNotification({
                auctionId: payload.new?.id,
                playerName: auctionData.player.name,
                coveredAmount: payload.old?.current_bid || 0,
                show: true,
                timestamp: Date.now()
              })
              
              toast.success('💰 Seu saldo foi liberado! Lance coberto por outro time.', {
                duration: 5000,
                icon: '🔄'
              })
              
              if (team.id) {
                await liberarSaldo(payload.new?.id, team.id)
              }
            }
          }
          
          // Quando o leilão é finalizado
          if (payload.new?.status === 'finished' && payload.old?.status === 'active') {
            console.log('🏁 LEILÃO FINALIZADO VIA REALTIME:', payload.new?.id)
            
            if (payload.new?.current_bidder === team.id) {
              // PATCH: Aplicar guard para evitar processamento duplo
              if (!hasProcessedWin(payload.new.id)) {
                markAsProcessedWin(payload.new.id)
                setTimeout(() => {
                  supabase
                    .from('auctions')
                    .select(`
                      *,
                      player:players(name)
                    `)
                    .eq('id', payload.new?.id)
                    .single()
                    .then(({ data: auctionData }) => {
                      if (auctionData) {
                        setWinNotification({
                          auctionId: auctionData.id,
                          playerName: auctionData.player?.name || 'Jogador',
                          amount: auctionData.current_bid,
                          teamName: team.name,
                          show: true,
                          timestamp: Date.now()
                        })
                        
                        debitarSaldoVencedor(
                          auctionData.id,
                          team.id,
                          auctionData.current_bid
                        )
                      }
                    })
                }, 1000)
              } else {
                console.log('Leilão já processado localmente (realtime):', payload.new.id)
              }
            }
          }
          
          // Atualizar dados do leilão
          const { data: fullAuction } = await supabase
            .from('auctions')
            .select(`
              *,
              player:players(*),
              current_bidder_team:teams!auctions_current_bidder_fkey(name, logo_url)
            `)
            .eq('id', payload.new?.id)
            .single()
          
          if (fullAuction) {
            setAuctions(prev => {
              const index = prev.findIndex(a => a.id === fullAuction.id)
              const synchronizedTime = serverTime
              if (index >= 0) {
                const newAuctions = [...prev]
                newAuctions[index] = {
                  ...fullAuction,
                  time_remaining: fullAuction.end_time && fullAuction.status === 'active' 
                    ? Math.max(0, new Date(fullAuction.end_time).getTime() - synchronizedTime)
                    : 0,
                  synchronized_end_time: fullAuction.end_time ? 
                    new Date(fullAuction.end_time).getTime() : undefined
                }
                return newAuctions
              } else {
                return [...prev, {
                  ...fullAuction,
                  time_remaining: fullAuction.end_time && fullAuction.status === 'active' 
                    ? Math.max(0, new Date(fullAuction.end_time).getTime() - synchronizedTime)
                    : 0,
                  synchronized_end_time: fullAuction.end_time ? 
                    new Date(fullAuction.end_time).getTime() : undefined
                }]
              }
            })
          }
        }
      )
      .subscribe()

    const bidsChannel = supabase
      .channel('bids_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
        },
        async (payload) => {
          console.log('💰 Atualização de lance em tempo real:', payload)
          
          const auctionId = payload.new?.auction_id || payload.old?.auction_id
          
          if (!auctionId) {
            console.log('❌ Sem auction_id no payload:', payload)
            return
          }
          
          try {
            // Carregar lances atualizados imediatamente
            const { data: updatedBids } = await supabase
              .from('bids')
              .select(`
                *,
                team:teams(name, logo_url)
              `)
              .eq('auction_id', auctionId)
              .order('created_at', { ascending: false })
              .limit(10)
            
            if (updatedBids) {
              setBids(prev => ({
                ...prev,
                [auctionId]: updatedBids
              }))
              console.log(`✅ Lances atualizados via realtime para leilão ${auctionId}:`, updatedBids.length)
            }
          } catch (error) {
            console.error('❌ Erro ao carregar lances atualizados:', error)
          }
        }
      )
      .subscribe()

    const balanceChannel = supabase
      .channel('balance_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${team.id}`
        },
        (payload) => {
          const now = Date.now()
          if (now - lastBalanceUpdateRef.current < 100) return
          
          lastBalanceUpdateRef.current = now
          
          console.log('💰 Saldo do time atualizado em tempo real:', {
            novo: payload.new.balance,
            anterior: payload.old.balance,
            diff: payload.new.balance - payload.old.balance
          })
          
          setTeam(prev => prev ? { 
            ...prev, 
            balance: payload.new.balance,
            updated_at: new Date().toISOString(),
            last_balance_update: now.toString()
          } : null)
        }
      )
      .subscribe()

    const playersChannel = supabase
      .channel('players_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
        },
        (payload) => {
          console.log('👤 Atualização de jogador em tempo real:', {
            playerId: payload.new?.id,
            playerName: payload.new?.name,
            team_id: payload.new?.team_id,
            old_team_id: payload.old?.team_id
          })
          
          setAuctions(prev => prev.map(auction => {
            if (auction.player_id === payload.new?.id) {
              return {
                ...auction,
                player: {
                  ...auction.player,
                  team_id: payload.new?.team_id
                } as Player
              }
            }
            return auction
          }))
        }
      )
      .subscribe()

    const transactionsChannel = supabase
      .channel('balance_transactions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balance_transactions',
          filter: `team_id=eq.${team.id}`
        },
        () => {
          if (team.id) {
            loadPendingReserves(team.id, true)
          }
        }
      )
      .subscribe()

    subscriptionsRef.current = [auctionsChannel, bidsChannel, balanceChannel, playersChannel, transactionsChannel]

    return () => {
      supabase.removeChannel(auctionsChannel)
      supabase.removeChannel(bidsChannel)
      supabase.removeChannel(balanceChannel)
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [user, team, serverTime, serverTimeOffset, saldoReservado, liberarSaldo, debitarSaldoVencedor, loadPendingReserves])

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

  const getSaldoDisponivel = useCallback(() => {
    if (!team) return 0
    const totalReservado = getSaldoReservado()
    return team.balance - totalReservado
  }, [team, getSaldoReservado])

  const getSaldoDisponivelRPC = useCallback(async () => {
    if (!team?.id) return 0
    
    try {
      const { data, error } = await supabase.rpc('get_available_balance', {
        p_team_id: team.id
      })
      
      if (error) {
        console.error('Erro ao obter saldo disponível:', error)
        return getSaldoDisponivel()
      }
      
      return data || 0
    } catch (error) {
      console.error('Erro ao verificar saldo disponível:', error)
      return getSaldoDisponivel()
    }
  }, [team?.id, getSaldoDisponivel])

  const loadInitialData = async () => {
    console.log('🚀 Iniciando carregamento...')
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('❌ Usuário não autenticado')
        setLoading(false)
        return
      }

      console.log('👤 Sessão do usuário:', session.user.id)
      setUser(session.user)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          teams (*)
        `)
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('❌ Erro ao carregar perfil:', profileError)
      } else {
        console.log('📋 Perfil carregado:', profile)
        setProfile(profile)
        setIsAdmin(profile?.role === 'admin')

        if (profile.teams) {
          setTeam(profile.teams)
          console.log('🏆 Time carregado:', profile.teams)
        } else {
          console.log('⚠️ Usuário não tem time associado')
          setTeam(null)
        }
      }

      console.log('🕐 Sincronizando tempo do servidor...')
      await syncServerTime()

      await loadAuctions()
      
      if (profile?.role === 'admin') {
        await loadFreePlayers()
      }

      if (team?.id) {
        const activeAuctionIds = auctions
          .filter(a => a.status === 'active')
          .map(a => a.id)
        
        const leiloesAtivos = await verificarLeiloesAtivos(team.id, Object.keys(saldoReservado))
        
        Object.keys(saldoReservado).forEach(async (auctionId) => {
          if (!leiloesAtivos.includes(auctionId)) {
            await liberarSaldo(auctionId, team.id)
          }
        })
      }

      toast.success('Dados carregados com sucesso!')

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do leilão')
    } finally {
      setLoading(false)
    }
  }

  const loadAuctions = async () => {
    console.log('📥 Carregando leilões...')

    if (!isTimeSynced) {
      console.log('⏳ Aguardando sincronização do tempo...')
      await syncServerTime()
    }
    
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
        toast.error('Erro ao carregar leilões')
        return
      }

      console.log('🎯 Leilões encontrados:', auctionsData?.length)
      
      const synchronizedTime = serverTime
      const auctionsWithTime = (auctionsData || []).map(auction => {
        if (auction.status !== 'active' || !auction.end_time) {
          return { 
            ...auction, 
            time_remaining: 0,
            synchronized_end_time: auction.end_time ? 
              new Date(auction.end_time).getTime() : undefined
          }
        }
        const endTime = new Date(auction.end_time).getTime()
        const timeRemaining = Math.max(0, endTime - synchronizedTime)
        return { 
          ...auction, 
          time_remaining: timeRemaining,
          synchronized_end_time: endTime
        }
      })

      setAuctions(auctionsWithTime)

      // Carregar lances para leilões ativos
      const activeAuctions = auctionsWithTime.filter(a => a.status === 'active')
      for (const auction of activeAuctions) {
        await loadBids(auction.id)
      }

    } catch (error) {
      console.error('❌ Erro inesperado:', error)
    }
  }

  const loadFreePlayers = async () => {
    try {
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .is('team_id', null)
        .order('overall', { ascending: false })

      const { data: activeAuctionsData } = await supabase
        .from('auctions')
        .select('player_id')
        .in('status', ['active', 'pending'])

      const auctionPlayerIds = activeAuctionsData?.map(a => a.player_id) || []
      const availablePlayers = (playersData || []).filter(
        player => !auctionPlayerIds.includes(player.id)
      )

      setFreePlayers(availablePlayers)

    } catch (error) {
      console.error('❌ Erro ao carregar jogadores:', error)
    }
  }

  const loadBids = async (auctionId: string) => {
    try {
      const { data: bidsData, error } = await supabase
        .from('bids')
        .select(`
          *,
          team:teams(name, logo_url)
        `)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('❌ Erro ao carregar lances:', error)
        return
      }
      
      setBids(prev => ({
        ...prev,
        [auctionId]: bidsData || []
      }))
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar lances:', error)
    }
  }

  const calculateTimeRemaining = useCallback((auction: Auction) => {
    if (auction.status !== 'active' || !auction.end_time) {
      return 0
    }
    
    const synchronizedTime = serverTime
    const endTime = new Date(auction.end_time).getTime()
    
    return Math.max(0, endTime - synchronizedTime)
  }, [serverTime])

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatCurrencyCreate = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '')
    if (onlyNumbers === '') return ''
    
    const number = parseInt(onlyNumbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const handleCreateAuction = async () => {
    if (!selectedPlayer || !startPrice || !startDate || !startTime) {
      toast.error('Preencha todos os campos')
      return
    }

    const price = parseFloat(startPrice.replace(/\./g, '').replace(',', '.'))
    if (isNaN(price) || price <= 0) {
      toast.error('Valor inicial inválido')
      return
    }

    setCreatingAuction(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const [year, month, day] = startDate.split('-')
      const [hours, minutes] = startTime.split(':')
      
      const startDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      )

      if (startDateTime <= new Date()) {
        toast.error('A data e hora de início devem ser futuras')
        setCreatingAuction(false)
        return
      }

      const durationMinutes = parseInt(auctionDuration)
      const endTime = new Date(startDateTime.getTime() + durationMinutes * 60000)

      const { error } = await supabase
        .from('auctions')
        .insert([{
          player_id: selectedPlayer,
          start_price: price,
          current_bid: price,
          status: 'pending',
          start_time: startDateTime.toISOString(),
          end_time: endTime.toISOString(),
          created_by: user.id,
          auction_duration: durationMinutes
        }])

      if (error) throw error

      toast.success('Leilão agendado com sucesso!')
      setCreateAuctionModalOpen(false)
      resetCreateAuctionForm()
      
      await loadAuctions()
      await loadFreePlayers()
      
      setActiveTab('pending')

    } catch (error: any) {
      console.error('❌ Erro ao criar leilão:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setCreatingAuction(false)
    }
  }

  const handleStartAuction = async (auctionId: string) => {
    try {
      const { data: auctionData } = await supabase
        .from('auctions')
        .select('auction_duration, start_time, end_time')
        .eq('id', auctionId)
        .single()

      if (!auctionData) {
        toast.error('Leilão não encontrado')
        return
      }

      let durationMinutes = auctionData.auction_duration || 5

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
      const { error: releaseError } = await supabase.rpc('release_pending_transactions', {
        p_auction_id: auctionId
      })

      if (releaseError) {
        console.error('Erro ao liberar transações pendentes:', releaseError)
      }

      await supabase
        .from('auctions')
        .delete()
        .eq('id', auctionId)

      await supabase
        .from('bids')
        .delete()
        .eq('auction_id', auctionId)

      toast.success('Leilão cancelado e saldos liberados!')
      await loadAuctions()
      await loadFreePlayers()

      if (team?.id) {
        await loadPendingReserves(team.id, true)
      }

    } catch (error: any) {
      console.error('❌ Erro ao cancelar leilão:', error)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const handlePlaceBid = async (auctionId: string, amount: number) => {
    console.log(`💰 LANCE ATÔMICO - Leilão: ${auctionId}, Valor: ${amount}`)
    
    if (!team || !team.id) {
      toast.error('❌ Você precisa ter um time para dar lances.')
      return
    }

    if (isProcessingRef.current) {
      toast.warning('Aguarde o lance anterior ser processado')
      return
    }

    if (!amount || amount <= 0) {
      toast.error('Selecione um valor de lance válido')
      return
    }

    const saldoDisponivel = await getSaldoDisponivelRPC()
    if (saldoDisponivel < amount) {
      toast.error(`❌ Saldo insuficiente. Disponível: R$ ${formatToMillions(saldoDisponivel)}`)
      return
    }

    setBidding(true)
    isProcessingRef.current = true

    try {
      console.log('📤 Enviando lance para RPC...', {
        auctionId,
        teamId: team.id,
        amount,
        teamBalance: team.balance,
        saldoDisponivel,
        time: new Date().toISOString()
      })
      
      const { data, error } = await supabase.rpc('place_bid_atomic', {
        p_auction_id: auctionId,
        p_team_id: team.id,
        p_amount: amount
      })

      console.log('📥 Resposta da RPC:', { data, error })

      if (error) {
        console.error('❌ Erro na RPC:', error)
        throw new Error(`Erro ao processar lance: ${error.message}`)
      }

      if (!data || !data.success) {
        const errorMessage = data?.error || 'Erro desconhecido ao processar lance'
        toast.error(errorMessage)
        return
      }

      console.log('✅ LANCE BEM-SUCEDIDO:', data)
      
      // Atualizar reservas do banco
      await loadPendingReserves(team.id, true)
      
      setSelectedBidAmount(null)
      setBiddingAuctionId(null)
      
      await loadAuctions()
      
      toast.success(data.message || 'Lance realizado com sucesso!')
      
      if (data.time_extended) {
        toast.info('⏰ Tempo do leilão estendido em 90 segundos!')
      }

    } catch (error: any) {
      console.error('❌ ERRO NO LANCE:', error)
      toast.error(`Erro: ${error.message || 'Falha ao processar lance'}`)
    } finally {
      setBidding(false)
      isProcessingRef.current = false
    }
  }

  const handleForceFinishAuction = async (auctionId: string) => {
    if (!confirm('⚠️ Forçar finalização do leilão? Isso pode causar problemas.')) return
    
    try {
      console.log('🔧 FORÇANDO FINALIZAÇÃO DO LEILÃO:', auctionId)
      
      const result = await auctionFinalizer.current.finalizeAuction(auctionId, serverTimeOffset)
      
      if (!result || !result.success) {
        toast.error('Erro ao finalizar leilão')
      } else {
        toast.success('Leilão finalizado para todos os usuários!')
        await loadAuctions()
        
        // PATCH: Aplicar guard para evitar processamento duplo
        if (team?.id && result.winner_team_id === team.id) {
          if (!hasProcessedWin(auctionId)) {
            markAsProcessedWin(auctionId)
            setTimeout(async () => {
              try {
                await debitarSaldoVencedor(auctionId, team.id, result.final_amount || 0)
                console.log(`✅ Estado local atualizado para leilão forçado ${auctionId}`)
              } catch (error) {
                console.error('❌ Erro ao atualizar estado local:', error)
              }
            }, 1000)
          } else {
            console.log('Leilão já processado localmente (forceFinish):', auctionId)
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Erro:', error)
      toast.error('Erro: ' + error.message)
    }
  }

  const handleCheckPlayerStatus = async (auctionId: string, playerId: string) => {
    try {
      console.log('🔍 VERIFICANDO STATUS DO JOGADOR...')
      
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single()
      
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()
      
      console.log('📊 STATUS DO LEILÃO:', {
        auctionId: auction?.id,
        status: auction?.status,
        currentBidder: auction?.current_bidder,
        endTime: auction?.end_time
      })
      
      console.log('📊 STATUS DO JOGADOR:', {
        playerId: player?.id,
        playerName: player?.name,
        team_id: player?.team_id,
        expectedTeam: auction?.current_bidder,
        match: player?.team_id === auction?.current_bidder
      })
      
      if (player?.team_id !== auction?.current_bidder && auction?.status === 'finished') {
        console.error('⚠️ PROBLEMA: Jogador não está no time correto!')
        toast.error('Problema detectado: jogador não transferido')
      } else {
        toast.success('Status verificado - tudo OK')
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error)
    }
  }

  const resetCreateAuctionForm = () => {
    setSelectedPlayer('')
    setStartPrice('')
    setAuctionDuration('5')
    setStartDate('')
    setStartTime('')
  }

  const handleStartPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrencyCreate(e.target.value)
    setStartPrice(formattedValue)
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(timeString)
      }
    }
    return times
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

  const chatUser = {
    id: user?.id || '',
    name: profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico',
    email: user?.email || ''
  }

  const chatTeam = {
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }

  const renderTabContent = () => {
    const tabAuctions = getAuctionsByTab()

    if (tabAuctions.length === 0) {
      return (
        <Card className="p-16 text-center bg-white/5 border-white/10">
          {activeTab === 'active' && <Gavel className="w-16 h-16 text-zinc-600 mx-auto mb-4" />}
          {activeTab === 'pending' && <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />}
          {activeTab === 'finished' && <Trophy className="w-16 h-16 text-zinc-600 mx-auto mb-4" />}
          <h3 className="text-2xl font-bold text-white mb-2">
            {activeTab === 'active' && 'Nenhum leilão ativo'}
            {activeTab === 'pending' && 'Nenhum leilão agendado'}
            {activeTab === 'finished' && 'Nenhum leilão finalizado'}
          </h3>
          <p className="text-zinc-400">
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
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tabAuctions.map(auction => (
          <AuctionCard 
            key={auction.id} 
            auction={auction} 
            type={activeTab} 
            onBid={handlePlaceBid}
            onStartAuction={handleStartAuction}
            onCancelAuction={handleCancelAuction}
            onForceFinish={handleForceFinishAuction}
            onCheckPlayerStatus={handleCheckPlayerStatus}
            bids={bids[auction.id]}
            isAdmin={isAdmin}
            team={team}
            biddingAuctionId={biddingAuctionId}
            setBiddingAuctionId={setBiddingAuctionId}
            selectedBidAmount={selectedBidAmount}
            setSelectedBidAmount={setSelectedBidAmount}
            bidding={bidding}
            calculateTimeRemaining={calculateTimeRemaining}
            formatTimeRemaining={formatTimeRemaining}
            saldoReservado={saldoReservado}
            liberarSaldo={liberarSaldo}
            loadPendingReserves={() => team?.id && loadPendingReserves(team.id, true)}
            serverTimeOffset={serverTimeOffset}
            forceRefresh={forceRefresh}
            finalizingAuctions={finalizingAuctions}
          />
        ))}
      </div>
    )
  }

  const timeOptions = generateTimeOptions()

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

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar 
        user={user!}
        profile={profile}
        team={team}
      />

      <div className="flex-1 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-orange-950/20 to-zinc-950 text-white p-8">
          {winNotification?.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-yellow-600/90 to-orange-600/90 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-yellow-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <Trophy className="w-20 h-20 text-yellow-300" />
                      <PartyPopper className="w-8 h-8 text-pink-400 absolute -top-2 -right-2 animate-bounce" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">🎉 PARABÉNS! 🎉</h2>
                  <p className="text-yellow-100 text-lg mb-4">Você venceu o leilão!</p>
                  
                  <div className="bg-black/30 rounded-xl p-4 mb-6">
                    <p className="text-white font-semibold text-xl">{winNotification.playerName}</p>
                    <p className="text-yellow-300 text-2xl font-bold mt-2">
                      R$ {formatToMillions(winNotification.amount)}
                    </p>
                    <p className="text-yellow-100 text-sm mt-1">
                      Agora faz parte do <span className="font-bold">{winNotification.teamName}</span>!
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => setWinNotification(null)}
                    className="bg-white text-orange-600 hover:bg-yellow-100 font-bold py-3 px-8 text-lg"
                  >
                    Fechar
                  </Button>
                  
                  <p className="text-yellow-200/70 text-sm mt-4">
                    O jogador foi adicionado ao seu elenco e o valor foi debitado do seu saldo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {bidCoveredNotification?.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-blue-600/90 to-cyan-600/90 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-blue-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <RefreshCw className="w-20 h-20 text-blue-300 animate-spin" />
                      <DollarSign className="w-8 h-8 text-green-400 absolute -top-2 -right-2" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">💸 LANCE COBERTO!</h2>
                  <p className="text-blue-100 text-lg mb-4">Seu saldo foi liberado</p>
                  
                  <div className="bg-black/30 rounded-xl p-4 mb-6">
                    <p className="text-white font-semibold text-xl">{bidCoveredNotification.playerName}</p>
                    <p className="text-green-300 text-2xl font-bold mt-2">
                      R$ {formatToMillions(bidCoveredNotification.coveredAmount)}
                    </p>
                    <p className="text-blue-100 text-sm mt-1">
                      Disponível novamente no seu saldo!
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => setBidCoveredNotification(null)}
                    className="bg-white text-blue-600 hover:bg-blue-100 font-bold py-3 px-8 text-lg"
                  >
                    Fechar
                  </Button>
                  
                  <p className="text-blue-200/70 text-sm mt-4">
                    Outro usuário deu um lance maior. Seu saldo foi liberado automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-black text-white mb-2">LEILÃO DE JOGADORES</h1>
                  {isSyncingTime && (
                    <Badge variant="outline" className="animate-pulse bg-yellow-500/20 text-yellow-400">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Sincronizando tempo...
                    </Badge>
                  )}
                </div>
                <p className="text-zinc-400 text-lg">
                  Adquira os melhores jogadores livres no mercado
                  {serverTimeOffset !== 0 && (
                    <span className="text-xs text-zinc-500 ml-2">
                      (Tempo sincronizado: {serverTimeOffset > 0 ? '+' : ''}{Math.round(serverTimeOffset / 1000)}s)
                    </span>
                  )}
                </p>
              </div>

              {team && (
                <div className="w-full lg:w-auto">
                  <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 backdrop-blur-lg rounded-2xl p-4 border border-zinc-700/50 shadow-xl">
                    <div className="flex items-center gap-4">
                      {team.logo_url && (
                        <img 
                          src={team.logo_url} 
                          alt={team.name}
                          className="w-12 h-12 rounded-full border-2 border-orange-500/50"
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
                            <p className="text-xl font-bold text-white">
                              R$ {formatToMillions(getSaldoDisponivel())}
                            </p>
                            <SaldoUpdateIndicator lastUpdate={lastSaldoUpdate} />
                          </div>
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Lock className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs text-yellow-300 font-medium">Reservado</span>
                            </div>
                            <p className="text-xl font-bold text-white">
                              R$ {formatToMillions(getSaldoReservado())}
                            </p>
                            <SaldoUpdateIndicator lastUpdate={lastSaldoUpdate} />
                          </div>
                        </div>
                        <div className="mt-3 bg-zinc-800/50 rounded-lg p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Saldo Total:</span>
                            <span className="text-lg font-bold text-white">
                              R$ {formatToMillions(team.balance)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <SaldoUpdateIndicator lastUpdate={lastSaldoUpdate} />
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

              {isAdmin && (
                <Dialog open={createAuctionModalOpen} onOpenChange={setCreateAuctionModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
                      <Gavel className="w-4 h-4 mr-2" />
                      Criar Leilão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">
                        Criar Novo Leilão
                      </DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Agende um novo leilão para jogadores livres
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Jogador
                        </label>
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                            <SelectValue placeholder="Selecione um jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {freePlayers.map(player => (
                              <SelectItem key={player.id} value={player.id}>
                                <div className="flex items-center gap-3">
                                  {player.photo_url ? (
                                    <img 
                                      src={player.photo_url} 
                                      alt={player.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                      <User className="w-4 h-4 text-zinc-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{player.name}</p>
                                    <p className="text-xs text-zinc-400">
                                      {player.position} • OVR {player.overall}
                                    </p>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Data de Início
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={getMinDate()}
                            className="pl-10 bg-zinc-800/50 border-zinc-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Horário de Início
                        </label>
                        <Select value={startTime} onValueChange={setStartTime}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map(time => (
                              <SelectItem key={time} value={time}>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {time}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Duração
                        </label>
                        <Select value={auctionDuration} onValueChange={setAuctionDuration}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutos</SelectItem>
                            <SelectItem value="10">10 minutos</SelectItem>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">60 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Preço Inicial (R$)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                          <Input
                            placeholder="0,00"
                            value={startPrice}
                            onChange={handleStartPriceChange}
                            className="pl-10 bg-zinc-800/50 border-zinc-600"
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCreateAuctionModalOpen(false)}
                        className="bg-transparent border-zinc-600"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateAuction}
                        disabled={creatingAuction}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {creatingAuction ? 'Criando...' : 'Criar Leilão'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="mb-8">
              <div className="flex space-x-1 bg-zinc-800/50 rounded-lg p-1">
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

            <div className="min-h-[400px]">
              {renderTabContent()}
            </div>
          </div>
        </div>

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

// COMPONENTE AUCTIONCARD ATUALIZADO
const AuctionCard = ({ 
  auction, 
  type, 
  onBid, 
  onStartAuction, 
  onCancelAuction,
  onForceFinish,
  onCheckPlayerStatus,
  bids, 
  isAdmin, 
  team,
  biddingAuctionId,
  setBiddingAuctionId,
  selectedBidAmount,
  setSelectedBidAmount,
  bidding,
  calculateTimeRemaining,
  formatTimeRemaining,
  saldoReservado,
  liberarSaldo,
  loadPendingReserves,
  serverTimeOffset,
  forceRefresh,
  finalizingAuctions
}: any) => {

  const [bidOptions, setBidOptions] = useState<{ value: number; label: string }[]>([])
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(0)

  useEffect(() => {
    if (auction && isBidModalOpen) {
      const options = generateBidOptions(auction.current_bid)
      setBidOptions(options)
    }
  }, [auction, isBidModalOpen])

  useEffect(() => {
    setIsBidModalOpen(biddingAuctionId === auction.id)
    if (biddingAuctionId !== auction.id) {
      setSelectedBidAmount(null)
    }
  }, [biddingAuctionId, auction.id])

  // Atualizar timer local para precisão
  useEffect(() => {
    if (type === 'active' && auction.status === 'active' && auction.end_time) {
      const updateTimer = () => {
        const timeRemaining = calculateTimeRemaining(auction)
        setLocalTimeRemaining(timeRemaining)
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 100)
      
      return () => clearInterval(interval)
    } else {
      setLocalTimeRemaining(0)
    }
  }, [auction, type, calculateTimeRemaining, forceRefresh])

  const handleOpenBidModal = () => {
    setBiddingAuctionId(auction.id)
    setIsBidModalOpen(true)
    const options = generateBidOptions(auction.current_bid)
    setBidOptions(options)
    setSelectedBidAmount(null)
  }

  const handleCloseBidModal = () => {
    setBiddingAuctionId(null)
    setIsBidModalOpen(false)
    setSelectedBidAmount(null)
  }

  const handleBidSelect = (value: string) => {
    const numericValue = parseInt(value)
    if (!isNaN(numericValue)) {
      setSelectedBidAmount(numericValue)
    }
  }

  const handlePlaceBid = async () => {
    if (!selectedBidAmount) {
      toast.error('Selecione um valor de lance')
      return
    }
    await onBid(auction.id, selectedBidAmount)
  }

  const handleCancelReserva = async () => {
    if (!team || !auction.id) return
    
    if (confirm('Tem certeza que deseja cancelar sua reserva neste leilão?')) {
      try {
        await liberarSaldo(auction.id, team.id)
        if (loadPendingReserves) {
          await loadPendingReserves()
        }
        toast.success('Reserva cancelada!')
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error)
        toast.error('Erro ao cancelar reserva')
      }
    }
  }

  const getCardStyles = () => {
    switch (type) {
      case 'active':
        return "bg-gradient-to-br from-red-600/10 to-orange-600/10 border-red-500/30"
      case 'pending':
        return "bg-gradient-to-br from-yellow-600/10 to-amber-600/10 border-yellow-500/30"
      case 'finished':
        return "bg-gradient-to-br from-green-600/10 to-emerald-600/10 border-green-500/30"
      default:
        return "bg-gradient-to-br from-zinc-600/10 to-zinc-600/10 border-zinc-500/30"
    }
  }

  const isCurrentUserLeader = team && auction.current_bidder === team.id
  const temSaldoReservado = saldoReservado && saldoReservado[auction.id]
  const isFinalizing = finalizingAuctions && finalizingAuctions.has(auction.id)
  
  const mostrarReservado = type !== 'finished' && temSaldoReservado

  return (
    <Card className={cn("p-6 relative", getCardStyles())}>
      {mostrarReservado && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-blue-500 text-white">
            <Lock className="w-3 h-3 mr-1" />
            Reservado
          </Badge>
        </div>
      )}

      {isFinalizing && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-2" />
            <p className="text-white font-bold">Finalizando...</p>
            <p className="text-yellow-300 text-sm">Sincronizando para todos</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        {auction.player?.photo_url ? (
          <img 
            src={auction.player.photo_url} 
            alt={auction.player.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-current"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-zinc-700 border-2 border-current flex items-center justify-center">
            <User className="w-8 h-8 text-zinc-400" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white">{auction.player?.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{auction.player?.position}</Badge>
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400">
                  OVR {auction.player?.overall}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              {type === 'active' && localTimeRemaining > 0 && (
                <div className="flex items-center gap-1 text-red-400 mb-1">
                  <Timer className="w-4 h-4" />
                  <span className="font-mono font-bold">
                    {formatTimeRemaining(localTimeRemaining)}
                  </span>
                </div>
              )}
              <Badge variant={
                type === 'active' ? 'destructive' : 
                type === 'pending' ? 'secondary' : 'outline'
              }>
                {type === 'active' ? 'ATIVO' : 
                 type === 'pending' ? 'AGENDADO' : 'FINALIZADO'}
              </Badge>
            </div>
          </div>
          {type === 'pending' && (
            <div className="mt-2 text-sm text-zinc-400">
              <Clock className="w-3 h-3 inline mr-1" />
              Início: {new Date(auction.start_time).toLocaleString('pt-BR')}
            </div>
          )}
          {serverTimeOffset !== 0 && localTimeRemaining > 0 && (
            <div className="text-xs text-zinc-500 mt-1">
              Sincronizado com servidor
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {type === 'active' && auction.current_bid === auction.start_price ? (
          <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
            <span className="text-zinc-400">Preço Inicial</span>
            <span className="text-2xl font-bold text-white">
              R$ {formatToMillions(auction.start_price)}
            </span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
              <span className="text-zinc-400">
                {type === 'active' ? 'Lance Atual' : 'Valor Atual'}
              </span>
              <span className="text-2xl font-bold text-white">
                R$ {formatToMillions(auction.current_bid)}
              </span>
            </div>
            
            {auction.current_bidder !== null && (
              <div className={cn(
                "flex justify-between items-center p-3 rounded-lg border",
                isCurrentUserLeader 
                  ? "bg-yellow-500/20 border-yellow-500/50" 
                  : "bg-zinc-800/30 border-yellow-500/30"
              )}>
                <span className="text-zinc-400 flex items-center gap-2">
                  <Crown className={cn(
                    "w-4 h-4",
                    isCurrentUserLeader ? "text-yellow-400" : "text-yellow-400"
                  )} />
                  {type === 'active' ? 'Líder' : 'Vencedor'}
                  {isCurrentUserLeader && type === 'active' && (
                    <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                      Você
                    </Badge>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {auction.current_bidder_team?.logo_url && (
                    <img 
                      src={auction.current_bidder_team.logo_url} 
                      alt={auction.current_bidder_team.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className={cn(
                    "font-medium",
                    isCurrentUserLeader ? "text-yellow-400" : "text-white"
                  )}>
                    {auction.current_bidder_team?.name || 'Time Desconhecido'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {type === 'active' && localTimeRemaining > 0 && (
          isBidModalOpen ? (
            <div className="space-y-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-600">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold text-white">Fazer Lance</h4>
                <Badge variant="outline" className="bg-green-500/20 text-green-400">
                  Ativo
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-zinc-400 text-sm font-medium">
                  Selecione o valor do lance:
                </label>
                <Select 
                  onValueChange={handleBidSelect} 
                  value={selectedBidAmount?.toString() || ''}
                  key={auction.current_bid}
                >
                  <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-600 text-white">
                    <SelectValue placeholder="Selecione um valor de lance" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600 max-h-60">
                    {bidOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value.toString()}
                        className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium">R$ {option.label}</span>
                          <span className="text-zinc-400 text-sm">
                            {option.value.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-yellow-400 text-center p-2 bg-yellow-500/10 rounded">
                💰 <strong>Lance mínimo:</strong> R$ {formatToMillions(auction.current_bid + 1000000)}
              </div>

              {selectedBidAmount && (
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-300">Seu lance:</span>
                    <span className="font-bold text-white text-lg">
                      R$ {formatToMillions(selectedBidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-zinc-400">Diferença:</span>
                    <span className="text-green-400">
                      +R$ {formatToMillions(selectedBidAmount - auction.current_bid)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCloseBidModal}
                  className="flex-1 border-zinc-600 text-zinc-400 hover:bg-zinc-700/50"
                  disabled={bidding}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  disabled={bidding || !selectedBidAmount}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {bidding ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    `Dar Lance`
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleOpenBidModal}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              disabled={!team || type === 'finished' || isFinalizing}
            >
              {!team ? (
                'Sem Time'
              ) : type === 'finished' ? (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  Leilão Finalizado
                </>
              ) : temSaldoReservado ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Lance Reservado
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 mr-2" />
                  Fazer Lance
                </>
              )}
            </Button>
          )
        )}

        {isAdmin && type !== 'finished' && (
          <div className="flex gap-2">
            {type === 'pending' && (
              <Button
                onClick={() => onStartAuction(auction.id)}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={isFinalizing}
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Agora
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onCancelAuction(auction.id)}
              className={cn(
                "flex-1 bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30",
                type === 'pending' ? "flex-1" : "w-full"
              )}
              disabled={isFinalizing}
            >
              <Minus className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}

        {bids && bids.length > 0 && type === 'active' && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-zinc-400 mb-2">Histórico de Lances</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {bids.slice(0, 5).map((bid: any, index: number) => (
                <div 
                  key={bid.id} 
                  className={cn(
                    "flex justify-between items-center text-sm p-2 rounded",
                    index === 0 
                      ? "bg-yellow-500/20 border border-yellow-500/30" 
                      : "bg-zinc-800/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {bid.team?.logo_url && (
                      <img src={bid.team.logo_url} alt="" className="w-4 h-4 rounded-full" />
                    )}
                    <span className={cn(
                      "font-medium",
                      index === 0 ? "text-yellow-400" : "text-white"
                    )}>
                      {bid.team?.name}
                    </span>
                  </div>
                  <span className={cn(
                    "font-bold",
                    index === 0 ? "text-yellow-400" : "text-white"
                  )}>
                    R$ {formatToMillions(bid.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}