// src/app/dashboard/transferencias/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  CheckCircle2, Clock, CheckCircle, DollarSign, ArrowRight, 
  Calendar, Users, ArrowRightLeft, X, Ban, Tag, ShoppingCart, 
  Plus, Trash2, Edit, Save, XCircle, Info 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

// Função de formatação de moeda
function formatCurrencyInput(value: string): string {
  const onlyNumbers = value.replace(/\D/g, '')
  if (onlyNumbers === '') return ''
  
  const number = parseInt(onlyNumbers) / 100
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function parseCurrencyToNumber(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
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

interface MarketPlayer {
  id: string
  player_id: string
  player_name: string
  team_id: string
  team_name: string
  team_logo: string | null
  price: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Player details
  player?: {
    id: string
    name: string
    position: string
    overall: number
    photo_url: string | null
    base_price: number
  }
}

interface Player {
  id: string
  name: string
  position: string
  overall: number
  photo_url: string | null
  base_price: number
  team_id: string | null
}

export default function PaginaTransferencias() {
  // Switch principal entre Transferências e Mercado
  const [activeView, setActiveView] = useState<'transferencias' | 'mercado'>('transferencias')
  
  // Estados para Transferências (mantidos da versão anterior)
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

  // Estados para o Mercado
  const [marketPlayers, setMarketPlayers] = useState<MarketPlayer[]>([])
  const [myMarketPlayers, setMyMarketPlayers] = useState<MarketPlayer[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [marketTab, setMarketTab] = useState<'disponiveis' | 'meus'>('disponiveis')
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [marketPrice, setMarketPrice] = useState('')
  const [marketDescription, setMarketDescription] = useState('')
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [editDescriptionText, setEditDescriptionText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Refs para evitar perda de foco
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)

  // Carregar dados do usuário e time
  useEffect(() => {
    loadUserData()
    
    // Subscribe para atualizações em tempo real
    const subscription = supabase
      .channel('transferencias')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'player_transfers' },
        () => {
          if (activeView === 'transferencias') {
            loadData()
          }
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'market_listings' },
        () => {
          if (activeView === 'mercado') {
            loadMarketData()
            loadMyPlayers()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, activeView])

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

  // Carregar dados do usuário
  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setUser(session.user)

    // Pega perfil do usuário (team_id e se é admin)
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

    // Carregar dados baseado na view atual
    if (activeView === 'transferencias') {
      loadData()
    } else {
      loadMarketData()
      loadMyPlayers()
    }
  }

  // Funções para Transferências
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
    setLoading(true)

    // Carrega TODAS as negociações (excluindo as rejeitadas)
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
    
    // Filtra baseado na aba ativa (excluindo rejeitadas)
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

  // Rejeitar transferência (APENAS ADMIN)
  const rejeitarTransferencia = async (transferId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta transferência? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('player_transfers')
        .update({ 
          status: 'rejected',
          approved_by_seller: false,
          approved_by_buyer: false,
          approved_by_admin: false
        })
        .eq('id', transferId)

      if (error) {
        alert('Erro ao cancelar transferência: ' + error.message)
        return
      }

      // Remove a transferência da lista local imediatamente
      setTransfers(prev => prev.filter(t => t.id !== transferId))
      setAllTransfers(prev => prev.filter(t => t.id !== transferId))
      
      alert('✅ Transferência cancelada com sucesso!')
    } catch (error) {
      alert('Erro inesperado ao cancelar transferência')
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

  // Funções para o Mercado
  const loadMarketData = async () => {
    if (!team?.id) return
    
    setLoadingMarket(true)
    try {
      // Carregar jogadores disponíveis no mercado (de outros times)
      const { data } = await supabase
        .from('market_listings')
        .select(`
          *,
          player:players (
            id,
            name,
            position,
            overall,
            photo_url,
            base_price
          ),
          team:teams!team_id (
            id,
            name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .neq('team_id', team.id)
        .order('created_at', { ascending: false })

      const formattedData = (data || []).map(item => ({
        ...item,
        team_name: item.team?.name || 'Time desconhecido',
        team_logo: item.team?.logo_url || null
      }))

      setMarketPlayers(formattedData)
    } catch (error) {
      console.error('Erro ao carregar mercado:', error)
    } finally {
      setLoadingMarket(false)
    }
  }

  const loadMyPlayers = async () => {
    if (!team?.id) return
    
    try {
      // Carregar jogadores do meu time (para adicionar ao mercado)
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', team.id)
        .order('overall', { ascending: false })

      setAvailablePlayers(playersData || [])

      // Carregar meus jogadores no mercado
      const { data: marketData } = await supabase
        .from('market_listings')
        .select(`
          *,
          player:players (
            id,
            name,
            position,
            overall,
            photo_url,
            base_price
          )
        `)
        .eq('team_id', team.id)
        .order('created_at', { ascending: false })

      setMyMarketPlayers(marketData || [])
    } catch (error) {
      console.error('Erro ao carregar meus jogadores:', error)
    }
  }

  const handleAddToMarket = async () => {
    if (!selectedPlayer || !team?.id || !marketPrice) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const price = parseCurrencyToNumber(marketPrice)
    if (isNaN(price) || price <= 0) {
      alert('Preço inválido')
      return
    }

    if (price < selectedPlayer.base_price) {
      alert(`O preço não pode ser menor que o valor base do jogador (R$ ${selectedPlayer.base_price.toLocaleString('pt-BR')})`)
      return
    }

    setAddingPlayer(true)
    try {
      const { error } = await supabase
        .from('market_listings')
        .insert([{
          player_id: selectedPlayer.id,
          player_name: selectedPlayer.name,
          team_id: team.id,
          price: price,
          description: marketDescription.trim() || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      // Limpar formulário e recarregar dados
      setSelectedPlayer(null)
      setMarketPrice('')
      setMarketDescription('')
      setShowAddForm(false)
      
      alert('✅ Jogador anunciado no mercado com sucesso!')
      loadMarketData()
      loadMyPlayers()
    } catch (error: any) {
      console.error('Erro ao anunciar jogador:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleRemoveFromMarket = async (listingId: string) => {
    if (!confirm('Tem certeza que deseja remover este jogador do mercado?')) return

    try {
      const { error } = await supabase
        .from('market_listings')
        .update({ is_active: false })
        .eq('id', listingId)

      if (error) throw error

      alert('✅ Jogador removido do mercado com sucesso!')
      loadMarketData()
      loadMyPlayers()
    } catch (error: any) {
      console.error('Erro ao remover jogador:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleUpdateDescription = async (listingId: string) => {
    if (!editDescriptionText.trim()) {
      alert('A descrição não pode estar vazia')
      return
    }

    try {
      const { error } = await supabase
        .from('market_listings')
        .update({ 
          description: editDescriptionText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)

      if (error) throw error

      setEditingDescription(null)
      setEditDescriptionText('')
      alert('✅ Descrição atualizada com sucesso!')
      loadMarketData()
      loadMyPlayers()
    } catch (error: any) {
      console.error('Erro ao atualizar descrição:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleStartEditDescription = (listing: MarketPlayer) => {
    setEditingDescription(listing.id)
    setEditDescriptionText(listing.description || '')
    
    // Foco no textarea após um pequeno delay para garantir renderização
    setTimeout(() => {
      const textarea = document.getElementById(`edit-desc-${listing.id}`) as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      }
    }, 10)
  }

  const handleCancelEdit = () => {
    setEditingDescription(null)
    setEditDescriptionText('')
  }

  const handleBuyPlayer = async (listing: MarketPlayer) => {
    if (!team?.id) {
      alert('Você precisa ter um time para comprar jogadores')
      return
    }

    if (team.id === listing.team_id) {
      alert('Você não pode comprar jogadores do seu próprio time')
      return
    }

    if (!confirm(`Deseja comprar ${listing.player_name} por R$ ${listing.price.toLocaleString('pt-BR')}?`)) {
      return
    }

    try {
      // Verificar saldo do time
      const { data: buyerTeam, error: balanceError } = await supabase
        .from('teams')
        .select('balance, name')
        .eq('id', team.id)
        .single()

      if (balanceError) throw balanceError

      if (buyerTeam.balance < listing.price) {
        alert(`❌ Saldo insuficiente! Seu time precisa de R$ ${listing.price.toLocaleString('pt-BR')} e tem apenas R$ ${buyerTeam.balance.toLocaleString('pt-BR')}`)
        return
      }

      // Criar transferência
      const { error: transferError } = await supabase
        .from('player_transfers')
        .insert([{
          player_id: listing.player_id,
          player_name: listing.player_name,
          from_team_id: listing.team_id,
          to_team_id: team.id,
          value: listing.price,
          status: 'pending',
          approved_by_seller: false,
          approved_by_buyer: true, // Comprador já está aprovando
          approved_by_admin: false,
          created_at: new Date().toISOString(),
          transfer_type: 'sell',
          is_exchange: false,
          exchange_players: [],
          exchange_value: 0
        }])

      if (transferError) throw transferError

      // Remover do mercado
      await supabase
        .from('market_listings')
        .update({ is_active: false })
        .eq('id', listing.id)

      alert('✅ Proposta de compra enviada! Aguarde a aprovação do vendedor.')
      
      // Recarregar dados
      loadMarketData()
      loadMyPlayers()
      
      // Alternar para a view de transferências para ver a proposta
      setActiveView('transferencias')
    } catch (error: any) {
      console.error('Erro ao comprar jogador:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  // Componente para exibir jogador do mercado
  const MarketPlayerCard = ({ listing, isMine = false }: { listing: MarketPlayer, isMine?: boolean }) => {
    const player = listing.player || {
      id: listing.player_id,
      name: listing.player_name,
      position: 'N/A',
      overall: 0,
      photo_url: null,
      base_price: 0
    }

    return (
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all p-4">
        {/* Header com time */}
        <div className="flex items-center gap-2 mb-3">
          {listing.team_logo ? (
            <img 
              src={listing.team_logo} 
              alt={listing.team_name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{listing.team_name.substring(0, 2)}</span>
            </div>
          )}
          <span className="text-sm text-zinc-300">{listing.team_name}</span>
        </div>

        {/* Player info */}
        <div className="flex items-center gap-3 mb-3">
          {player.photo_url ? (
            <img 
              src={player.photo_url} 
              alt={player.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-purple-500"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
              <span className="text-lg font-black text-white">{player.position}</span>
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg text-white">{player.name}</h3>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600">{player.position}</Badge>
              <Badge className="bg-yellow-600">OVR {player.overall}</Badge>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <p className="text-zinc-400 text-sm">Preço no Mercado</p>
          <p className="text-emerald-400 font-bold text-xl">
            R$ {listing.price.toLocaleString('pt-BR')}
          </p>
          <p className="text-zinc-500 text-xs">
            Valor base: R$ {player.base_price.toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="mb-3">
            <p className="text-zinc-400 text-sm flex items-center gap-1 mb-1">
              <Info className="w-3 h-3" />
              Descrição do vendedor
            </p>
            <p className="text-zinc-300 text-sm bg-zinc-800/30 rounded-lg p-2">
              {listing.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isMine ? (
            <>
              <Button
                onClick={() => handleStartEditDescription(listing)}
                variant="outline"
                size="sm"
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                onClick={() => handleRemoveFromMarket(listing.id)}
                variant="outline"
                size="sm"
                className="flex-1 bg-red-600/20 border-red-600 hover:bg-red-600/30 text-white"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remover
              </Button>
            </>
          ) : (
            <Button
              onClick={() => handleBuyPlayer(listing)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Fazer Proposta
            </Button>
          )}
        </div>

        {/* Formulário de edição de descrição */}
        {isMine && editingDescription === listing.id && (
          <EditDescriptionForm listing={listing} />
        )}
      </Card>
    )
  }

  // Componente para editar descrição - CORRIGIDO
  const EditDescriptionForm = ({ listing }: { listing: MarketPlayer }) => {
    return (
      <div className="mt-3 space-y-2">
        <Textarea
          id={`edit-desc-${listing.id}`}
          value={editDescriptionText}
          onChange={(e) => {
            setEditDescriptionText(e.target.value)
          }}
          onKeyDown={(e) => {
            // Permite submeter com Ctrl+Enter
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault()
              handleUpdateDescription(listing.id)
            }
            // Cancela com Escape
            if (e.key === 'Escape') {
              handleCancelEdit()
            }
          }}
          placeholder="Digite a descrição para este jogador..."
          className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            onClick={() => handleUpdateDescription(listing.id)}
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            Salvar
          </Button>
          <Button
            onClick={handleCancelEdit}
            variant="outline"
            size="sm"
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        </div>
        <p className="text-xs text-zinc-400">
          Dica: Use <kbd className="px-1 bg-zinc-700 rounded">Ctrl+Enter</kbd> para salvar
        </p>
      </div>
    )
  }

  // Switch entre Transferências e Mercado
  const ViewSwitch = () => (
    <div className="flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700 w-fit mx-auto mb-6">
      <Button
        variant={activeView === 'transferencias' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('transferencias')}
        className={cn(
          'rounded-lg text-sm font-bold px-6 py-2 transition-all',
          activeView === 'transferencias' && 'bg-purple-600 shadow-lg shadow-purple-600/20 text-white'
        )}
      >
        <ArrowRightLeft className="w-4 h-4 mr-2" />
        Transferências
      </Button>
      <Button
        variant={activeView === 'mercado' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('mercado')}
        className={cn(
          'rounded-lg text-sm font-bold px-6 py-2 transition-all',
          activeView === 'mercado' && 'bg-green-600 shadow-lg shadow-green-600/20 text-white'
        )}
      >
        <Tag className="w-4 h-4 mr-2" />
        Mercado
      </Button>
    </div>
  )

  // Componente principal de Transferências (mantido da versão anterior)
  const TransferenciasView = () => (
    <>
      {/* Seletor de Abas */}
      <div className="flex gap-4 mb-8 justify-center md:justify-start">
        <Button
          onClick={() => setActiveTab('pending')}
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          className={cn(
            "flex items-center gap-2 text-white",
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
            "flex items-center gap-2 text-white",
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

                    {/* Botões de aprovação E cancelamento (APENAS ADMIN PODE CANCELAR) */}
                    {(userTeamId === t.from_team_id || userTeamId === t.to_team_id || isAdmin) && (
                      <div className="mt-6 flex flex-wrap gap-4 justify-center items-center">
                        <div className="flex flex-wrap gap-4">
                          {userTeamId === t.from_team_id && !t.approved_by_seller && (
                            <Button
                              onClick={() => aprovar(t.id, 'seller')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Aprovar como Vendedor
                            </Button>
                          )}
                          {userTeamId === t.to_team_id && !t.approved_by_buyer && (
                            <Button
                              onClick={() => aprovar(t.id, 'buyer')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Aprovar como Comprador
                            </Button>
                          )}
                          {isAdmin && !t.approved_by_admin && (
                            <Button
                              onClick={() => aprovar(t.id, 'admin')}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Aprovar como Admin
                            </Button>
                          )}
                        </div>

                        {/* BOTÃO DE CANCELAR - APENAS PARA ADMIN */}
                        {isAdmin && (
                          <Button
                            onClick={() => rejeitarTransferencia(t.id)}
                            variant="outline"
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Cancelar Transferência
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
    </>
  )

  // Componente principal do Mercado
  const MercadoView = () => (
    <>
      {/* Tabs do Mercado */}
      <div className="flex gap-4 mb-6 justify-center md:justify-start">
        <Button
          onClick={() => setMarketTab('disponiveis')}
          variant={marketTab === 'disponiveis' ? 'default' : 'outline'}
          className={cn(
            "flex items-center gap-2 text-white",
            marketTab === 'disponiveis' ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-800/50 border-zinc-600"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Disponíveis
          <Badge variant="secondary" className="ml-2 bg-zinc-700">
            {marketPlayers.length}
          </Badge>
        </Button>
        
        <Button
          onClick={() => setMarketTab('meus')}
          variant={marketTab === 'meus' ? 'default' : 'outline'}
          className={cn(
            "flex items-center gap-2 text-white",
            marketTab === 'meus' ? "bg-green-600 hover:bg-green-700" : "bg-zinc-800/50 border-zinc-600"
          )}
        >
          <Users className="w-4 h-4" />
          Meus Jogadores
          <Badge variant="secondary" className="ml-2 bg-zinc-700">
            {myMarketPlayers.length}
          </Badge>
        </Button>
      </div>

      {marketTab === 'meus' && (
        <Card className="p-6 mb-6 bg-white/5 border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Anunciar Jogador</h3>
              <p className="text-zinc-400">Coloque jogadores do seu time disponíveis para negociação</p>
            </div>
            {!showAddForm && (
              <Button
                onClick={() => {
                  setShowAddForm(true)
                  // Resetar seleção quando abrir o formulário
                  setSelectedPlayer(null)
                  setMarketPrice('')
                  setMarketDescription('')
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Jogador
              </Button>
            )}
          </div>

          {showAddForm && (
            <div className="space-y-4 p-4 bg-zinc-800/30 rounded-lg">
              {/* Selecionar jogador */}
              <div>
                <label className="text-zinc-400 text-sm font-medium mb-2 block">
                  Selecione um jogador do seu time
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {availablePlayers.map(player => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        selectedPlayer?.id === player.id
                          ? "bg-blue-500/20 border-blue-500/50"
                          : "bg-zinc-800/30 border-zinc-600 hover:border-zinc-500"
                      )}
                      onClick={() => {
                        setSelectedPlayer(player)
                        // Focar no campo de preço quando selecionar jogador
                        setTimeout(() => {
                          const priceInput = document.getElementById('market-price-input')
                          if (priceInput) priceInput.focus()
                        }, 10)
                      }}
                    >
                      {player.photo_url ? (
                        <img 
                          src={player.photo_url} 
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-cyan-700 flex items-center justify-center">
                          <span className="text-sm font-black text-white">{player.position}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-white">{player.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge className="bg-blue-600">{player.position}</Badge>
                          <span className="text-zinc-400">OVR {player.overall}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">
                          R$ {player.base_price.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlayer && (
                <>
                  {/* Preço - CORRIGIDO */}
                  <div>
                    <label className="text-zinc-400 text-sm font-medium mb-2 block">
                      Preço de Venda
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                      <Input
                        id="market-price-input"
                        placeholder="0,00"
                        value={marketPrice}
                        onChange={(e) => {
                          const formattedValue = formatCurrencyInput(e.target.value)
                          setMarketPrice(formattedValue)
                        }}
                        className="pl-10 bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyDown={(e) => {
                          // Navegação com teclado
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const descInput = document.getElementById('market-desc-input')
                            if (descInput) descInput.focus()
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setShowAddForm(false)
                          }
                        }}
                      />
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">
                      Valor base do jogador: R$ {selectedPlayer.base_price.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Descrição - CORRIGIDA */}
                  <div>
                    <label className="text-zinc-400 text-sm font-medium mb-2 block">
                      Descrição (opcional)
                      <span className="text-zinc-500 ml-1">- Por que está colocando à venda?</span>
                    </label>
                    <Textarea
                      id="market-desc-input"
                      placeholder="Ex: Preciso de grana para reforçar o time, jogador não se adaptou ao sistema..."
                      value={marketDescription}
                      onChange={(e) => {
                        setMarketDescription(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        // Permite submeter com Ctrl+Enter
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault()
                          handleAddToMarket()
                        }
                      }}
                      className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddToMarket}
                      disabled={addingPlayer || !marketPrice}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingPlayer ? 'Anunciando...' : 'Anunciar no Mercado'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddForm(false)
                        setSelectedPlayer(null)
                        setMarketPrice('')
                        setMarketDescription('')
                      }}
                      variant="outline"
                      className="flex-1 text-white border-zinc-600 hover:bg-zinc-800"
                    >
                      Cancelar
                    </Button>
                  </div>
                  {marketPrice && (
                    <p className="text-xs text-zinc-400">
                      Dica: Use <kbd className="px-1 bg-zinc-700 rounded">Ctrl+Enter</kbd> no campo de descrição para salvar
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Meus jogadores no mercado */}
          {myMarketPlayers.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-bold text-white mb-4">Meus jogadores anunciados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myMarketPlayers.map(listing => (
                  <MarketPlayerCard 
                    key={listing.id} 
                    listing={listing} 
                    isMine={true}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Lista de jogadores disponíveis */}
      {loadingMarket ? (
        <div className="text-center py-16">
          <p className="text-xl text-zinc-400 animate-pulse">Carregando mercado...</p>
        </div>
      ) : marketTab === 'disponiveis' && marketPlayers.length === 0 ? (
        <Card className="p-16 text-center bg-white/5 border-white/10">
          <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-xl text-zinc-400">Nenhum jogador disponível no mercado</p>
          <p className="text-zinc-500 mt-2">Os times ainda não anunciaram jogadores para venda</p>
        </Card>
      ) : marketTab === 'meus' && myMarketPlayers.length === 0 && !showAddForm ? (
        <Card className="p-16 text-center bg-white/5 border-white/10">
          <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-xl text-zinc-400">Você ainda não anunciou jogadores</p>
          <p className="text-zinc-500 mt-2">Clique em "Adicionar Jogador" para começar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(marketTab === 'disponiveis' ? marketPlayers : myMarketPlayers)
            .filter(listing => marketTab === 'disponiveis' ? listing.is_active : true)
            .map(listing => (
              <MarketPlayerCard 
                key={listing.id} 
                listing={listing} 
                isMine={marketTab === 'meus'}
              />
            ))
          }
        </div>
      )}
    </>
  )

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

  if (loading && activeView === 'transferencias') {
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
              {activeView === 'transferencias' ? 'NEGOCIAÇÕES DE JOGADORES' : 'MERCADO DE JOGADORES'}
            </h1>
            <p className="text-zinc-400 mb-8 text-center md:text-left">
              {activeView === 'transferencias' 
                ? 'Gerencie todas as transferências do campeonato' 
                : 'Anuncie e compre jogadores diretamente do mercado'
              }
            </p>

            {/* Switch entre Transferências e Mercado */}
            <ViewSwitch />

            {/* Renderizar view ativa */}
            {activeView === 'transferencias' ? (
              <TransferenciasView />
            ) : (
              <MercadoView />
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