'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { User, Timer, Crown, Lock, Trophy, DollarSign, Play, Minus, ChevronRight, History } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Player {
  id: string
  name: string
  position: string
  overall: number
  photo_url: string | null
}

interface Team {
  id: string
  name: string
  logo_url: string
}

interface Bid {
  id: string
  amount: number
  created_at: string
  team_id: string
  team?: Team
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

interface AuctionCardProps {
  auction: Auction
  type: 'active' | 'pending' | 'finished'
  onBid: (auctionId: string, amount: number) => Promise<void>
  team: Team | null
  saldoReservado: {[key: string]: number}
  getSaldoReservadoParaLeilao?: (auctionId: string) => number
  temSaldoReservado?: (auctionId: string) => boolean
  onCancelAuction?: (auctionId: string) => Promise<void>
  onStartAuction?: (auctionId: string) => Promise<void>
  onForceFinish?: (auctionId: string) => Promise<void>
  isAdmin?: boolean
  finalizing?: boolean
}

const formatToMillions = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return value.toLocaleString('pt-BR')
}

const generateBidOptions = (currentBid: number) => {
  const options = []
  const minBid = currentBid + 1000000
  
  for (let i = 0; i < 10; i++) {
    const bidValue = minBid + (i * 1000000)
    options.push({
      value: bidValue,
      label: `${formatToMillions(bidValue)}`
    })
  }
  
  return options
}

export function AuctionCard({
  auction,
  type,
  onBid,
  team,
  saldoReservado,
  getSaldoReservadoParaLeilao,
  temSaldoReservado,
  onCancelAuction,
  onStartAuction,
  onForceFinish,
  isAdmin = false,
  finalizing = false,
}: AuctionCardProps) {
  const [bidModalOpen, setBidModalOpen] = useState(false)
  const [selectedBid, setSelectedBid] = useState<number | null>(null)
  const [bidOptions, setBidOptions] = useState<{value: number, label: string}[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number>(auction.time_remaining || 0)
  const [bids, setBids] = useState<Bid[]>([])
  const [showBidHistory, setShowBidHistory] = useState(false)
  const [loadingBids, setLoadingBids] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (auction && bidModalOpen) {
      setBidOptions(generateBidOptions(auction.current_bid))
    }
  }, [auction, bidModalOpen])

  // Carregar histórico de lances
  useEffect(() => {
    if (auction.id && (type === 'active' || type === 'finished')) {
      loadBidHistory()
    }
  }, [auction.id, type])

  const loadBidHistory = async () => {
    try {
      setLoadingBids(true)
      const { data, error } = await supabase
        .from('bids')
        .select(`
          id,
          amount,
          created_at,
          team_id,
          team:teams!bids_team_id_fkey (
            name,
            logo_url
          )
        `)
        .eq('auction_id', auction.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (data) {
        setBids(data as Bid[])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico de lances:', error)
    } finally {
      setLoadingBids(false)
    }
  }

  // ⚡ TIMER SIMPLES E EFETIVO - APENAS USANDO end_time DO BANCO
  useEffect(() => {
    mountedRef.current = true
    
    if (type === 'active' && auction.status === 'active' && auction.end_time) {
      console.log(`⏰ Iniciando timer para leilão ${auction.id}`)
      
      // Função que atualiza o timer localmente
      const updateTimer = () => {
        if (!mountedRef.current) return
        
        // ⚡ USA O end_time DO BANCO (igual para todos)
        const endTime = new Date(auction.end_time!).getTime()
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        
        setTimeRemaining(remaining)
        
        // ⚡ SE TEMPO ACABOU, NOTIFICA O PARENT
        if (remaining <= 0 && onForceFinish) {
          setTimeout(() => onForceFinish(auction.id), 1000)
        }
      }
      
      // Atualiza imediatamente
      updateTimer()
      
      // ⚡ ATUALIZA A CADA SEGUNDO
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(updateTimer, 1000)
      
      return () => {
        mountedRef.current = false
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      setTimeRemaining(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [auction.end_time, auction.status, type, onForceFinish, auction.id])

  // ⚡ ADICIONA UMA SINCRONIZAÇÃO PERIÓDICA SIMPLES
  useEffect(() => {
    if (type === 'active' && auction.status === 'active' && auction.end_time) {
      // Sincroniza o timer a cada 30 segundos para evitar drift
      const syncInterval = setInterval(() => {
        const endTime = new Date(auction.end_time!).getTime()
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        
        // Corrige se houver diferença maior que 2 segundos
        if (Math.abs(remaining - timeRemaining) > 2000) {
          console.log(`⏰ Corrigindo timer: ${remaining - timeRemaining}ms`)
          setTimeRemaining(remaining)
        }
      }, 30000)
      
      return () => clearInterval(syncInterval)
    }
  }, [auction.end_time, auction.status, type, timeRemaining, auction.id])

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleBidSelect = (value: string) => {
    const numericValue = parseInt(value)
    if (!isNaN(numericValue)) {
      setSelectedBid(numericValue)
    }
  }

  const handlePlaceBid = async () => {
    if (!selectedBid) {
      toast.error('Selecione um valor de lance')
      return
    }
    try {
      await onBid(auction.id, selectedBid)
      setBidModalOpen(false)
      setSelectedBid(null)
      // Recarrega histórico após dar lance
      setTimeout(() => loadBidHistory(), 500)
    } catch (error) {
      console.error('Erro ao dar lance:', error)
    }
  }

  // Verifica se tem saldo reservado
  const hasReservedBalance = team?.id && temSaldoReservado ? temSaldoReservado(auction.id) : false
  
  const getCardStyles = () => {
    switch (type) {
      case 'active': return "bg-gradient-to-br from-red-600/10 to-orange-600/10 border-red-500/30"
      case 'pending': return "bg-gradient-to-br from-yellow-600/10 to-amber-600/10 border-yellow-500/30"
      case 'finished': return "bg-gradient-to-br from-green-600/10 to-emerald-600/10 border-green-500/30"
      default: return "bg-gradient-to-br from-zinc-600/10 to-zinc-600/10 border-zinc-500/30"
    }
  }

  // Indicadores visuais
  const isAlmostFinished = timeRemaining > 0 && timeRemaining < 30000 // menos de 30 segundos
  const isCritical = timeRemaining > 0 && timeRemaining < 10000 // menos de 10 segundos

  if (finalizing) {
    return (
      <Card className={cn("p-6 relative opacity-70", getCardStyles())}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white font-bold">Finalizando...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-6 relative", getCardStyles())}>
      {hasReservedBalance && type !== 'finished' && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-blue-500 text-white">
            <Lock className="w-3 h-3 mr-1" />
            Reservado
          </Badge>
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
              {type === 'active' && timeRemaining > 0 && (
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "flex items-center gap-1 font-mono font-bold",
                    isCritical ? "text-red-500 animate-pulse" :
                    isAlmostFinished ? "text-red-400" :
                    "text-yellow-400"
                  )}>
                    <Timer className={cn(
                      "w-4 h-4",
                      isCritical && "animate-pulse"
                    )} />
                    <span className={cn(
                      isCritical && "animate-pulse"
                    )}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
              )}
              <Badge variant={
                type === 'active' ? 'destructive' : 
                type === 'pending' ? 'secondary' : 'outline'
              } className="mt-1">
                {type === 'active' ? 'ATIVO' : 
                 type === 'pending' ? 'AGENDADO' : 'FINALIZADO'}
              </Badge>
            </div>
          </div>
          {type === 'pending' && (
            <div className="mt-2 text-sm text-zinc-400">
              <Timer className="w-3 h-3 inline mr-1" />
              Início: {new Date(auction.start_time).toLocaleString('pt-BR')}
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
                auction.current_bidder === team?.id 
                  ? "bg-yellow-500/20 border-yellow-500/50" 
                  : "bg-zinc-800/30 border-yellow-500/30"
              )}>
                <span className="text-zinc-400 flex items-center gap-2">
                  <Crown className={cn(
                    "w-4 h-4",
                    auction.current_bidder === team?.id ? "text-yellow-400" : "text-yellow-400"
                  )} />
                  {type === 'active' ? 'Líder' : 'Vencedor'}
                  {auction.current_bidder === team?.id && type === 'active' && (
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
                    auction.current_bidder === team?.id ? "text-yellow-400" : "text-white"
                  )}>
                    {auction.current_bidder_team?.name || 'Time Desconhecido'}
                  </span>
                </div>
              </div>
            )}

            {/* HISTÓRICO DE LANCES */}
            {(type === 'active' || type === 'finished') && bids.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowBidHistory(!showBidHistory)}
                  className="flex items-center justify-between w-full p-2 bg-zinc-800/30 rounded-lg hover:bg-zinc-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-300">
                      Histórico de Lances ({bids.length})
                    </span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 text-zinc-400 transition-transform",
                    showBidHistory && "rotate-90"
                  )} />
                </button>

                {showBidHistory && (
                  <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-zinc-800/20 rounded-lg border border-zinc-700/30">
                    {loadingBids ? (
                      <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      bids.map((bid, index) => (
                        <div 
                          key={bid.id} 
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg",
                            index === 0 ? "bg-yellow-500/10 border border-yellow-500/20" :
                            index < 3 ? "bg-blue-500/5" :
                            "bg-zinc-800/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {bid.team?.logo_url ? (
                                <img 
                                  src={bid.team.logo_url} 
                                  alt={bid.team.name}
                                  className="w-6 h-6 rounded-full border border-zinc-600"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center">
                                  <User className="w-3 h-3 text-zinc-400" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-white truncate max-w-[120px]">
                                {bid.team?.name || 'Time Desconhecido'}
                              </span>
                            </div>
                            {index === 0 && (
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 text-xs py-0 px-1">
                                <Crown className="w-3 h-3 mr-1" />
                                Líder
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-white">
                              R$ {formatToMillions(bid.amount)}
                            </span>
                            <span className="text-xs text-zinc-400 hidden sm:inline">
                              {formatDateTime(bid.created_at)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {bids.length === 0 && !loadingBids && (
                      <div className="text-center p-4 text-zinc-400 text-sm">
                        Nenhum lance registrado ainda
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {type === 'active' && timeRemaining > 0 && (
          bidModalOpen ? (
            <div className="space-y-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-600">
              <h4 className="text-lg font-bold text-white mb-2">Fazer Lance</h4>
              
              <div className="space-y-2">
                <label className="text-zinc-400 text-sm font-medium">
                  Selecione o valor:
                </label>
                <Select onValueChange={handleBidSelect} value={selectedBid?.toString() || ''}>
                  <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-600">
                    <SelectValue placeholder="Selecione um valor" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    {bidOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>R$ {option.label}</span>
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

              {selectedBid && (
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-300">Seu lance:</span>
                    <span className="font-bold text-white text-lg">
                      R$ {formatToMillions(selectedBid)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setBidModalOpen(false)}
                  className="flex-1 border-zinc-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  disabled={!selectedBid}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Dar Lance
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setBidModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              disabled={!team || type === 'finished' || hasReservedBalance}
            >
              {!team ? (
                'Sem Time'
              ) : type === 'finished' ? (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  Leilão Finalizado
                </>
              ) : hasReservedBalance ? (
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
            {type === 'pending' && onStartAuction && (
              <Button
                onClick={() => onStartAuction(auction.id)}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            )}
            {onCancelAuction && (
              <Button
                variant="outline"
                onClick={() => onCancelAuction(auction.id)}
                className="flex-1 bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
              >
                <Minus className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}