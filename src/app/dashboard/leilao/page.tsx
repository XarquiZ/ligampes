// src/app/dashboard/leilao/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  AlertCircle
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
}

interface UserProfile {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

type TabType = 'active' | 'pending' | 'finished'

// Formatar valores para exibição (ex: 50M)
const formatToMillions = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return value.toLocaleString('pt-BR')
}

// Gerar opções de lance
const generateBidOptions = (currentBid: number): { value: number; label: string }[] => {
  const options = []
  const minBid = currentBid + 1000000 // Lance mínimo: 1 milhão acima
  
  for (let i = 0; i < 20; i++) { // Reduzido para 20 opções
    const bidValue = minBid + (i * 1000000)
    options.push({
      value: bidValue,
      label: `${formatToMillions(bidValue)}`
    })
  }
  
  return options
}

// Hook para saldo reservado
const useSaldoReservado = (teamId: string | null) => {
  const [saldoReservado, setSaldoReservado] = useState<{[key: string]: number}>({})

  const reservarSaldo = (auctionId: string, amount: number) => {
    if (!auctionId || amount <= 0 || !teamId) return
    setSaldoReservado(prev => ({ ...prev, [auctionId]: amount }))
  }

  const liberarSaldo = (auctionId: string) => {
    if (!auctionId || !teamId) return
    setSaldoReservado(prev => {
      const novo = { ...prev }
      delete novo[auctionId]
      return novo
    })
  }

  const getSaldoReservado = () => {
    return Object.values(saldoReservado).reduce((total, valor) => total + valor, 0)
  }

  const limparTodos = () => {
    setSaldoReservado({})
  }

  return {
    saldoReservado,
    reservarSaldo,
    liberarSaldo,
    getSaldoReservado,
    limparTodos
  }
}

export default function PaginaLeilao() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Estados para o chat
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Estados para o modal de criar leilão
  const [createAuctionModalOpen, setCreateAuctionModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [startPrice, setStartPrice] = useState('')
  const [auctionDuration, setAuctionDuration] = useState('5')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [freePlayers, setFreePlayers] = useState<Player[]>([])
  const [creatingAuction, setCreatingAuction] = useState(false)

  // Estados principais
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('active')

  // Estados para lances
  const [biddingAuctionId, setBiddingAuctionId] = useState<string | null>(null)
  const [selectedBidAmount, setSelectedBidAmount] = useState<number | null>(null)
  const [bidding, setBidding] = useState(false)
  const [bids, setBids] = useState<{[key: string]: Bid[]}>({})

  // Hook simplificado
  const {
    saldoReservado,
    reservarSaldo,
    liberarSaldo,
    getSaldoReservado,
    limparTodos
  } = useSaldoReservado(team?.id || null)

  // Estado para contagem regressiva
  const [currentTime, setCurrentTime] = useState(Date.now())

  // REF para evitar múltiplas execuções
  const isProcessingRef = useRef(false)
  const subscriptionsRef = useRef<any[]>([])

  // CARREGAMENTO INICIAL
  useEffect(() => {
    loadInitialData()
    
    return () => {
      // Limpar todas as subscriptions ao desmontar
      subscriptionsRef.current.forEach(sub => {
        supabase.removeChannel(sub)
      })
    }
  }, [])

  // CONTAGEM REGRESSIVA SEPARADA
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // CONFIGURAR REALTIME SUPABASE
  useEffect(() => {
    if (!user || !team) return

    // Canal para atualizações de leilões
    const auctionsChannel = supabase
      .channel('auctions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: 'status=eq.active'
        },
        async (payload) => {
          console.log('🔄 Atualização de leilão em tempo real:', payload)
          
          if (payload.eventType === 'UPDATE') {
            const updatedAuction = payload.new as Auction
            
            // Buscar dados completos do leilão atualizado
            const { data: fullAuction } = await supabase
              .from('auctions')
              .select(`
                *,
                player:players(*),
                current_bidder_team:teams!auctions_current_bidder_fkey(name, logo_url)
              `)
              .eq('id', updatedAuction.id)
              .single()
            
            if (fullAuction) {
              setAuctions(prev => {
                const index = prev.findIndex(a => a.id === fullAuction.id)
                if (index >= 0) {
                  const newAuctions = [...prev]
                  newAuctions[index] = {
                    ...fullAuction,
                    time_remaining: fullAuction.end_time && fullAuction.status === 'active' 
                      ? Math.max(0, new Date(fullAuction.end_time).getTime() - currentTime)
                      : 0
                  }
                  return newAuctions
                }
                return prev
              })

              // Se o usuário atual perdeu o leilão, liberar saldo
              if (team && updatedAuction.current_bidder !== team.id) {
                liberarSaldo(updatedAuction.id)
              }
            }
          }
        }
      )
      .subscribe()

    // Canal para novos lances
    const bidsChannel = supabase
      .channel('bids_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids'
        },
        async (payload) => {
          const newBid = payload.new as Bid
          console.log('💰 Novo lance em tempo real:', newBid)
          
          // Carregar lances atualizados para este leilão
          const { data: updatedBids } = await supabase
            .from('bids')
            .select(`
              *,
              team:teams(name, logo_url)
            `)
            .eq('auction_id', newBid.auction_id)
            .order('created_at', { ascending: false })
          
          if (updatedBids) {
            setBids(prev => ({
              ...prev,
              [newBid.auction_id]: updatedBids
            }))
          }
        }
      )
      .subscribe()

    // Canal para atualizações de saldo
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
          console.log('💰 Saldo atualizado em tempo real:', payload.new.balance)
          setTeam(prev => prev ? { ...prev, balance: payload.new.balance } : null)
        }
      )
      .subscribe()

    subscriptionsRef.current = [auctionsChannel, bidsChannel, balanceChannel]

    return () => {
      supabase.removeChannel(auctionsChannel)
      supabase.removeChannel(bidsChannel)
      supabase.removeChannel(balanceChannel)
    }
  }, [user, team, currentTime])

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

  const getSaldoDisponivel = () => {
    if (!team) return 0
    return team.balance - getSaldoReservado()
  }

  // FUNÇÃO MELHORADA PARA CARREGAR DADOS INICIAIS
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

      // Carregar perfil com join no time
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

      await loadAuctions()
      
      if (profile?.role === 'admin') {
        await loadFreePlayers()
      }

      toast.success('Dados carregados com sucesso!')

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do leilão')
    } finally {
      setLoading(false)
    }
  }

  // FUNÇÃO PARA CARREGAR LEILÕES
  const loadAuctions = async () => {
    console.log('📥 Carregando leilões...')
    
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
      
      // Calcular tempo restante
      const auctionsWithTime = (auctionsData || []).map(auction => {
        if (auction.status !== 'active' || !auction.end_time) {
          return { ...auction, time_remaining: 0 }
        }
        const endTime = new Date(auction.end_time).getTime()
        const timeRemaining = Math.max(0, endTime - currentTime)
        return { ...auction, time_remaining: timeRemaining }
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

  // FUNÇÃO PARA CALCULAR TEMPO RESTANTE
  const calculateTimeRemaining = useCallback((auction: Auction) => {
    if (auction.status !== 'active' || !auction.end_time) {
      return 0
    }
    const endTime = new Date(auction.end_time).getTime()
    return Math.max(0, endTime - currentTime)
  }, [currentTime])

  // Função startPendingAuction
  const startPendingAuction = async (auctionId: string) => {
    try {
      console.log(`🎬 Iniciando leilão pendente: ${auctionId}`)
      
      const { data: auctionData } = await supabase
        .from('auctions')
        .select('*')
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

      toast.success('Leilão iniciado com sucesso!')
      await loadAuctions()

    } catch (error: any) {
      console.error('❌ Erro ao iniciar leilão:', error)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Função de formatação para criação de leilão
  const formatCurrencyCreate = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '')
    if (onlyNumbers === '') return ''
    
    const number = parseInt(onlyNumbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Obter data mínima para o date picker
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // CRIAÇÃO DE LEILÃO
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

      // Combinar data e hora
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

  // Função handleStartAuction
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
      await supabase
        .from('auctions')
        .delete()
        .eq('id', auctionId)

      await supabase
        .from('bids')
        .delete()
        .eq('auction_id', auctionId)

      toast.success('Leilão cancelado!')
      await loadAuctions()
      await loadFreePlayers()

    } catch (error: any) {
      console.error('❌ Erro ao cancelar leilão:', error)
      toast.error(`Erro: ${error.message}`)
    }
  }

  // FUNÇÃO ATUALIZADA: Dar lance usando RPC atômica
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

    setBidding(true)
    isProcessingRef.current = true

    try {
      console.log('📤 Enviando lance para RPC...')
      
      // Usar RPC com transação atômica
      const { data, error } = await supabase.rpc('place_bid_atomic', {
        p_auction_id: auctionId,
        p_team_id: team.id,
        p_amount: amount
      })

      if (error) {
        console.error('❌ Erro na RPC:', error)
        throw new Error(`Erro técnico: ${error.message}`)
      }

      console.log('📥 Resposta da RPC:', data)

      if (!data.success) {
        toast.error(data.error || 'Erro ao processar lance')
        return
      }

      console.log('✅ LANCE BEM-SUCEDIDO:', data)
      
      // Reservar saldo localmente
      reservarSaldo(auctionId, amount)
      
      // Atualizar interface
      setSelectedBidAmount(null)
      setBiddingAuctionId(null)
      
      // Recarregar dados
      await loadAuctions()
      
      toast.success('Lance realizado com sucesso!')
      
      if (data.time_extended) {
        toast.info('⏰ Tempo do leilão estendido em 30 segundos!')
      }

    } catch (error: any) {
      console.error('❌ ERRO NO LANCE:', error)
      toast.error(`Erro: ${error.message || 'Falha ao processar lance'}`)
    } finally {
      setBidding(false)
      isProcessingRef.current = false
    }
  }

  // Função finishAuction (apenas para emergência)
  const finishAuction = async (auctionId: string) => {
    try {
      console.log(`🏁 Finalizando leilão manualmente: ${auctionId}`)
      
      const { data: auctionData } = await supabase
        .from('auctions')
        .select(`
          *,
          player:players(*),
          current_bidder_team:teams!auctions_current_bidder_fkey(*)
        `)
        .eq('id', auctionId)
        .single()

      if (!auctionData || auctionData.status !== 'active') {
        toast.info('Leilão já finalizado ou não encontrado')
        return
      }

      // Apenas atualizar status - o trigger vai processar o resto
      const { error } = await supabase
        .from('auctions')
        .update({ status: 'finished' })
        .eq('id', auctionId)

      if (error) throw error

      toast.success('Leilão finalizado com sucesso!')
      await loadAuctions()
      
    } catch (error: any) {
      console.error('💥 Erro ao finalizar leilão:', error)
      toast.error(`Erro: ${error.message}`)
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

  // Função para filtrar leilões
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
            onFinishAuction={finishAuction}
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
      {/* Sidebar */}
      <Sidebar 
        user={user!}
        profile={profile}
        team={team}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-orange-950/20 to-zinc-950 text-white p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header com botão de refresh */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-black text-white mb-2">LEILÃO DE JOGADORES</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={loadAuctions}
                    className="hover:bg-zinc-800/50"
                    title="Recarregar leilões"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-zinc-400 text-lg">
                  Adquira os melhores jogadores livres no mercado
                </p>
              </div>

              {/* Informações do time com saldo reservado */}
              {team && (
                <div className="flex items-center gap-4 bg-zinc-800/50 rounded-lg p-4">
                  {team.logo_url && (
                    <img 
                      src={team.logo_url} 
                      alt={team.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-white">{team.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-green-400">
                        Saldo: R$ {formatToMillions(team.balance)}
                      </p>
                      {getSaldoReservado() > 0 && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                          -R$ {formatToMillions(getSaldoReservado())}
                        </Badge>
                      )}
                    </div>
                    {getSaldoReservado() > 0 && (
                      <p className="text-sm text-yellow-400 mt-1">
                        Disponível: R$ {formatToMillions(getSaldoDisponivel())}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isAdmin && (
                <Dialog open={createAuctionModalOpen} onOpenChange={setCreateAuctionModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
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

            {/* Sistema de Abas */}
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

            {/* Conteúdo das Abas */}
            <div className="min-h-[400px]">
              {renderTabContent()}
            </div>
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

// COMPONENTE AUCTIONCARD ATUALIZADO
const AuctionCard = ({ 
  auction, 
  type, 
  onBid, 
  onStartAuction, 
  onCancelAuction,
  onFinishAuction,
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
  saldoReservado
}: any) => {

  const [bidOptions, setBidOptions] = useState<{ value: number; label: string }[]>([])
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)

  // Atualizar opções quando o leilão mudar
  useEffect(() => {
    if (auction && isBidModalOpen) {
      const options = generateBidOptions(auction.current_bid)
      setBidOptions(options)
    }
  }, [auction, isBidModalOpen])

  // Sincronizar modal
  useEffect(() => {
    setIsBidModalOpen(biddingAuctionId === auction.id)
    if (biddingAuctionId !== auction.id) {
      setSelectedBidAmount(null)
    }
  }, [biddingAuctionId, auction.id])

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

  const timeRemaining = calculateTimeRemaining(auction)
  const isCurrentUserLeader = team && auction.current_bidder === team.id
  const temSaldoReservado = saldoReservado && saldoReservado[auction.id]

  return (
    <Card className={cn("p-6 relative", getCardStyles())}>
      {/* Badge de saldo reservado */}
      {temSaldoReservado && (
        <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white">
          Reserva
        </Badge>
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
              {/* Contagem regressiva */}
              {type === 'active' && timeRemaining > 0 && (
                <div className="flex items-center gap-1 text-red-400 mb-1">
                  <Timer className="w-4 h-4" />
                  <span className="font-mono font-bold">
                    {formatTimeRemaining(timeRemaining)}
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
            
            {/* Mostrar líder */}
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

        {/* Botão de lance */}
        {type === 'active' && timeRemaining > 0 && (
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
              disabled={!team}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {!team ? 'Sem Time' : 'Fazer Lance'}
            </Button>
          )
        )}

        {isAdmin && type !== 'finished' && (
          <div className="flex gap-2">
            {type === 'pending' && (
              <Button
                onClick={() => onStartAuction(auction.id)}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Agora
              </Button>
            )}
            {type === 'active' && timeRemaining <= 0 && (
              <Button
                onClick={() => onFinishAuction(auction.id)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Finalizar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onCancelAuction(auction.id)}
              className={cn(
                "flex-1 bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30",
                type === 'pending' ? "flex-1" : "w-full"
              )}
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
                    <span className={index === 0 ? "font-bold text-yellow-400" : ""}>
                      {bid.team?.name}
                    </span>
                  </div>
                  <span className={cn(
                    "font-bold",
                    index === 0 ? "text-yellow-400" : ""
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