// src/app/dashboard/leilao/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
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
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'

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
  auction_duration?: number // NOVO CAMPO: duração do leilão em minutos
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

// Hook para saldo reservado específico por time
const useSaldoReservado = (teamId: string | null) => {
  const [saldoReservado, setSaldoReservado] = useState<{[key: string]: number}>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar do localStorage na inicialização - ESPECÍFICO POR TIME
  useEffect(() => {
    const loadSaldoReservado = () => {
      if (!teamId) {
        setIsLoaded(true)
        return
      }

      try {
        const key = `saldoReservadoLeilao_${teamId}`
        const saved = localStorage.getItem(key)
        console.log('📥 Tentando carregar saldo reservado do localStorage para time:', teamId, saved)
        
        if (saved) {
          const parsed = JSON.parse(saved)
          
          // Verificação mais robusta dos dados
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            // Filtrar apenas valores numéricos válidos
            const filtered: {[key: string]: number} = {}
            Object.keys(parsed).forEach(key => {
              const value = parsed[key]
              if (typeof value === 'number' && value > 0) {
                filtered[key] = value
              }
            })
            
            setSaldoReservado(filtered)
            console.log('💰 Saldo reservado carregado com sucesso para time', teamId, ':', filtered)
          } else {
            console.warn('⚠️ Dados de saldo reservado inválidos, limpando...')
            localStorage.removeItem(key)
          }
        } else {
          console.log('ℹ️ Nenhum saldo reservado encontrado no localStorage para time:', teamId)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar saldo reservado:', error)
        if (teamId) {
          localStorage.removeItem(`saldoReservadoLeilao_${teamId}`)
        }
      } finally {
        setIsLoaded(true)
      }
    }

    loadSaldoReservado()
  }, [teamId])

  // Salvar no localStorage sempre que mudar - ESPECÍFICO POR TIME
  useEffect(() => {
    if (!isLoaded || !teamId) return

    try {
      const key = `saldoReservadoLeilao_${teamId}`
      console.log('💾 Salvando saldo reservado no localStorage para time:', teamId, saldoReservado)
      localStorage.setItem(key, JSON.stringify(saldoReservado))
    } catch (error) {
      console.error('❌ Erro ao salvar saldo reservado:', error)
    }
  }, [saldoReservado, isLoaded, teamId])

  const reservarSaldo = (auctionId: string, amount: number) => {
    if (!auctionId || amount <= 0 || !teamId) {
      console.error('❌ Parâmetros inválidos para reservarSaldo:', { auctionId, amount, teamId })
      return
    }

    setSaldoReservado(prev => {
      const novo = { ...prev, [auctionId]: amount }
      console.log(`💰 Saldo reservado para leilão ${auctionId} do time ${teamId}: R$ ${amount.toLocaleString('pt-BR')}`)
      console.log('📊 Estado atualizado do saldo reservado:', novo)
      return novo
    })
  }

  const liberarSaldo = (auctionId: string) => {
    if (!auctionId || !teamId) {
      console.error('❌ Parâmetros inválidos para liberarSaldo')
      return
    }

    setSaldoReservado(prev => {
      const novo = { ...prev }
      if (novo[auctionId]) {
        console.log(`💰 Saldo liberado do leilão ${auctionId} do time ${teamId}: R$ ${novo[auctionId].toLocaleString('pt-BR')}`)
        delete novo[auctionId]
        console.log('📊 Estado após liberação:', novo)
      }
      return novo
    })
  }

  const getSaldoReservado = () => {
    const total = Object.values(saldoReservado).reduce((total, valor) => total + valor, 0)
    console.log('📈 Total do saldo reservado calculado para time', teamId, ':', total)
    return total
  }

  // NOVA FUNÇÃO: Sincronizar com estado atual dos leilões
  const sincronizarComLeiloes = (auctions: Auction[]) => {
    if (!isLoaded || !teamId) return false
    
    let atualizado = false
    const agora = Date.now()
    
    setSaldoReservado(prev => {
      const novo = { ...prev }
      
      Object.keys(novo).forEach(auctionId => {
        const auction = auctions.find(a => a.id === auctionId)
        const valorReservado = novo[auctionId]
        
        // Condições para liberar saldo automaticamente
        if (!auction) {
          console.log(`🔄 Liberando saldo reservado - leilão ${auctionId} não existe mais`)
          delete novo[auctionId]
          atualizado = true
        } else if (auction.status === 'finished') {
          console.log(`🔄 Liberando saldo reservado - leilão ${auctionId} finalizado`)
          delete novo[auctionId]
          atualizado = true
        } else if (auction.current_bidder !== teamId) {
          console.log(`🔄 Liberando saldo reservado - não é mais o líder no leilão ${auctionId}`)
          delete novo[auctionId]
          atualizado = true
        } else if (auction.end_time && new Date(auction.end_time).getTime() < agora) {
          console.log(`🔄 Liberando saldo reservado - leilão ${auctionId} expirado`)
          delete novo[auctionId]
          atualizado = true
        } else if (auction.current_bid !== valorReservado) {
          console.log(`🔄 Liberando saldo reservado - lance atual diferente do reservado no leilão ${auctionId}`)
          delete novo[auctionId]
          atualizado = true
        }
      })
      
      if (atualizado) {
        console.log('🔄 Estado do saldo reservado sincronizado para time', teamId, ':', novo)
      }
      
      return novo
    })
    
    return atualizado
  }

  return {
    saldoReservado,
    reservarSaldo,
    liberarSaldo,
    getSaldoReservado,
    sincronizarComLeiloes,
    isLoaded
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
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [bids, setBids] = useState<{[key: string]: Bid[]}>({})

  // Hook melhorado com sincronização e específico por time
  const {
    saldoReservado,
    reservarSaldo,
    liberarSaldo,
    getSaldoReservado,
    sincronizarComLeiloes,
    isLoaded
  } = useSaldoReservado(team?.id || null)

  // Estado separado para contagem regressiva
  const [currentTime, setCurrentTime] = useState(Date.now())

  // NOVO: Estado para polling em tempo real
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // CARREGAMENTO INICIAL - APENAS UMA VEZ
  useEffect(() => {
    loadInitialData()
  }, [])

  // CORREÇÃO: Polling a cada 1 segundo
  useEffect(() => {
    const pollingInterval = setInterval(async () => {
      // Verificar se há leilões ativos ou pendentes
      const hasActiveOrPending = auctions.some(a => a.status === 'active' || a.status === 'pending')
      
      if (hasActiveOrPending) {
        console.log('🔄 Polling: verificando atualizações...')
        await loadAuctions(true) // true indica que é uma atualização silenciosa
      }
    }, 1000) // CORREÇÃO: Alterado para 1 segundo

    return () => clearInterval(pollingInterval)
  }, [auctions])

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

  // CONTAGEM REGRESSIVA SEPARADA
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // SINCRONIZAR SALDO RESERVADO COM ESTADO ATUAL DOS LEILÕES
  useEffect(() => {
    if (isLoaded && auctions.length > 0 && team) {
      console.log('🔄 Sincronizando saldo reservado com estado atual dos leilões para time:', team.id)
      const atualizado = sincronizarComLeiloes(auctions)
      
      if (atualizado) {
        console.log('🔄 Recarregando dados após sincronização...')
        // Recarregar dados se houve mudanças no saldo reservado
        setTimeout(() => loadInitialData(), 100)
      }
    }
  }, [isLoaded, auctions, team])

  // VERIFICAR LEILÕES QUE DEVEM SER FINALIZADOS OU INICIADOS
  useEffect(() => {
    const checkAuctions = async () => {
      const now = Date.now()
      
      // Verificar leilões ativos que devem finalizar
      const activeAuctions = auctions.filter(a => a.status === 'active')
      for (const auction of activeAuctions) {
        if (auction.end_time) {
          const endTime = new Date(auction.end_time).getTime()
          if (now >= endTime) {
            console.log(`⏰ Finalizando leilão ${auction.id} - tempo esgotado`)
            await finishAuction(auction.id)
          }
        }
      }
      
      // Verificar leilões pendentes que devem iniciar
      const pendingAuctions = auctions.filter(a => a.status === 'pending')
      for (const auction of pendingAuctions) {
        const startTime = new Date(auction.start_time).getTime()
        if (now >= startTime) {
          console.log(`🎬 Iniciando leilão pendente ${auction.id}`)
          await startPendingAuction(auction.id)
        }
      }
    }
    
    checkAuctions()
  }, [currentTime, auctions])

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

        // Definir time diretamente do perfil
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

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // FUNÇÃO ATUALIZADA PARA CARREGAR LEILÕES (com polling silencioso)
  const loadAuctions = async (silent = false) => {
    if (!silent) {
      console.log('📥 Carregando leilões...')
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
        if (!silent) {
          console.error('❌ Erro ao carregar leilões:', error)
        }
        return
      }

      if (!silent) {
        console.log('🎯 Leilões encontrados no banco:', auctionsData?.length)
      }
      
      // Calcular tempo restante inicial
      const auctionsWithTime = (auctionsData || []).map(auction => {
        if (auction.status !== 'active' || !auction.end_time) {
          return { ...auction, time_remaining: 0 }
        }
        const endTime = new Date(auction.end_time).getTime()
        const timeRemaining = Math.max(0, endTime - currentTime)
        return { ...auction, time_remaining: timeRemaining }
      })
      
      // Atualizar estado de forma otimizada para evitar piscadas
      setAuctions(prevAuctions => {
        // Se não há mudanças significativas, não atualize
        if (JSON.stringify(prevAuctions) === JSON.stringify(auctionsWithTime)) {
          return prevAuctions
        }
        return auctionsWithTime
      })

      if (!silent) {
        console.log('✅ Estado auctions atualizado:', auctionsWithTime.length)
      }

      // Carregar lances para leilões ativos
      const activeAuctions = auctionsWithTime.filter(a => a.status === 'active')
      for (const auction of activeAuctions) {
        await loadBids(auction.id, silent)
      }

      setLastUpdate(Date.now())

    } catch (error) {
      if (!silent) {
        console.error('❌ Erro inesperado:', error)
      }
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

  // FUNÇÃO ATUALIZADA PARA CARREGAR LANCES (com polling silencioso)
  const loadBids = async (auctionId: string, silent = false) => {
    try {
      if (!silent) {
        console.log(`📥 Carregando lances para leilão ${auctionId}`)
      }
      
      const { data: bidsData, error } = await supabase
        .from('bids')
        .select(`
          *,
          team:teams(name, logo_url)
        `)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false })

      if (error) {
        if (!silent) {
          console.error('❌ Erro ao carregar lances:', error)
        }
        return
      }

      if (!silent) {
        console.log(`✅ ${bidsData?.length || 0} lances carregados para leilão ${auctionId}`)
      }
      
      setBids(prev => ({
        ...prev,
        [auctionId]: bidsData || []
      }))
    } catch (error) {
      if (!silent) {
        console.error('❌ Erro inesperado ao carregar lances:', error)
      }
    }
  }

  // FUNÇÃO PARA CALCULAR TEMPO RESTANTE (APENAS PARA EXIBIÇÃO)
  const calculateTimeRemaining = useCallback((auction: Auction) => {
    if (auction.status !== 'active' || !auction.end_time) {
      return 0
    }
    const endTime = new Date(auction.end_time).getTime()
    return Math.max(0, endTime - currentTime)
  }, [currentTime])

  // CORREÇÃO: Função startPendingAuction respeitando a duração original
  const startPendingAuction = async (auctionId: string) => {
    try {
      console.log(`🎬 Iniciando leilão pendente: ${auctionId}`)
      
      // Buscar dados do leilão para obter a duração original
      const { data: auctionData, error: fetchError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar dados do leilão:', fetchError)
        return
      }

      // Calcular duração baseada no start_time e end_time originais
      let durationMinutes = 5 // fallback
      if (auctionData.start_time && auctionData.end_time) {
        const startTime = new Date(auctionData.start_time).getTime()
        const endTime = new Date(auctionData.end_time).getTime()
        durationMinutes = Math.round((endTime - startTime) / 60000)
      }

      console.log(`⏰ Duração calculada do leilão: ${durationMinutes} minutos`)

      const { error } = await supabase
        .from('auctions')
        .update({ 
          status: 'active',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + durationMinutes * 60000).toISOString()
        })
        .eq('id', auctionId)

      if (error) throw error

      await loadAuctions()
      console.log('✅ Leilão iniciado com sucesso')

    } catch (error) {
      console.error('❌ Erro ao iniciar leilão:', error)
    }
  }

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // CORREÇÃO: Função de formatação para criação de leilão (permite qualquer valor)
  const formatCurrencyCreate = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '')
    if (onlyNumbers === '') return ''
    
    const number = parseInt(onlyNumbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // CORREÇÃO: Função de formatação para lances (apenas formata, não arredonda)
  const formatCurrencyBid = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '')
    if (onlyNumbers === '') return ''
    
    const number = parseInt(onlyNumbers) / 100
    
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // NOVA FUNÇÃO: Obter data mínima para o date picker (hoje)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // CRIAÇÃO DE LEILÃO ATUALIZADA COM DATA E HORA
  const handleCreateAuction = async () => {
    if (!selectedPlayer || !startPrice || !startDate || !startTime) {
      alert('Preencha todos os campos')
      return
    }

    const price = parseFloat(startPrice.replace(/\./g, '').replace(',', '.'))
    if (isNaN(price) || price <= 0) {
      alert('Valor inicial inválido')
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

      // Verificar se a data/hora é futura
      if (startDateTime <= new Date()) {
        alert('A data e hora de início devem ser futuras')
        setCreatingAuction(false)
        return
      }

      const durationMinutes = parseInt(auctionDuration)
      const endTime = new Date(startDateTime.getTime() + durationMinutes * 60000)

      // Criar leilão COM DURAÇÃO SALVA
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
          auction_duration: durationMinutes // CORREÇÃO: Salvar a duração
        }])

      if (error) throw error

      console.log('✅ Leilão criado no banco')

      setCreateAuctionModalOpen(false)
      resetCreateAuctionForm()
      
      await loadAuctions()
      await loadFreePlayers()
      
      setActiveTab('pending')

      alert('✅ Leilão agendado com sucesso!')

    } catch (error: any) {
      console.error('❌ Erro ao criar leilão:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setCreatingAuction(false)
    }
  }

  // CORREÇÃO: Função handleStartAuction respeitando a duração salva
  const handleStartAuction = async (auctionId: string) => {
    try {
      // Buscar dados do leilão para obter a duração salva
      const { data: auctionData, error: fetchError } = await supabase
        .from('auctions')
        .select('auction_duration, start_time, end_time')
        .eq('id', auctionId)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar dados do leilão:', fetchError)
        return
      }

      // Determinar a duração correta
      let durationMinutes = 5 // fallback padrão
      
      // Prioridade 1: Usar auction_duration se existir
      if (auctionData.auction_duration) {
        durationMinutes = auctionData.auction_duration
        console.log(`⏰ Usando duração salva: ${durationMinutes} minutos`)
      } 
      // Prioridade 2: Calcular a partir de start_time e end_time
      else if (auctionData.start_time && auctionData.end_time) {
        const startTime = new Date(auctionData.start_time).getTime()
        const endTime = new Date(auctionData.end_time).getTime()
        durationMinutes = Math.round((endTime - startTime) / 60000)
        console.log(`⏰ Calculando duração: ${durationMinutes} minutos`)
      }

      console.log(`🎬 Iniciando leilão ${auctionId} com ${durationMinutes} minutos`)

      const { error } = await supabase
        .from('auctions')
        .update({ 
          status: 'active',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + durationMinutes * 60000).toISOString()
        })
        .eq('id', auctionId)

      if (error) throw error

      alert('🎉 Leilão iniciado!')
      await loadAuctions()
      setActiveTab('active')

    } catch (error: any) {
      console.error('❌ Erro ao iniciar leilão:', error)
      alert(`Erro: ${error.message}`)
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

      alert('✅ Leilão cancelado!')
      await loadAuctions()
      await loadFreePlayers()

    } catch (error: any) {
      console.error('❌ Erro ao cancelar leilão:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  // CORREÇÃO DEFINITIVA: Função completamente revisada para dar lance
  const handlePlaceBid = async (auctionId: string) => {
    console.log(`💰 INICIANDO LANCE - Leilão: ${auctionId}`)
    
    if (!team || !team.id) {
      alert('❌ Você precisa ter um time para dar lances.')
      return
    }

    console.log('🏆 Time do usuário:', { id: team.id, name: team.name })

    let amount: number
    try {
      const cleanValue = bidAmount.replace(/\./g, '').replace(',', '.')
      amount = parseFloat(cleanValue)
      console.log('💰 Valor do lance convertido:', amount)
    } catch (error) {
      alert('Valor do lance inválido')
      return
    }

    if (isNaN(amount) || amount <= 0) {
      alert('Valor do lance inválido')
      return
    }

    // BUSCAR DADOS ATUALIZADOS DO LEILÃO DIRETO DO BANCO
    const { data: currentAuction, error: fetchError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single()

    if (fetchError || !currentAuction) {
      console.error('❌ Erro ao buscar leilão atualizado:', fetchError)
      alert('Erro ao carregar dados do leilão')
      return
    }

    console.log('📊 DADOS ATUAIS DO LEILÃO (do banco):', {
      leilao_id: currentAuction.id,
      current_bid: currentAuction.current_bid,
      current_bidder: currentAuction.current_bidder,
      team_atual: team.id
    })

    // VALIDAÇÕES COM DADOS ATUAIS
    
    // 1. Lance deve ser maior que o atual
    if (amount <= currentAuction.current_bid) {
      alert(`❌ O lance deve ser maior que o atual: R$ ${currentAuction.current_bid.toLocaleString('pt-BR')}`)
      return
    }

    // 2. CORREÇÃO: Diferença mínima de 1 milhão
    const diferencaMinima = 1000000
    const diferencaAtual = amount - currentAuction.current_bid
    
    if (diferencaAtual < diferencaMinima) {
      alert(`❌ O lance deve ser pelo menos R$ 1.000.000,00 maior que o atual\n\nLance atual: R$ ${currentAuction.current_bid.toLocaleString('pt-BR')}\nSeu lance: R$ ${amount.toLocaleString('pt-BR')}\nDiferença: R$ ${diferencaAtual.toLocaleString('pt-BR')}\n\nVocê precisa dar um lance de pelo menos: R$ ${(currentAuction.current_bid + diferencaMinima).toLocaleString('pt-BR')}`)
      return
    }

    // 3. Validação de saldo (agora considerando saldo temporário)
    const saldoDisponivel = getSaldoDisponivel()
    if (amount > saldoDisponivel) {
      alert(`❌ Saldo insuficiente para este lance.\n\nSeu saldo: R$ ${team.balance.toLocaleString('pt-BR')}\nSaldo reservado em outros lances: R$ ${getSaldoReservado().toLocaleString('pt-BR')}\nSaldo disponível: R$ ${saldoDisponivel.toLocaleString('pt-BR')}`)
      return
    }

    setBidding(true)

    try {
      // 1. CALCULAR NOVO TEMPO SE NECESSÁRIO
      let newEndTime = currentAuction.end_time
      if (currentAuction.end_time) {
        const currentEndTime = new Date(currentAuction.end_time).getTime()
        const timeRemaining = currentEndTime - Date.now()
        console.log('⏰ Tempo restante atual:', timeRemaining)
        
        if (timeRemaining <= 30000) {
          newEndTime = new Date(Date.now() + 60000).toISOString()
          console.log('⏰ Adicionando 1 minuto. Novo fim:', newEndTime)
        }
      }

      // 2. ATUALIZAR LEILÃO - TRANSAÇÃO CRÍTICA
      console.log('🔄 ATUALIZANDO LEILÃO NO BANCO:', {
        current_bid: amount,
        current_bidder: team.id,
        end_time: newEndTime
      })

      const { data: updatedAuction, error: auctionError } = await supabase
        .from('auctions')
        .update({
          current_bid: amount,
          current_bidder: team.id,
          end_time: newEndTime
        })
        .eq('id', auctionId)
        .select()

      if (auctionError) {
        console.error('❌ ERRO CRÍTICO ao atualizar leilão:', auctionError)
        throw new Error(`Falha ao atualizar leilão: ${auctionError.message}`)
      }

      console.log('✅ LEILÃO ATUALIZADO NO BANCO:', updatedAuction?.[0])

      // 3. REGISTRAR LANCE NA TABELA BIDS
      const { error: bidError } = await supabase
        .from('bids')
        .insert([{
          auction_id: auctionId,
          team_id: team.id,
          amount: amount
        }])

      if (bidError) {
        console.error('❌ Erro ao registrar lance:', bidError)
        
        // REVERTER a atualização do leilão se o lance falhar
        await supabase
          .from('auctions')
          .update({
            current_bid: currentAuction.current_bid,
            current_bidder: currentAuction.current_bidder,
            end_time: currentAuction.end_time
          })
          .eq('id', auctionId)
        
        throw new Error(`Falha ao registrar lance: ${bidError.message}`)
      }

      console.log('✅ LANCE REGISTRADO na tabela bids')

      // 4. CORREÇÃO: Reservar saldo temporariamente (PERSISTENTE E ESPECÍFICO POR TIME)
      reservarSaldo(auctionId, amount)

      // 5. VERIFICAÇÃO FINAL - BUSCAR DADOS ATUALIZADOS PARA CONFIRMAR
      const { data: finalVerification, error: verifyError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single()

      if (!verifyError && finalVerification) {
        console.log('🔍 VERIFICAÇÃO FINAL - Leilão após todas as operações:', {
          id: finalVerification.id,
          current_bid: finalVerification.current_bid,
          current_bidder: finalVerification.current_bidder,
          current_bidder_correto: finalVerification.current_bidder === team.id,
          team_esperado: team.id,
          team_atual: finalVerification.current_bidder
        })

        if (finalVerification.current_bidder !== team.id) {
          console.error('🚨 ERRO GRAVE: current_bidder não foi atualizado corretamente!')
          throw new Error('Falha crítica: current_bidder não foi atualizado')
        }
      }

      // 6. ATUALIZAR INTERFACE
      setBidAmount('')
      setBiddingAuctionId(null)
      
      // 7. RECARREGAR DADOS COMPLETAMENTE
      await loadAuctions()
      await loadBids(auctionId)

      console.log('🎉 LANCE CONCLUÍDO COM SUCESSO!')
      alert('✅ Lance realizado com sucesso! O valor foi reservado do seu saldo.')

    } catch (error: any) {
      console.error('❌ ERRO NO PROCESSO DE LANCE:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setBidding(false)
    }
  }

  // CORREÇÃO: Função finishAuction usando RPC segura com transação completa
  const finishAuction = async (auctionId: string) => {
    try {
      console.log(`🏁 Iniciando finalização do leilão ${auctionId}`)
      
      // Buscar dados atualizados do leilão
      const { data: auctionData, error: fetchError } = await supabase
        .from('auctions')
        .select(`
          *,
          player:players(*),
          current_bidder_team:teams!auctions_current_bidder_fkey(*)
        `)
        .eq('id', auctionId)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar leilão:', fetchError)
        return
      }

      const auction = auctionData
      if (!auction || auction.status !== 'active') {
        console.log('ℹ️ Leilão já finalizado ou não encontrado')
        return
      }

      console.log('📊 Dados do leilão para finalização:', {
        id: auction.id,
        current_bid: auction.current_bid,
        start_price: auction.start_price,
        current_bidder: auction.current_bidder,
        player: auction.player?.name
      })

      // Atualizar status do leilão para FINISHED
      const { error: auctionError } = await supabase
        .from('auctions')
        .update({ status: 'finished' })
        .eq('id', auctionId)

      if (auctionError) {
        console.error('❌ Erro ao atualizar status do leilão:', auctionError)
        throw auctionError
      }

      console.log('✅ Status do leilão atualizado para FINISHED')

      // CORREÇÃO CRÍTICA: Processar vencedor e saldo COM RPC SEGURA
      if (auction.current_bidder && auction.current_bid > auction.start_price) {
        console.log(`💰 Processando transferência para ${auction.current_bidder}`)
        
        // 1. Transferir jogador para o time vencedor
        const { error: playerError } = await supabase
          .from('players')
          .update({ team_id: auction.current_bidder })
          .eq('id', auction.player_id)

        if (playerError) {
          console.error('❌ Erro ao transferir jogador:', playerError)
          throw playerError
        }
        console.log('✅ Jogador transferido para o time vencedor')

        // 2. CORREÇÃO: Usar RPC segura para debitar saldo
        console.log(`💰 Debitando saldo do time vencedor via RPC: ${auction.current_bidder}`)
        
        const { data: debitResult, error: debitError } = await supabase
          .rpc('debitar_saldo_leilao', {
            p_team_id: auction.current_bidder,
            p_amount: auction.current_bid
          })

        if (debitError) {
          console.error('❌ Erro ao debitar saldo via RPC:', debitError)
          throw new Error(`Falha ao debitar saldo: ${debitError.message}`)
        }

        if (!debitResult.success) {
          console.error('❌ Falha na operação de débito:', debitResult.error)
          throw new Error(debitResult.error || 'Falha ao debitar saldo')
        }

        console.log('✅ Saldo debitado com sucesso via RPC. Novo saldo:', debitResult.new_balance)

        // 3. CORREÇÃO: Registrar transação com mais detalhes
        try {
          const { error: transactionError } = await supabase
            .from('balance_transactions')
            .insert([{
              team_id: auction.current_bidder,
              amount: auction.current_bid,
              type: 'debit',
              description: `Compra do jogador ${auction.player?.name} no leilão`,
              player_name: auction.player?.name,
              transfer_type: 'buy',
              created_at: new Date().toISOString()
            }])

          if (transactionError) {
            console.warn('⚠️ Aviso ao registrar transação:', transactionError)
          } else {
            console.log('✅ Transação registrada com detalhes completos')
          }
        } catch (transactionError) {
          console.warn('⚠️ Aviso ao tentar registrar transação:', transactionError)
        }

        console.log(`🎉 Leilão finalizado! Vencedor: ${auction.current_bidder_team?.name}`)

      } else {
        console.log('🔄 Leilão finalizado sem lances válidos - jogador permanece livre')
      }

      // CORREÇÃO CRÍTICA: Liberar saldo reservado APENAS se o usuário atual tinha saldo reservado
      if (team && saldoReservado[auctionId]) {
        console.log(`🔄 Liberando saldo reservado do leilão finalizado ${auctionId} para time ${team.id}`)
        liberarSaldo(auctionId)
      }

      // Recarregar dados
      await loadAuctions()
      await loadInitialData()
      
      console.log(`✅ Leilão ${auctionId} finalizado com sucesso!`)

    } catch (error: any) {
      console.error('💥 Erro ao finalizar leilão:', error)
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
    // CORREÇÃO: Usar formatação livre para criação de leilão
    const formattedValue = formatCurrencyCreate(e.target.value)
    setStartPrice(formattedValue)
  }

  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // CORREÇÃO: Usar formatação sem arredondamento para lances
    const formattedValue = formatCurrencyBid(e.target.value)
    setBidAmount(formattedValue)
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

  // FUNÇÃO SIMPLES PARA FILTRAR LEILÕES
  const getAuctionsByTab = () => {
    const filtered = auctions.filter(auction => {
      switch (activeTab) {
        case 'active': return auction.status === 'active'
        case 'pending': return auction.status === 'pending'
        case 'finished': return auction.status === 'finished'
        default: return false
      }
    })
    
    return filtered
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
            bids={bids[auction.id]}
            isAdmin={isAdmin}
            team={team}
            biddingAuctionId={biddingAuctionId}
            setBiddingAuctionId={setBiddingAuctionId}
            bidAmount={bidAmount}
            setBidAmount={setBidAmount}
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
        <p className="text-2xl text-white animate-pulse">Carregando leilão...</p>
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
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div>
                <h1 className="text-5xl font-black text-white mb-2">LEILÃO DE JOGADORES</h1>
                <p className="text-zinc-400 text-lg">
                  Adquira os melhores jogadores livres no mercado
                </p>
              </div>

              {/* CORREÇÃO: Exibir informações do time com saldo reservado PERSISTENTE E ESPECÍFICO */}
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
                    <p className="text-green-400">
                      Saldo: R$ {team.balance.toLocaleString('pt-BR')}
                    </p>
                    {getSaldoReservado() > 0 && (
                      <div className="text-sm">
                        <p className="text-yellow-400">
                          Disponível: R$ {getSaldoDisponivel().toLocaleString('pt-BR')}
                        </p>
                        <p className="text-zinc-400">
                          Reserva: R$ {getSaldoReservado().toLocaleString('pt-BR')}
                        </p>
                      </div>
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

                      {/* NOVO: Campo para selecionar a data */}
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

                      {/* ATUALIZADO: Opções de duração com novos tempos */}
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

// COMPONENTE AUCTIONCARD CORRIGIDO
const AuctionCard = ({ 
  auction, 
  type, 
  onBid, 
  onStartAuction, 
  onCancelAuction, 
  bids, 
  isAdmin, 
  team,
  biddingAuctionId,
  setBiddingAuctionId,
  bidAmount,
  setBidAmount,
  bidding,
  calculateTimeRemaining,
  formatTimeRemaining,
  saldoReservado
}: any) => {

  // CORREÇÃO: Função de formatação para lances (apenas formata, não arredonda)
  const formatCurrencyDisplay = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '')
    if (onlyNumbers === '') return ''
    
    const number = parseInt(onlyNumbers) / 100
    
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // CORREÇÃO: Permitir que o usuário digite qualquer valor
    const formattedValue = formatCurrencyDisplay(e.target.value)
    setBidAmount(formattedValue)
  }

  const handlePlaceBid = async () => {
    await onBid(auction.id)
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

  // Calcular tempo restante em tempo real
  const timeRemaining = calculateTimeRemaining(auction)

  // CORREÇÃO CRÍTICA: Lógica melhorada para mostrar o líder
  const shouldShowLeader = auction.current_bidder !== null

  // CORREÇÃO: Verificar se o usuário atual é o líder atual
  const isCurrentUserLeader = team && auction.current_bidder === team.id

  // CORREÇÃO: Verificar se tem saldo reservado neste leilão
  const temSaldoReservado = saldoReservado && saldoReservado[auction.id]

  return (
    <Card className={cn("p-6 relative", getCardStyles())}>
      {/* CORREÇÃO: Badge de saldo reservado no canto superior direito */}
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
              {/* CONTAGEM REGRESSIVA EM TEMPO REAL */}
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
              R$ {auction.start_price.toLocaleString('pt-BR')}
            </span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
              <span className="text-zinc-400">
                {type === 'active' ? 'Lance Atual' : 'Valor Atual'}
              </span>
              <span className="text-2xl font-bold text-white">
                R$ {auction.current_bid.toLocaleString('pt-BR')}
              </span>
            </div>
            
            {/* CORREÇÃO CRÍTICA: Mostrar líder sempre que houver current_bidder */}
            {shouldShowLeader && (
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

        {/* CORREÇÃO: Permitir lances para usuários comuns com time */}
        {type === 'active' && timeRemaining > 0 && (
          biddingAuctionId === auction.id ? (
            <div className="space-y-3">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <Input
                  placeholder="0,00"
                  value={bidAmount}
                  onChange={handleBidAmountChange}
                  className="pl-10 bg-zinc-800/50 border-zinc-600 text-white"
                />
              </div>
              <div className="text-sm text-yellow-400 text-center">
                💰 Lance mínimo: R$ {(auction.current_bid + 1000000).toLocaleString('pt-BR')}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBiddingAuctionId(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  disabled={bidding}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {bidding ? 'Dando lance...' : 'Dar Lance'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setBiddingAuctionId(auction.id)}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!team}
            >
              <DollarSign className="w-4 h-4 mr-2" />
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
                    R$ {bid.amount.toLocaleString('pt-BR')}
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