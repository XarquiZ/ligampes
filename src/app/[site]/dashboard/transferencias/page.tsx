'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'
import { useOrganization } from '@/contexts/OrganizationContext'

// Importando componentes modulares
import {
  DescriptionModal,
  TransferenciasView,
  MercadoView,
  ViewSwitch,
  type UserProfile,
  type Team,
  type MarketPlayer,
  type Player,
  type Transfer
} from '@/components/transferencias'

// Importando componentes do filtro
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, X, ArrowUpDown, Check, BarChart } from 'lucide-react'

// Definindo as posições disponíveis
const POSITIONS = [
  { value: 'GO', label: 'GO' },
  { value: 'ZC', label: 'ZC' },
  { value: 'LE', label: 'LE' },
  { value: 'LD', label: 'LD' },
  { value: 'VOL', label: 'VOL' },
  { value: 'MLG', label: 'MLG' },
  { value: 'MLE', label: 'MLE' },
  { value: 'MLD', label: 'MLD' },
  { value: 'MAT', label: 'MAT' },
  { value: 'PTE', label: 'PTE' },
  { value: 'PTD', label: 'PTD' },
  { value: 'SA', label: 'SA' },
  { value: 'CA', label: 'CA' }
]

// Opções de Overall
const OVERALL_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: '60', label: '60+' },
  { value: '65', label: '65+' },
  { value: '70', label: '70+' },
  { value: '75', label: '75+' },
  { value: '80', label: '80+' },
  { value: '85', label: '85+' },
  { value: '90', label: '90+' },
]

export default function PaginaTransferencias() {
  const { organization } = useOrganization()
  const router = useRouter()
  const params = useParams()
  const [activeView, setActiveView] = useState<'transferencias' | 'mercado'>('transferencias')

  // Estados para Transferências
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([])
  const [userTeamId, setUserTeamId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [exchangePlayersDetails, setExchangePlayersDetails] = useState<{ [key: string]: any[] }>({})
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [team, setTeam] = useState<Team | null>(null)

  // Estados para o filtro de times
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(false)

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
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [priceOptions, setPriceOptions] = useState<{ value: number; label: string }[]>([])

  // Estados para os filtros do mercado
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedSort, setSelectedSort] = useState<string>('recent') // Padrão: Mais recentes
  const [selectedMinOverall, setSelectedMinOverall] = useState<string>('all')
  const [filteredMarketPlayers, setFilteredMarketPlayers] = useState<MarketPlayer[]>([])

  // Estado para mostrar/ocultar filtros mobile
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  // Carregar dados do usuário e time
  useEffect(() => {
    loadUserData()

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

  // Carregar times para o filtro
  useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true)
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name, logo_url, balance')
          .eq('organization_id', organization?.id)
          .order('name')

        if (error) {
          console.error('Erro ao carregar times:', error)
        } else {
          setTeams(data || [])
        }
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoadingTeams(false)
      }
    }

    if (organization?.id) {
      loadTeams()
    }
  }, [organization?.id])

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

  // Gerar opções de preço quando um jogador é selecionado
  useEffect(() => {
    if (selectedPlayer) {
      const basePrice = selectedPlayer.base_price
      const options = []

      for (let i = 0; i < 100; i++) {
        const value = basePrice + (i * 1_000_000)
        options.push({
          value,
          label: `R$ ${value.toLocaleString('pt-BR')}`
        })
      }

      setPriceOptions(options)
      setMarketPrice(`R$ ${basePrice.toLocaleString('pt-BR')}`)
    }
  }, [selectedPlayer])

  // Filtrar transferências com base no time selecionado
  useEffect(() => {
    if (allTransfers.length > 0) {
      let filtered = activeTab === 'pending'
        ? allTransfers.filter(t => t.status === 'pending')
        : allTransfers.filter(t => t.status === 'approved')

      // Aplicar filtro de time apenas na aba "completed"
      if (activeTab === 'completed' && selectedTeamFilter) {
        filtered = filtered.filter(transfer =>
          transfer.from_team_id === selectedTeamFilter ||
          transfer.to_team_id === selectedTeamFilter
        )
      }

      setTransfers(filtered)
    }
  }, [activeTab, allTransfers, selectedTeamFilter])

  // Filtrar jogadores do mercado com base nos filtros selecionados
  useEffect(() => {
    if (marketPlayers.length > 0) {
      let filtered = [...marketPlayers]

      // 1. Filtro de Posições
      if (selectedPositions.length > 0) {
        filtered = filtered.filter(player => {
          if (player.player && player.player.position) {
            return selectedPositions.includes(player.player.position)
          }
          return false
        })
      }

      // 2. Filtro de Overall Mínimo
      if (selectedMinOverall !== 'all') {
        const minOvr = parseInt(selectedMinOverall)
        filtered = filtered.filter(item => {
          return item.player && item.player.overall >= minOvr
        })
      }

      // 3. Ordenação
      filtered.sort((a, b) => {
        switch (selectedSort) {
          case 'recent':
            // Mais recentes primeiro
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

          case 'cheapest':
            // Menor preço primeiro
            return a.price - b.price

          case 'expensive':
            // Maior preço primeiro
            return b.price - a.price

          case 'highest_overall':
            // Maior Overall primeiro
            return (b.player?.overall || 0) - (a.player?.overall || 0)

          case 'lowest_overall':
            // Menor Overall primeiro
            return (a.player?.overall || 0) - (b.player?.overall || 0)

          default:
            return 0
        }
      })

      setFilteredMarketPlayers(filtered)
    } else {
      setFilteredMarketPlayers([])
    }
  }, [marketPlayers, selectedPositions, selectedSort, selectedMinOverall])

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Se temos o site nos params (o que deve acontecer), usamos ele.
        // Se não, fallback para /login global (embora idealmente não deva acontecer aqui)
        if (typeof params?.site === 'string') {
          router.push(`/${params.site}/login`)
        } else {
          router.push('/login')
        }
        return
      }

      setUser(session.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', session.user.id)
        .eq('organization_id', organization?.id)
        .single()

      if (profile) {
        setProfile(profile)
        setUserTeamId(profile?.team_id || null)
        setIsAdmin(profile?.role === 'admin')

        if (profile.teams) {
          setTeam(profile.teams)
        } else {
          setTeam(null)
        }
      }

      if (activeView === 'transferencias') {
        await loadData()
      } else {
        await loadMarketData()
        await loadMyPlayers()
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }

  const loadExchangePlayersDetails = async (transfer: Transfer) => {
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

    try {
      const { data: transferData, error } = await supabase
        .from('player_transfers')
        .select(`
          *,
          from_team:teams!from_team_id (id, name, logo_url, balance),
          to_team:teams!to_team_id (id, name, logo_url, balance),
          player:players (id, name, photo_url, position)
        `)
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const safeTransferData = transferData?.map(transfer => ({
        ...transfer,
        from_team: transfer.from_team || { id: '', name: 'Time Desconhecido', logo_url: null, balance: 0 },
        to_team: transfer.to_team || { id: '', name: 'Time Desconhecido', logo_url: null, balance: 0 },
        player: transfer.player || { id: '', name: 'Jogador Desconhecido', photo_url: null, position: 'N/A' }
      })) || []

      setAllTransfers(safeTransferData)

      const exchangeDetails: { [key: string]: any[] } = {}
      if (safeTransferData) {
        for (const transfer of safeTransferData) {
          if (transfer.is_exchange && transfer.exchange_players) {
            exchangeDetails[transfer.id] = await loadExchangePlayersDetails(transfer)
          }
        }
      }
      setExchangePlayersDetails(exchangeDetails)

      let filtered = activeTab === 'pending'
        ? safeTransferData.filter(t => t.status === 'pending')
        : safeTransferData.filter(t => t.status === 'approved')

      // Aplicar filtro de time apenas na aba "completed"
      if (activeTab === 'completed' && selectedTeamFilter) {
        filtered = filtered.filter(transfer =>
          transfer.from_team_id === selectedTeamFilter ||
          transfer.to_team_id === selectedTeamFilter
        )
      }

      setTransfers(filtered)
    } catch (error) {
      console.error('Erro ao carregar transferências:', error)
      setAllTransfers([])
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }

  const checkAndExecuteTransfer = async (transfer: Transfer) => {
    try {
      if (transfer.approved_by_seller && transfer.approved_by_buyer && transfer.approved_by_admin) {

        // VERIFICAÇÃO ESPECÍFICA PARA TROCAS COM DINHEIRO
        if (transfer.is_exchange && transfer.exchange_value && transfer.exchange_value > 0) {
          const moneyDirection = transfer.money_direction || 'send'

          let teamToCheckId: string
          let teamToCheckName: string

          // Identificar qual time precisa mandar dinheiro
          if (moneyDirection === 'send') {
            // Time de origem (quem está dando o jogador) precisa mandar dinheiro
            teamToCheckId = transfer.from_team_id
            teamToCheckName = transfer.from_team?.name || 'Time de origem'
          } else {
            // Time destino (quem está recebendo o jogador) precisa mandar dinheiro
            teamToCheckId = transfer.to_team_id || '' // Garante string, validação ocorre depois
            teamToCheckName = transfer.to_team?.name || 'Time destino'
          }

          // Verificar saldo do time que precisa mandar dinheiro
          const { data: teamData } = await supabase
            .from('teams')
            .select('balance, name')
            .eq('id', teamToCheckId)
            .single()

          if (teamData && teamData.balance < transfer.exchange_value) {
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
              alert(`❌ Troca rejeitada! ${teamData.name} não tem saldo suficiente para completar a transação.`)
            }
            return
          }
        }

        if (transfer.is_exchange) {
          // Lógica para trocas (mantida)
          const { data: exchangePlayers } = await supabase
            .from('players')
            .select('id, team_id')
            .in('id', transfer.exchange_players || [])

          const invalidPlayers = exchangePlayers?.filter(p => p.team_id !== transfer.to_team_id) || []
          if (invalidPlayers.length > 0) {
            alert('❌ Troca rejeita! Alguns jogadores não estão mais disponíveis no time.')

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
          // Verificar saldo para comprador (somente para vendas)
          const { data: buyerTeam, error: balanceError } = await supabase
            .from('teams')
            .select('balance, name')
            .eq('id', transfer.to_team_id)
            .single()

          if (balanceError) return

          if (buyerTeam.balance < transfer.value) {
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

        // NOVA FUNÇÃO PARA PROCESSAR TRANSFERÊNCIA (INCLUINDO VENDAS MÚLTIPLAS)
        const processTransferResult = await processCompleteTransfer(transfer)

        if (!processTransferResult.success) {
          alert(`Transferência falhou: ${processTransferResult.message}`)
          return
        }

        const message = transfer.transfer_type === 'multi_sell'
          ? `✅ Venda múltipla concluída! ${processTransferResult.transferredCount} jogadores foram transferidos.`
          : transfer.is_exchange
            ? '✅ Troca concluída com sucesso! Jogadores foram transferidos.'
            : '✅ Transferência concluída com sucesso! Jogador foi transferido.'

        alert(message)
        loadData()
      }
    } catch (error) {
      console.error('Erro inesperado ao processar transferência:', error)
      alert('Erro inesperado ao processar transferência')
    }
  }

  // FUNÇÃO ATUALIZADA: Processar transferência completa usando RPC unificada
  const processCompleteTransfer = async (transfer: Transfer) => {
    try {
      // VERIFICAÇÃO DE SALDO PARA TROCAS COM DINHEIRO
      if (transfer.is_exchange && transfer.exchange_value && transfer.exchange_value > 0) {
        // Carregar dados da transferência completa
        const { data: fullTransferData } = await supabase
          .from('player_transfers')
          .select(`
            *,
            from_team:teams!from_team_id(*),
            to_team:teams!to_team_id(*)
          `)
          .eq('id', transfer.id)
          .single()

        if (!fullTransferData) {
          throw new Error('Dados da transferência não encontrados')
        }

        const exchangeData = fullTransferData
        const exchangeValue = exchangeData.exchange_value || 0
        const moneyDirection = exchangeData.money_direction || 'send'
        const fromTeam = exchangeData.from_team
        const toTeam = exchangeData.to_team

        // SE HÁ DINHEIRO ENVOLVIDO NA TROCA
        if (exchangeValue > 0) {
          // VERIFICAR SALDO QUANDO O TIME DE ORIGEM PRECISA MANDAR DINHEIRO
          if (moneyDirection === 'send') {
            // Time de origem (quem está dando o jogador) está mandando dinheiro
            if (fromTeam.balance < exchangeValue) {
              throw new Error(`${fromTeam.name} não tem saldo suficiente para mandar R$ ${exchangeValue.toLocaleString('pt-BR')}. Saldo atual: R$ ${fromTeam.balance.toLocaleString('pt-BR')}`)
            }
          }
          // VERIFICAR SALDO QUANDO O TIME DESTINO PRECISA MANDAR DINHEIRO
          else if (moneyDirection === 'receive') {
            // Time destino (quem está recebendo o jogador) está mandando dinheiro
            if (toTeam.balance < exchangeValue) {
              throw new Error(`${toTeam.name} não tem saldo suficiente para mandar R$ ${exchangeValue.toLocaleString('pt-BR')}. Saldo atual: R$ ${toTeam.balance.toLocaleString('pt-BR')}`)
            }
          }
        }
      }

      // Usar a RPC unificada para processar a transferência
      const { data, error } = await supabase.rpc('processar_transferencia', {
        p_transfer_id: transfer.id,
        p_player_id: transfer.player_id,
        p_from_team_id: transfer.from_team_id,
        p_to_team_id: transfer.to_team_id,
        p_value: transfer.value,
        p_transfer_type: transfer.transfer_type || 'sell',
        p_transfer_players: transfer.transfer_players || null,
        p_is_exchange: transfer.is_exchange || false,
        p_exchange_players: transfer.exchange_players || null
      })

      if (error) {
        throw new Error(`Erro na função RPC: ${error.message}`)
      }

      if (data && !data.success) {
        return { success: false, message: data.message }
      }

      // APÓS A TRANSFERÊNCIA PRINCIPAL, PROCESSAR DINHEIRO DA TROCA (SE HOUVER)
      // Usando a função específica para isso
      if (transfer.is_exchange && transfer.exchange_value && transfer.exchange_value > 0) {
        // Carregar dados atualizados dos times
        const { data: updatedTeams } = await supabase
          .from('teams')
          .select('id, balance, name')
          .in('id', [transfer.from_team_id, transfer.to_team_id])

        const fromTeamUpdated = updatedTeams?.find(t => t.id === transfer.from_team_id)
        const toTeamUpdated = updatedTeams?.find(t => t.id === transfer.to_team_id)

        if (!fromTeamUpdated || !toTeamUpdated) {
          throw new Error('Não foi possível carregar os saldos atualizados dos times')
        }

        // Identificar quem paga e quem recebe
        const exchangeValue = transfer.exchange_value;
        const moneyDirection = transfer.money_direction || 'send';

        let payerTeamId, receiverTeamId, payerName, receiverName;

        if (moneyDirection === 'receive') {
          // Quem abriu o modal vai RECEBER → o outro paga
          payerTeamId = transfer.to_team_id;
          receiverTeamId = transfer.from_team_id;
          payerName = toTeamUpdated.name;
          receiverName = fromTeamUpdated.name;
        } else {
          // Quem abriu o modal vai PAGAR
          payerTeamId = transfer.from_team_id;
          receiverTeamId = transfer.to_team_id;
          payerName = fromTeamUpdated.name;
          receiverName = toTeamUpdated.name;
        }

        // ✅ Chamar a função específica para dinheiro de trocas
        const { error: rpcError } = await supabase.rpc('registrar_dinheiro_troca', {
          p_payer_team_id: payerTeamId,
          p_receiver_team_id: receiverTeamId,
          p_amount: exchangeValue,
          p_player_name: transfer.player_name,
          p_payer_name: payerName,
          p_receiver_name: receiverName
        });

        if (rpcError) {
          console.error('Erro ao registrar dinheiro da troca via RPC:', rpcError);
          throw rpcError;
        }

        console.log(`Dinheiro da troca registrado: ${payerName} → ${receiverName} | R$ ${exchangeValue.toLocaleString('pt-BR')}`);
      }

      const transferredCount = data?.transferred_count || 1;

      return {
        success: true,
        message: data?.message || 'Transferência concluída com sucesso',
        transferredCount: transferredCount
      }

    } catch (error: any) {
      console.error('Erro ao processar transferência completa:', error)
      return {
        success: false,
        message: error.message || 'Erro desconhecido ao processar transferência'
      }
    }
  }

  const aprovar = async (transferId: string, type: 'seller' | 'buyer' | 'admin') => {
    const field = `approved_by_${type}`

    const { error } = await supabase
      .from('player_transfers')
      .update({ [field]: true } as any)
      .eq('id', transferId)

    if (error) {
      console.error('Erro ao aprovar transferência:', error)
      alert(`Erro ao aprovar: ${error.message}`)
      return
    }

    // Recarregar os dados atualizados
    const { data: updatedTransfer } = await supabase
      .from('player_transfers')
      .select('*, from_team:teams!from_team_id(*), to_team:teams!to_team_id(*), player:players(*)')
      .eq('id', transferId)
      .single()

    if (updatedTransfer) {
      // Atualizar lista local
      const updatedTransfers = transfers.map(t =>
        t.id === transferId ? { ...t, [field]: true } : t
      )
      setTransfers(updatedTransfers)

      // Verificar se todas as aprovações foram dadas
      const allApproved =
        (type === 'seller' || updatedTransfer.approved_by_seller) &&
        (type === 'buyer' || updatedTransfer.approved_by_buyer) &&
        (type === 'admin' || updatedTransfer.approved_by_admin)

      if (allApproved) {
        await checkAndExecuteTransfer(updatedTransfer)
      } else {
        alert('✅ Aprovação registrada! Aguardando outras aprovações.')
      }
    }
  }

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

      setTransfers(prev => prev.filter(t => t.id !== transferId))
      setAllTransfers(prev => prev.filter(t => t.id !== transferId))

      alert('✅ Transferência cancelada com sucesso!')
    } catch (error) {
      console.error('Erro ao cancelar transferência:', error)
      alert('Erro inesperado ao cancelar transferência')
    }
  }

  const loadMarketData = async () => {
    if (!team?.id) return

    setLoadingMarket(true)
    try {
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
            base_price,
            team_id
          ),
          team:teams!market_listings_team_id_fkey (
            id,
            name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .eq('organization_id', organization?.id)
        .neq('team_id', team.id)
        .order('created_at', { ascending: false })

      const formattedData = (data || []).map(item => ({
        ...item,
        team_name: item.team?.name || 'Time desconhecido',
        team_logo: item.team?.logo_url || null,
        player: item.player || undefined
      }))

      setMarketPlayers(formattedData)
      setMarketPlayers(formattedData)
    } catch (error) {
      console.error('Erro ao carregar mercado:', error)
      setMarketPlayers([])
    } finally {
      setLoadingMarket(false)
    }
  }

  const loadMyPlayers = useCallback(async () => {
    if (!team?.id) return

    try {
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', team.id)
        .order('overall', { ascending: false })

      setAvailablePlayers(playersData || [])

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
            base_price,
            team_id
          ),
          team:teams!market_listings_team_id_fkey (
            id,
            name,
            logo_url
          )
        `)
        .eq('team_id', team.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const formattedMarketData = (marketData || []).map(item => ({
        ...item,
        team_name: item.team?.name || team?.name || 'Meu Time',
        team_logo: item.team?.logo_url || team?.logo_url || null,
        player: item.player || undefined
      }))

      setMyMarketPlayers(formattedMarketData)
    } catch (error) {
      console.error('Erro ao carregar meus jogadores:', error)
    }
  }, [team?.id, team?.name, team?.logo_url])

  const handlePriceChange = (value: string) => {
    setMarketPrice(value)
  }

  const handleOpenDescriptionModal = () => {
    setShowDescriptionModal(true)
  }

  const handleCloseDescriptionModal = () => {
    setShowDescriptionModal(false)
  }

  const handleSaveDescription = (text: string) => {
    setMarketDescription(text)
  }

  const handleAddToMarket = async (saleMode: 'fixed_price' | 'negotiable') => {
    if (!selectedPlayer || !team?.id) {
      alert('Selecione um jogador')
      return
    }

    if (saleMode === 'fixed_price' && !marketPrice) {
      alert('Informe o preço para venda com preço fixo')
      return
    }

    const priceMatch = marketPrice.match(/R\$\s?([\d.,]+)/)
    if (!priceMatch) {
      alert('Preço inválido')
      return
    }

    const priceString = priceMatch[1].replace(/\./g, '').replace(',', '.')
    const price = parseFloat(priceString)

    if (isNaN(price) || price <= 0) {
      alert('Preço inválido')
      return
    }

    if (price < selectedPlayer.base_price) {
      alert(`O preço não pode ser menor que o valor base do jogador (R$ ${selectedPlayer.base_price.toLocaleString('pt-BR')})`)
      return
    }

    let finalDescription = marketDescription.trim()
    if (saleMode === 'negotiable') {
      const prefix = '[Aceita Propostas] '
      if (!finalDescription.startsWith(prefix)) {
        finalDescription = prefix + (finalDescription || 'Disponível para negociação')
      }
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
          description: finalDescription || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      setSelectedPlayer(null)
      setMarketPrice('')
      setMarketDescription('')
      setShowAddForm(false)
      setShowDescriptionModal(false)

      alert(saleMode === 'fixed_price'
        ? '✅ Jogador anunciado com preço fixo no mercado!'
        : '✅ Jogador anunciado para negociação no mercado!'
      )

      await Promise.all([
        loadMarketData(),
        loadMyPlayers()
      ])
    } catch (error: any) {
      console.error('Erro ao anunciar jogador:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleRemoveFromMarket = async (listingId: string) => {
    if (!confirm('Tem certeza que deseja REMOVER este jogador do mercado? Esta ação não pode ser desfeita.')) return

    try {
      const { error } = await supabase
        .from('market_listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error

      setMyMarketPlayers(prev => prev.filter(item => item.id !== listingId))
      setMarketPlayers(prev => prev.filter(item => item.id !== listingId))

      alert('✅ Jogador removido do mercado com sucesso!')
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

      setMyMarketPlayers(prev => prev.map(item =>
        item.id === listingId
          ? { ...item, description: editDescriptionText.trim() }
          : item
      ))

      setEditingDescription(null)
      setEditDescriptionText('')
      alert('✅ Descrição atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar descrição:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleStartEditDescription = (listing: MarketPlayer) => {
    setEditingDescription(listing.id)
    setEditDescriptionText(listing.description || '')
  }

  const handleCancelEdit = () => {
    setEditingDescription(null)
    setEditDescriptionText('')
  }

  const handleMakeProposal = async (listing: MarketPlayer) => {
    if (!team?.id || !user?.id) {
      alert('Você precisa estar logado para enviar propostas')
      return
    }

    const isNegotiable = listing.description?.includes('[Aceita Propostas]') ||
      listing.description?.toLowerCase().includes('negoci') ||
      listing.description?.toLowerCase().includes('proposta')

    if (isNegotiable) {
      try {
        const { data: sellerProfile } = await supabase
          .from('profiles')
          .select(`
            id,
            coach_name,
            email,
            teams!inner(id, name, logo_url)
          `)
          .eq('team_id', listing.team_id)
          .single()

        if (sellerProfile) {
          window.dispatchEvent(new CustomEvent('openChatWithUser', {
            detail: {
              userId: sellerProfile.id,
              userName: sellerProfile.coach_name || sellerProfile.email,
              teamName: Array.isArray(sellerProfile.teams) ? sellerProfile.teams[0]?.name : (sellerProfile.teams as any)?.name,
              teamLogo: Array.isArray(sellerProfile.teams) ? sellerProfile.teams[0]?.logo_url : (sellerProfile.teams as any)?.logo_url,
              playerName: listing.player_name,
              playerId: listing.player_id
            }
          }))

          setIsChatOpen(true)
        }
      } catch (error) {
        console.error('Erro ao buscar informações do vendedor:', error)
        alert('Não foi possível iniciar a conversa com o vendedor.')
      }
    } else {
      handleBuyPlayer(listing)
    }
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

    if (!confirm(`Deseja comprar ${listing.player_name} por R$ ${listing.price.toLocaleString('pt-BR')}? Essa ação leva a uma proposta de negociação. OBS: Não tem Volta !`)) {
      return
    }

    try {
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
          approved_by_buyer: true,
          approved_by_admin: false,
          created_at: new Date().toISOString(),
          transfer_type: 'sell',
          is_exchange: false,
          exchange_players: [],
          exchange_value: 0
        }])

      if (transferError) throw transferError

      await supabase
        .from('market_listings')
        .delete()
        .eq('id', listing.id)

      alert('✅ Proposta de compra enviada! Aguarde a aprovação do vendedor.')

      loadMarketData()
      setActiveView('transferencias')
    } catch (error: any) {
      console.error('Erro ao comprar jogador:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setSelectedPlayer(null)
    setMarketPrice('')
    setMarketDescription('')
  }

  const clearTeamFilter = () => {
    setSelectedTeamFilter(null)
  }

  const handleTabChange = (tab: 'pending' | 'completed') => {
    setActiveTab(tab)
    if (tab === 'pending') {
      setSelectedTeamFilter(null)
    }
  }

  const clearMarketFilters = () => {
    setSelectedPositions([])
    setSelectedSort('recent')
    setSelectedMinOverall('all')
    setShowFiltersMobile(false)
  }

  const togglePosition = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    )
  }

  const toggleAllPositions = () => {
    if (selectedPositions.length === POSITIONS.length) {
      setSelectedPositions([])
    } else {
      setSelectedPositions(POSITIONS.map(p => p.value))
    }
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

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar - AGORA CONTROLA TUDO INTERNAMENTE */}
      <Sidebar
        user={user!}
        profile={profile}
        team={team}
      />

      <div className="flex-1 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-4 md:p-8">
          {/* REMOVI O MOBILE HEADER - O Sidebar agora controla isso */}

          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 text-center md:text-left">
              {activeView === 'transferencias' ? 'NEGOCIAÇÕES' : 'MERCADO'}
            </h1>
            <p className="text-zinc-400 mb-6 md:mb-8 text-center md:text-left text-sm md:text-base">
              {activeView === 'transferencias'
                ? 'Gerencie todas as transferências'
                : 'Anuncie e compre jogadores'
              }
            </p>

            <div className="mb-6">
              <ViewSwitch activeView={activeView} setActiveView={setActiveView} />
            </div>

            {activeView === 'transferencias' ? (
              <>
                {activeTab === 'completed' && (
                  <div className="mb-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-zinc-300">Filtrar por time:</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <Select
                          value={selectedTeamFilter || "all"}
                          onValueChange={(value) => setSelectedTeamFilter(value === "all" ? null : value)}
                        >
                          <SelectTrigger className="w-full sm:w-[250px] bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800">
                            <SelectValue placeholder="Selecione um time" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                            <SelectItem
                              value="all"
                              className="focus:bg-purple-600 focus:text-white hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-white"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                  <Filter className="w-3 h-3 text-white" />
                                </div>
                                <span className="truncate">Todos os times</span>
                              </div>
                            </SelectItem>
                            {loadingTeams ? (
                              <SelectItem value="loading" disabled className="text-white">
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                  <span>Carregando times...</span>
                                </div>
                              </SelectItem>
                            ) : (
                              teams.map((team) => (
                                <SelectItem
                                  key={team.id}
                                  value={team.id}
                                  className="focus:bg-purple-600 focus:text-white hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-white"
                                >
                                  <div className="flex items-center gap-2">
                                    {team.logo_url ? (
                                      <img
                                        src={team.logo_url}
                                        alt={team.name}
                                        className="w-5 h-5 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">
                                          {team.name?.substring(0, 2) || 'TM'}
                                        </span>
                                      </div>
                                    )}
                                    <span className="truncate">{team.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        {selectedTeamFilter && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearTeamFilter}
                            className="text-zinc-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 border-zinc-700 w-full sm:w-auto"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Limpar filtro
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedTeamFilter && (
                      <div className="mt-3 pt-3 border-t border-zinc-700/30">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-zinc-400">Mostrando transferências envolvendo:</span>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const selectedTeam = teams.find(t => t.id === selectedTeamFilter)
                              if (selectedTeam) {
                                return (
                                  <>
                                    {selectedTeam.logo_url ? (
                                      <img
                                        src={selectedTeam.logo_url}
                                        alt={selectedTeam.name}
                                        className="w-4 h-4 rounded-full"
                                      />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white">
                                          {selectedTeam.name?.substring(0, 2) || 'TM'}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-white text-sm font-medium truncate">{selectedTeam.name}</span>
                                  </>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <TransferenciasView
                  activeTab={activeTab}
                  setActiveTab={handleTabChange}
                  transfers={transfers}
                  allTransfers={allTransfers}
                  userTeamId={userTeamId}
                  isAdmin={isAdmin}
                  exchangePlayersDetails={exchangePlayersDetails}
                  aprovar={aprovar}
                  rejeitarTransferencia={rejeitarTransferencia}
                  loading={loading}
                  selectedTeamFilter={selectedTeamFilter}
                />
              </>
            ) : (
              <>
                {/* Botão para mostrar/ocultar filtros no mobile */}
                <div className="lg:hidden mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                    className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFiltersMobile ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </Button>
                </div>

                {/* Filtros do Mercado - Responsivos */}
                {marketTab === 'disponiveis' && (
                  <div className={`mb-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700/50 ${!showFiltersMobile ? 'hidden lg:block' : ''}`}>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-zinc-300">Filtrar jogadores disponíveis:</span>
                      </div>

                      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full lg:w-auto">

                        {/* Filtro de Posições (Multi-select) */}
                        <div className="w-full sm:w-auto">
                          <Select>
                            <SelectTrigger className="w-full sm:w-[220px] bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 h-10">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Pos:</span>
                                <span className="truncate text-white text-sm">
                                  {selectedPositions.length === 0 ? "Todas" : `${selectedPositions.length} selecionadas`}
                                </span>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 max-h-96 w-[calc(100vw-2rem)] sm:w-auto">
                              <div
                                className="flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-blue-600/30 rounded-md"
                                onClick={toggleAllPositions}
                              >
                                <span className="text-white text-sm">
                                  {selectedPositions.length === POSITIONS.length ? "Desselecionar todas" : "Selecionar todas"}
                                </span>
                                <Check className={`w-4 h-4 ${selectedPositions.length === POSITIONS.length ? 'text-green-400' : 'text-zinc-500'}`} />
                              </div>
                              <div className="border-t border-zinc-700 my-2"></div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                {POSITIONS.map((position) => (
                                  <div
                                    key={position.value}
                                    className={`flex items-center justify-between px-2 py-2 cursor-pointer rounded-md ${selectedPositions.includes(position.value) ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800'}`}
                                    onClick={() => togglePosition(position.value)}
                                  >
                                    <span className="text-sm text-white">{position.label}</span>
                                    {selectedPositions.includes(position.value) && <Check className="w-4 h-4" />}
                                  </div>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filtro de Overall Mínimo */}
                        <div className="w-full sm:w-auto">
                          <Select value={selectedMinOverall} onValueChange={setSelectedMinOverall}>
                            <SelectTrigger className="w-full sm:w-[160px] bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 h-10">
                              <div className="flex items-center gap-2">
                                <BarChart className="w-4 h-4 text-blue-400" />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold">OVR:</span>
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              {OVERALL_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-blue-600 cursor-pointer">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Ordenação */}
                        <div className="w-full sm:w-auto">
                          <Select value={selectedSort} onValueChange={setSelectedSort}>
                            <SelectTrigger className="w-full sm:w-[220px] bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 h-10">
                              <div className="flex items-center gap-2">
                                <ArrowUpDown className="w-4 h-4 text-blue-400" />
                                <SelectValue placeholder="Ordenar" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              <SelectItem value="recent" className="text-white focus:bg-blue-600 cursor-pointer">Mais recentes</SelectItem>
                              <SelectItem value="cheapest" className="text-white focus:bg-blue-600 cursor-pointer">Menor preço</SelectItem>
                              <SelectItem value="expensive" className="text-white focus:bg-blue-600 cursor-pointer">Maior preço</SelectItem>
                              <SelectItem value="highest_overall" className="text-white focus:bg-blue-600 cursor-pointer">Melhor Overall</SelectItem>
                              <SelectItem value="lowest_overall" className="text-white focus:bg-blue-600 cursor-pointer">Pior Overall</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Botão Limpar */}
                        {(selectedPositions.length > 0 || selectedSort !== 'recent' || selectedMinOverall !== 'all') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearMarketFilters}
                            className="text-zinc-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 border-zinc-700 h-10 w-full sm:w-auto"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>

                    {(selectedPositions.length > 0 || selectedSort !== 'recent' || selectedMinOverall !== 'all') && (
                      <div className="mt-3 pt-3 border-t border-zinc-700/30">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-zinc-400">Filtros ativos:</span>

                            {selectedPositions.length > 0 && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                                {selectedPositions.length} Posições
                              </Badge>
                            )}

                            {selectedMinOverall !== 'all' && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                                OVR {selectedMinOverall}+
                              </Badge>
                            )}

                            {selectedSort !== 'recent' && (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                                {selectedSort === 'cheapest' && 'Menor Preço'}
                                {selectedSort === 'expensive' && 'Maior Preço'}
                                {selectedSort === 'highest_overall' && 'Melhor OVR'}
                                {selectedSort === 'lowest_overall' && 'Pior OVR'}
                              </Badge>
                            )}

                            <span className="text-xs text-zinc-500 ml-auto">
                              ({filteredMarketPlayers.length} de {marketPlayers.length})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <MercadoView
                  marketTab={marketTab}
                  setMarketTab={setMarketTab}
                  marketPlayers={marketTab === 'disponiveis' ? filteredMarketPlayers : marketPlayers}
                  myMarketPlayers={myMarketPlayers}
                  availablePlayers={availablePlayers}
                  loadingMarket={loadingMarket}
                  showAddForm={showAddForm}
                  setShowAddForm={setShowAddForm}
                  selectedPlayer={selectedPlayer}
                  setSelectedPlayer={setSelectedPlayer}
                  marketPrice={marketPrice}
                  setMarketPrice={setMarketPrice}
                  marketDescription={marketDescription}
                  setMarketDescription={setMarketDescription}
                  editingDescription={editingDescription}
                  setEditingDescription={setEditingDescription}
                  editDescriptionText={editDescriptionText}
                  setEditDescriptionText={setEditDescriptionText}
                  priceOptions={priceOptions}
                  handlePriceChange={handlePriceChange}
                  handleOpenDescriptionModal={handleOpenDescriptionModal}
                  handleAddToMarket={handleAddToMarket}
                  handleRemoveFromMarket={handleRemoveFromMarket}
                  handleBuyPlayer={handleBuyPlayer}
                  handleMakeProposal={handleMakeProposal}
                  handleStartEditDescription={handleStartEditDescription}
                  handleUpdateDescription={handleUpdateDescription}
                  handleCancelEdit={handleCancelEdit}
                  addingPlayer={addingPlayer}
                  handleCancelAdd={handleCancelAdd}
                />
              </>
            )}
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

        <DescriptionModal
          isOpen={showDescriptionModal}
          onClose={handleCloseDescriptionModal}
          initialText={marketDescription}
          onSave={handleSaveDescription}
          playerName={selectedPlayer?.name || 'Jogador'}
        />
      </div>
    </div>
  )
}