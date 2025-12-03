'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { User, Timer, Crown, Lock, Trophy, DollarSign, Play, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

// ⚡ FUNÇÃO PARA BUSCAR SERVER TIME
const fetchServerTime = async (): Promise<number> => {
  try {
    // Usando um endpoint público que retorna tempo atual
    const response = await fetch('https://worldtimeapi.org/api/timezone/America/Sao_Paulo', {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      // worldtimeapi retorna o tempo em formato ISO com milliseconds
      const serverTime = new Date(data.utc_datetime).getTime()
      return serverTime
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar server time externo:', error)
  }
  
  // Fallback: usa tempo do servidor Supabase via RPC
  try {
    const { data, error } = await supabase.rpc('get_server_time')
    if (!error && data) {
      return data
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar server time do Supabase:', error)
  }
  
  // Último fallback: tempo local corrigido por offset
  return Date.now()
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
  const [serverTime, setServerTime] = useState<number>(Date.now())
  const [timeOffset, setTimeOffset] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (auction && bidModalOpen) {
      setBidOptions(generateBidOptions(auction.current_bid))
    }
  }, [auction, bidModalOpen])

  // ⚡ **POLLING AUTOMÁTICO PARA SERVER TIME**
  useEffect(() => {
    if (type === 'active' && auction.status === 'active' && auction.end_time) {
      console.log(`⏰ Iniciando polling automático para leilão ${auction.id}`)
      
      // Função para sincronizar com server time
      const syncWithServer = async () => {
        if (isSyncing) return
        
        setIsSyncing(true)
        try {
          const fetchedServerTime = await fetchServerTime()
          const localTime = Date.now()
          const offset = fetchedServerTime - localTime
          
          setServerTime(fetchedServerTime)
          setTimeOffset(offset)
          
          console.log(`⏰ Sincronizado: Server=${fetchedServerTime}, Local=${localTime}, Offset=${offset}ms`)
        } catch (error) {
          console.warn('⚠️ Erro na sincronização:', error)
        } finally {
          setIsSyncing(false)
        }
      }
      
      // Primeira sincronização imediata
      syncWithServer()
      
      // Sincroniza a cada 10 segundos
      syncIntervalRef.current = setInterval(syncWithServer, 10000)
      
      // Atualiza o tempo local com offset a cada segundo
      const updateLocalTime = () => {
        setServerTime(prev => Date.now() + timeOffset)
      }
      
      // Atualiza a cada segundo para contagem suave
      intervalRef.current = setInterval(updateLocalTime, 1000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current)
        }
      }
    } else {
      // Limpa os intervals se não for leilão ativo
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [auction.id, auction.status, type, auction.end_time, timeOffset, isSyncing])

  // ⚡ **CALCULA TEMPO RESTANTE USANDO SERVER TIME**
  const timeRemaining = (() => {
    if (type !== 'active' || auction.status !== 'active' || !auction.end_time) {
      return 0
    }
    
    const endTime = new Date(auction.end_time).getTime()
    const remaining = Math.max(0, endTime - serverTime)
    
    return remaining
  })()

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
                <div className="flex flex-col items-end gap-1">
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
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      Math.abs(timeOffset) < 100 ? "bg-green-500" : 
                      Math.abs(timeOffset) < 500 ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <span className="text-xs text-zinc-400">
                      {Math.abs(timeOffset) < 100 ? "Sincronizado" : 
                       Math.abs(timeOffset) < 500 ? "Próximo" : "Fora de sinc."}
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