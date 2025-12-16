'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  User, Timer, Crown, Lock, Trophy, DollarSign, Play, 
  Minus, ChevronRight, History, Calendar, Clock, Award,
  TrendingUp, Users, Shield, Target, Zap, Sparkles, Flame,
  X
} from 'lucide-react'
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
  auction_duration?: number
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
  formatTimeRemaining?: (milliseconds: number, auctionDuration?: number) => string
}

const formatToMillions = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return value.toLocaleString('pt-BR')
}

// Função atualizada para gerar 200 opções de 1 em 1 milhão
const generateBidOptions = (currentBid: number) => {
  const options = []
  const minBid = currentBid + 1000000
  
  // Gera 200 opções de 1 em 1 milhão (1-200M acima do lance mínimo)
  for (let i = 0; i < 200; i++) {
    const bidValue = minBid + (i * 1000000)
    options.push({
      value: bidValue,
      label: `${formatToMillions(bidValue)}`
    })
  }
  
  // Adiciona algumas opções maiores para cobrir casos especiais
  for (let i = 0; i < 10; i++) {
    const bidValue = minBid + ((200 + i * 10) * 1000000)
    options.push({
      value: bidValue,
      label: `${formatToMillions(bidValue)}`
    })
  }
  
  return options.sort((a, b) => a.value - b.value)
}

// Função para agrupar opções em grupos de 10 para melhor visualização
const groupBidOptions = (options: {value: number, label: string}[]) => {
  const grouped = []
  for (let i = 0; i < options.length; i += 10) {
    grouped.push(options.slice(i, i + 10))
  }
  return grouped
}

// Componente de Progresso Customizado
const CustomProgress = ({ value, className }: { value: number; className?: string }) => {
  return (
    <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
      <div 
        className={cn("h-full transition-all duration-300", className)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
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
  formatTimeRemaining
}: AuctionCardProps) {
  const [bidModalOpen, setBidModalOpen] = useState(false)
  const [selectedBid, setSelectedBid] = useState<number | null>(null)
  const [bidOptions, setBidOptions] = useState<{value: number, label: string}[]>([])
  const [groupedBidOptions, setGroupedBidOptions] = useState<{value: number, label: string}[][]>([])
  const [timeRemaining, setTimeRemaining] = useState<number>(auction.time_remaining || 0)
  const [bids, setBids] = useState<Bid[]>([])
  const [showBidHistory, setShowBidHistory] = useState(false)
  const [loadingBids, setLoadingBids] = useState(false)
  const [timerProgress, setTimerProgress] = useState(100)
  const [isCancelling, setIsCancelling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Obter a duração do leilão
  const auctionDuration = auction.auction_duration || 5
  const isLongAuction = auctionDuration >= 1440 // 24 horas ou mais

  useEffect(() => {
    if (auction && bidModalOpen) {
      const options = generateBidOptions(auction.current_bid)
      setBidOptions(options)
      setGroupedBidOptions(groupBidOptions(options))
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

  // ⚡ TIMER COM BARRA DE PROGRESSO
  useEffect(() => {
    mountedRef.current = true
    
    if (type === 'active' && auction.status === 'active' && auction.end_time) {
      // Calcular duração total
      const startTime = new Date(auction.start_time).getTime()
      const endTime = new Date(auction.end_time!).getTime()
      const totalDuration = endTime - startTime
      
      const updateTimer = () => {
        if (!mountedRef.current) return
        
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        
        // Calcular progresso
        const progress = Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100))
        
        setTimeRemaining(remaining)
        setTimerProgress(progress)
        
        if (remaining <= 0 && onForceFinish) {
          setTimeout(() => onForceFinish(auction.id), 1000)
        }
      }
      
      updateTimer()
      
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
      setTimerProgress(100)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [auction.end_time, auction.start_time, auction.status, type, onForceFinish, auction.id])

  // Função corrigida para formatar tempo restante em horas, minutos e segundos
const defaultFormatTimeRemaining = (ms: number) => {
  if (ms <= 0) return '00:00:00'
  
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  // Formato: Dias hh:mm:ss
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Formato: hh:mm:ss (Ex: 10:12:26 em vez de 612:26)
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } 

  // Formato mm:ss
  return `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

  const formatTime = formatTimeRemaining || defaultFormatTimeRemaining

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      setTimeout(() => loadBidHistory(), 500)
    } catch (error) {
      console.error('Erro ao dar lance:', error)
    }
  }

  // Função de cancelamento aprimorada
  const handleCancel = async () => {
    if (!onCancelAuction) return
    
    if (!confirm('Tem certeza que deseja cancelar este leilão? Esta ação não pode ser desfeita.')) {
      return
    }
    
    try {
      setIsCancelling(true)
      await onCancelAuction(auction.id)
      toast.success('Leilão cancelado com sucesso!')
    } catch (error: any) {
      console.error('❌ Erro ao cancelar leilão:', error)
      toast.error(error.message || 'Erro ao cancelar leilão')
    } finally {
      setIsCancelling(false)
    }
  }

  // Verifica se tem saldo reservado
  const hasReservedBalance = team?.id && temSaldoReservado ? temSaldoReservado(auction.id) : false
  const isWinning = auction.current_bidder === team?.id
  const isParticipating = hasReservedBalance
  const isAlmostFinished = timeRemaining > 0 && timeRemaining < 30000
  const isCritical = timeRemaining > 0 && timeRemaining < 10000

  // PALETA ESCURA COM LARANJA (mesma da página principal)
  const getCardStyles = () => {
    switch (type) {
      case 'active': 
        return {
          // Card principal - fundo escuro com gradiente
          container: "bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-orange-600/30 shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 backdrop-blur-sm",
          statusColor: "text-orange-400",
          statusBg: "bg-orange-500/20",
          borderColor: "border-orange-600/30",
          
          // Progresso do timer - laranja vibrante
          progressColor: isCritical ? "bg-gradient-to-r from-red-500 to-orange-500" : 
                       isAlmostFinished ? "bg-gradient-to-r from-orange-500 to-yellow-500" : 
                       "bg-gradient-to-r from-orange-600 to-orange-400",
          
          // Containers de valores - escurinhos
          valueBg: "bg-zinc-800/80 backdrop-blur-sm",
          valueBorder: "border-zinc-700/60",
          valueHover: "hover:bg-zinc-700/80 hover:border-zinc-600 hover:shadow-lg transition-all duration-200",
          
          // Timer - fundo laranja escuro
          timerBg: "bg-gradient-to-r from-orange-900/40 to-red-900/40",
          timerText: isCritical ? "text-red-300" : "text-orange-300",
          
          // Cores de destaque
          highlight: {
            primary: "bg-gradient-to-r from-orange-600 to-orange-700",
            primaryHover: "bg-gradient-to-r from-orange-700 to-orange-800",
            secondary: "bg-yellow-500/20",
            secondaryText: "text-yellow-300"
          }
        }
      case 'pending': 
        return {
          container: "bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-yellow-600/30 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 backdrop-blur-sm",
          statusColor: "text-yellow-400",
          statusBg: "bg-yellow-500/20",
          borderColor: "border-yellow-600/30",
          progressColor: "bg-gradient-to-r from-yellow-600 to-yellow-400",
          valueBg: "bg-zinc-800/80 backdrop-blur-sm",
          valueBorder: "border-zinc-700/60",
          valueHover: "hover:bg-zinc-700/80 hover:border-zinc-600 hover:shadow-lg transition-all duration-200",
          timerBg: "bg-gradient-to-r from-yellow-900/40 to-amber-900/40",
          timerText: "text-yellow-300",
          highlight: {
            primary: "bg-gradient-to-r from-yellow-600 to-yellow-700",
            primaryHover: "bg-gradient-to-r from-yellow-700 to-yellow-800",
            secondary: "bg-yellow-500/20",
            secondaryText: "text-yellow-300"
          }
        }
      case 'finished': 
        return {
          container: "bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-zinc-600/30 shadow-xl hover:shadow-2xl hover:shadow-zinc-500/20 transition-all duration-300 backdrop-blur-sm",
          statusColor: "text-zinc-400",
          statusBg: "bg-zinc-500/20",
          borderColor: "border-zinc-600/30",
          progressColor: "bg-gradient-to-r from-zinc-600 to-zinc-500",
          valueBg: "bg-zinc-800/80 backdrop-blur-sm",
          valueBorder: "border-zinc-700/60",
          valueHover: "hover:bg-zinc-700/80 hover:border-zinc-600 hover:shadow-lg transition-all duration-200",
          timerBg: "bg-gradient-to-r from-zinc-900/40 to-zinc-800/40",
          timerText: "text-zinc-400",
          highlight: {
            primary: "bg-gradient-to-r from-zinc-700 to-zinc-800",
            primaryHover: "bg-gradient-to-r from-zinc-800 to-zinc-900",
            secondary: "bg-zinc-500/20",
            secondaryText: "text-zinc-300"
          }
        }
      default: 
        return {
          container: "bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-zinc-600/30 shadow-xl hover:shadow-2xl hover:shadow-zinc-500/20 transition-all duration-300 backdrop-blur-sm",
          statusColor: "text-zinc-400",
          statusBg: "bg-zinc-500/20",
          borderColor: "border-zinc-600/30",
          progressColor: "bg-gradient-to-r from-zinc-600 to-zinc-500",
          valueBg: "bg-zinc-800/80 backdrop-blur-sm",
          valueBorder: "border-zinc-700/60",
          valueHover: "hover:bg-zinc-700/80 hover:border-zinc-600 hover:shadow-lg transition-all duration-200",
          timerBg: "bg-gradient-to-r from-zinc-900/40 to-zinc-800/40",
          timerText: "text-zinc-400",
          highlight: {
            primary: "bg-gradient-to-r from-zinc-700 to-zinc-800",
            primaryHover: "bg-gradient-to-r from-zinc-800 to-zinc-900",
            secondary: "bg-zinc-500/20",
            secondaryText: "text-zinc-300"
          }
        }
    }
  }

  const styles = getCardStyles()

  // Formatar duração do leilão
  const formatAuctionDuration = () => {
    if (auctionDuration < 60) {
      return `${auctionDuration} minutos`
    } else if (auctionDuration === 60) {
      return '1 hora'
    } else if (auctionDuration < 1440) {
      const hours = auctionDuration / 60
      return `${hours} horas`
    } else {
      const days = auctionDuration / 1440
      return `${days} dia${days > 1 ? 's' : ''}`
    }
  }

  if (finalizing) {
    return (
      <Card className="p-4 relative opacity-70 bg-gradient-to-br from-zinc-900 to-zinc-800 border-orange-600/30 rounded-xl shadow-lg">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-zinc-300 font-bold">Finalizando...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("relative overflow-hidden border rounded-xl", styles.container)}>
      {/* Indicadores de status */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {hasReservedBalance && type !== 'finished' && (
          <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
            <Lock className="w-3 h-3 mr-1.5" />
            Participando
          </Badge>
        )}
        
        {isWinning && (
          <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
            <Crown className="w-3 h-3 mr-1.5" />
            Líder
          </Badge>
        )}

        {isLongAuction && type === 'active' && (
          <Badge className="bg-gradient-to-r from-zinc-700 to-zinc-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
            <Clock className="w-3 h-3 mr-1.5" />
            {formatAuctionDuration()}
          </Badge>
        )}
      </div>

      {/* Cabeçalho */}
      <div className="p-4 border-b border-zinc-700/50">
        <div className="flex items-start gap-4">
          {/* Avatar do jogador */}
          <div className="relative flex-shrink-0">
            {auction.player?.photo_url ? (
              <img 
                src={auction.player.photo_url} 
                alt={auction.player.name}
                className="w-20 h-20 rounded-xl object-cover border-2 border-orange-500/50 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-900/80 to-orange-700/80 border-2 border-orange-500/50 shadow-lg flex items-center justify-center">
                <User className="w-10 h-10 text-orange-400/80" />
              </div>
            )}
          </div>

          {/* Informações do jogador */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 truncate">
                  {auction.player?.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-zinc-800/80 text-zinc-300 border-zinc-700 shadow-md">
                    {auction.player?.position}
                  </Badge>
                  
                  {/* OVR badge */}
                  <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs font-bold px-3 py-1.5 shadow-lg">
                    OVR {auction.player?.overall}
                  </Badge>
                  
                  <Badge className={cn("text-xs px-3 py-1.5 rounded-lg border shadow-md", 
                    styles.statusBg, styles.statusColor, styles.borderColor)}>
                    {type === 'active' ? 'LEILÃO ATIVO' : 
                     type === 'pending' ? 'AGENDADO' : 'FINALIZADO'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Timer e informações do leilão */}
            <div className="mt-3 space-y-2">
              {type === 'active' && timeRemaining > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "flex items-center gap-2 font-mono px-3 py-2 rounded-lg border shadow-md",
                      styles.timerBg,
                      styles.timerText,
                      "border-zinc-700/50"
                    )}>
                      <Timer className="w-4 h-4" />
                      <span className="font-bold text-lg tracking-wider">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                    {!isLongAuction && (
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full shadow-md",
                        isCritical ? "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300" :
                        isAlmostFinished ? "bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300" :
                        "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300"
                      )}>
                        {Math.round(timerProgress)}%
                      </span>
                    )}
                  </div>
                  
                  {!isLongAuction && (
                    <CustomProgress 
                      value={timerProgress} 
                      className={styles.progressColor}
                    />
                  )}
                </div>
              )}
              
              {type === 'pending' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-zinc-400 text-sm">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 px-3 py-2 rounded-lg border border-yellow-600/30 shadow-md">
                    <Calendar className="w-4 h-4 text-yellow-400" />
                    <span>Início: <span className="text-white font-medium">{formatFullDate(auction.start_time)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 px-3 py-2 rounded-lg border border-yellow-600/30 shadow-md">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Duração: <span className="text-white font-medium">{formatAuctionDuration()}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="p-4 space-y-4">
        {/* Grid de valores */}
        <div className="grid grid-cols-2 gap-3">
          {/* Valor atual */}
          <div className={cn(
            "rounded-lg p-4 border shadow-md transition-all duration-200 cursor-pointer group",
            styles.valueBg,
            styles.valueBorder,
            styles.valueHover
          )}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-orange-600/20 to-orange-700/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Valor Atual</span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1 tracking-tight">
                  R$ {formatToMillions(auction.current_bid)}
                </div>
                {type === 'active' && auction.current_bid === auction.start_price && (
                  <div className="text-xs text-orange-400 font-medium">Preço inicial</div>
                )}
              </div>
            </div>
          </div>

          {/* Preço inicial */}
          <div className={cn(
            "rounded-lg p-4 border shadow-md transition-all duration-200 cursor-pointer group",
            styles.valueBg,
            styles.valueBorder,
            styles.valueHover
          )}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Target className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Preço Inicial</span>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white tracking-tight">
                  R$ {formatToMillions(auction.start_price)}
                </div>
                <div className="text-xs text-zinc-500 mt-1 font-medium">Valor base</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time líder/vencedor */}
        {auction.current_bidder !== null && (
          <div className={cn(
            "rounded-lg p-4 border shadow-md transition-all duration-200",
            isWinning ? "bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-600/30" : 
            cn("bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/30", styles.valueBorder)
          )}>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg shadow-md",
                    isWinning ? "bg-gradient-to-r from-yellow-600/20 to-yellow-700/20" : "bg-gradient-to-r from-orange-600/20 to-orange-700/20"
                  )}>
                    <Crown className={cn(
                      "w-4 h-4",
                      isWinning ? "text-yellow-400" : "text-orange-400"
                    )} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-300">
                      {type === 'active' ? 'Lance líder' : 'Vencedor'}
                    </span>
                    {isWinning && type === 'active' && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white text-xs px-2 py-0.5 rounded-full">
                        Você
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-2 rounded-lg border border-zinc-700/60 shadow-md">
                  {auction.current_bidder_team?.logo_url && (
                    <img 
                      src={auction.current_bidder_team.logo_url} 
                      alt={auction.current_bidder_team.name}
                      className="w-7 h-7 rounded-full border-2 border-orange-500/50 flex-shrink-0"
                    />
                  )}
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isWinning ? "text-yellow-300" : "text-orange-300"
                  )}>
                    {auction.current_bidder_team?.name || 'Time desconhecido'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão de lance ou modal */}
        {type === 'active' && timeRemaining > 0 && (
          bidModalOpen ? (
            <div className="space-y-4 p-4 bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-lg border border-orange-600/30 shadow-lg">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-white text-lg flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Fazer Lance
                  </h4>
                  <Badge className={cn("text-xs px-3 py-1.5 rounded-lg border shadow-md", styles.statusBg, styles.statusColor, styles.borderColor)}>
                    Mínimo: R$ {formatToMillions(auction.current_bid + 1000000)}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <Select onValueChange={handleBidSelect} value={selectedBid?.toString() || ''}>
                    <SelectTrigger className="w-full bg-zinc-800 border-orange-600/50 text-white hover:border-orange-500 shadow-md">
                      <SelectValue placeholder="Selecione um valor" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-orange-600/50 max-h-80 shadow-2xl">
                      <div className="max-h-72 overflow-y-auto pr-1">
                        {groupedBidOptions.map((group, groupIndex) => (
                          <div key={groupIndex} className="mb-2">
                            <div className="text-xs text-zinc-400 px-3 py-1.5 bg-zinc-900/80 rounded-lg mb-1 border border-zinc-700/60 shadow-md">
                              Grupo {groupIndex + 1}: R$ {formatToMillions(group[0].value)} - R$ {formatToMillions(group[group.length - 1].value)}
                            </div>
                            {group.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value.toString()}
                                className="hover:bg-orange-900/50 hover:text-white focus:bg-orange-900/50 focus:text-white cursor-pointer my-0.5 text-zinc-300"
                              >
                                <div className="flex justify-between items-center w-full py-1">
                                  <span className="font-medium group-hover:text-white">R$ {option.label}</span>
                                  <span className="text-zinc-500 text-sm font-mono group-hover:text-zinc-400">
                                    {option.value.toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </div>
                      
                      {/* Input customizado */}
                      <div className="mt-2 pt-2 border-t border-zinc-700/60">
                        <div className="px-3 pb-2">
                          <p className="text-xs text-zinc-400 mb-1 font-medium">Valor personalizado (acima de R$ {formatToMillions(bidOptions[bidOptions.length - 1]?.value || 0)})</p>
                          <input
                            type="number"
                            placeholder="Digite o valor desejado"
                            className="w-full bg-zinc-900/80 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 shadow-md"
                            onChange={(e) => {
                              const value = parseInt(e.target.value)
                              if (!isNaN(value) && value > 0) {
                                setSelectedBid(value)
                              }
                            }}
                          />
                        </div>
                      </div>
                    </SelectContent>
                  </Select>

                  {selectedBid && (
                    <div className="p-4 bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-600/30 rounded-lg shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-orange-600/30 to-orange-700/30 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-orange-400" />
                          </div>
                          <span className="text-orange-400 font-medium">Seu lance</span>
                        </div>
                        <span className="font-bold text-white text-xl tracking-tight">
                          R$ {formatToMillions(selectedBid)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setBidModalOpen(false)}
                      className="flex-1 border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 shadow-md"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handlePlaceBid}
                      disabled={!selectedBid}
                      className={cn(
                        "flex-1 font-medium border shadow-lg",
                        styles.highlight.primary,
                        "hover:" + styles.highlight.primaryHover,
                        "text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <Flame className="w-4 h-4 mr-2" />
                      Confirmar Lance
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setBidModalOpen(true)}
              className={cn(
                "w-full font-bold py-3 px-4 border shadow-lg rounded-lg",
                styles.highlight.primary,
                "hover:" + styles.highlight.primaryHover,
                "text-white disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              disabled={!team || hasReservedBalance}
              size="lg"
            >
              {!team ? (
                <div className="flex items-center gap-2 justify-center">
                  <Users className="w-5 h-5" />
                  <span>Sem Time</span>
                </div>
              ) : hasReservedBalance ? (
                <div className="flex items-center gap-2 justify-center">
                  <Lock className="w-5 h-5" />
                  <span>Já está participando</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <Flame className="w-5 h-5" />
                  <span>Fazer Lance</span>
                </div>
              )}
            </Button>
          )
        )}

        {/* Histórico de lances */}
        {(type === 'active' || type === 'finished') && bids.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowBidHistory(!showBidHistory)}
              className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 rounded-lg hover:from-zinc-700/80 hover:to-zinc-800/80 transition-all duration-200 group border border-zinc-700/60 hover:border-zinc-600 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-700/60 rounded-lg group-hover:bg-zinc-600/60 transition-all duration-200">
                  <History className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-zinc-300 group-hover:text-white">Histórico de Lances</p>
                  <p className="text-xs text-zinc-500 group-hover:text-zinc-400">{bids.length} lance{bids.length !== 1 ? 's' : ''} registrado{bids.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <ChevronRight className={cn(
                "w-5 h-5 text-zinc-500 transition-all duration-300",
                showBidHistory && "rotate-90 text-zinc-400"
              )} />
            </button>

            {showBidHistory && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {bids.map((bid, index) => (
                  <div 
                    key={bid.id} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border shadow-md transition-all duration-200 hover:shadow-lg",
                      index === 0 ? "bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-600/30" :
                      index < 3 ? "bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/30" :
                      "bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border-zinc-700/60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md",
                        index === 0 ? "bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 text-yellow-300 border border-yellow-600/30" :
                        index < 3 ? "bg-gradient-to-r from-orange-600/20 to-orange-700/20 text-orange-300 border border-orange-600/30" :
                        "bg-gradient-to-r from-zinc-700/60 to-zinc-800/60 text-zinc-300 border border-zinc-600/30"
                      )}>
                        <span className="text-xs font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        {bid.team?.logo_url ? (
                          <img 
                            src={bid.team.logo_url} 
                            alt={bid.team.name}
                            className="w-6 h-6 rounded-full border border-zinc-600 shadow-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-700/60 border border-zinc-600 shadow-md flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-zinc-300 truncate">
                          {bid.team?.name || 'Time'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="font-bold text-white text-right text-lg">
                        R$ {formatToMillions(bid.amount)}
                      </span>
                      <span className="text-xs text-zinc-400 text-right font-medium">
                        {formatDateTime(bid.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ações administrativas */}
        {isAdmin && type !== 'finished' && (
          <div className="pt-3 border-t border-zinc-700/50">
            <div className="flex flex-col sm:flex-row gap-2">
              {type === 'pending' && onStartAuction && (
                <Button
                  onClick={() => onStartAuction(auction.id)}
                  className={cn(
                    "flex-1 font-medium border shadow-lg",
                    styles.highlight.primary,
                    "hover:" + styles.highlight.primaryHover,
                    "text-white"
                  )}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Leilão
                </Button>
              )}
              {onCancelAuction && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-600/50 text-red-300 hover:from-red-800/40 hover:to-red-700/40 hover:text-red-200 hover:border-red-500/50 shadow-md"
                >
                  {isCancelling ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" />
                      Cancelando...
                    </div>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Leilão
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Status do time atual */}
        {team && (type === 'active' || type === 'finished') && (
          <div className={cn(
            "rounded-lg p-4 border shadow-md transition-all duration-200",
            isWinning ? "bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-600/30" :
            isParticipating ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-600/30" :
            cn("bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border-zinc-700/60", styles.valueBorder)
          )}>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isWinning ? (
                    <>
                      <div className="p-1.5 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 rounded-lg">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      </div>
                      <span className="text-sm font-medium text-yellow-300">
                        Você está liderando!
                      </span>
                    </>
                  ) : isParticipating ? (
                    <>
                      <div className="p-1.5 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-lg">
                        <Award className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-green-300">
                        Você está participando
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="p-1.5 bg-gradient-to-r from-zinc-700/60 to-zinc-800/60 rounded-lg">
                        <Shield className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-400">
                        Você não está participando
                      </span>
                    </>
                  )}
                </div>
                
                {type === 'active' && getSaldoReservadoParaLeilao && (
                  <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-600/30 text-green-300">
                    Reservado: R$ {formatToMillions(getSaldoReservadoParaLeilao(auction.id))}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}