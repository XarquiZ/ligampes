"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox' // Importação adicionada
import { Loader2, Search, Grid3X3, List, Filter, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'
import { useOrganization } from '@/contexts/OrganizationContext'

// Componentes importados
import { PlayerCard } from '@/components/elenco/PlayerCard'
import { PlayerListItem } from '@/components/elenco/PlayerListItem'
import { ComparisonSection } from '@/components/elenco/sections/ComparisonSection'
import { PlannerSection } from '@/components/elenco/sections/PlannerSection'
import { TransferModal } from '@/components/elenco/modals/TransferModal'
import { DismissModal } from '@/components/elenco/modals/DismissModal'
import { SectionSwitch } from '@/components/elenco/SectionSwitch'
import { CustomCheckbox } from '@/components/elenco/CustomCheckbox'
import { Player, Team, POSITIONS, PLAYSTYLES } from '@/components/elenco/types'

export default function ElencoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { organization } = useOrganization()

  const { user, loading: authLoading } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [favoritePlayers, setFavoritePlayers] = useState<Player[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<'elenco' | 'favoritos' | 'comparacao' | 'planejador'>('elenco')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedPlaystyles, setSelectedPlaystyles] = useState<string[]>([])
  const [positionFilterOpen, setPositionFilterOpen] = useState(false)
  const [playstyleFilterOpen, setPlaystyleFilterOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [playerToDismiss, setPlayerToDismiss] = useState<Player | null>(null)
  const [openedPlayers, setOpenedPlayers] = useState<string[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  // NOVO ESTADO: Incluir posições secundárias (Padrão: true)
  const [includeSecondaryPositions, setIncludeSecondaryPositions] = useState(true)

  const [preSelectedPlayerId, setPreSelectedPlayerId] = useState<string | null>(null)

  const getPreSelectedPlayerFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return null

    const compareData = sessionStorage.getItem('comparePlayer1')
    if (!compareData) return null

    try {
      const parsedData = JSON.parse(compareData)
      return parsedData.comparePlayer?.id || null
    } catch {
      return null
    }
  }, [])

  // Carregar Organização Atual - Removido pois usamos o Contexto agora
  // useEffect anterior removido

  useEffect(() => {
    const section = searchParams.get('section')
    if (section && ['elenco', 'favoritos', 'comparacao', 'planejador'].includes(section)) {
      setActiveSection(section as any)

      if (section === 'comparacao') {
        const playerId = getPreSelectedPlayerFromStorage()
        if (playerId) {
          setPreSelectedPlayerId(playerId)
          setTimeout(() => {
            sessionStorage.removeItem('comparePlayer1')
          }, 1000)
        }
      }
    }
  }, [searchParams, getPreSelectedPlayerFromStorage])

  const formatHeight = (height: number | null | undefined) => {
    if (height === null || height === undefined) return '-'
    return `${height}cm`
  }

  useEffect(() => {
    if (authLoading || !user) return

    const loadUserData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
          .eq('organization_id', organization?.id)
          .single()

        if (!profileError) {
          setProfile(profileData)
          setTeam((profileData?.teams as unknown as Team) || null)
          setTeamId(profileData?.teams?.id || null)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadUserData()
  }, [authLoading, user, organization?.id])

  const loadAllPlayers = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('overall', { ascending: false })

      setAllPlayers(data || [])
    } catch (error) {
      console.error('Erro ao carregar todos os jogadores:', error)
    }
  }, [organization?.id])

  const loadFavoritePlayers = useCallback(async () => {
    if (!user) return

    let favoriteIds: string[] = []

    try {
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('player_favorites')
        .select('player_id')
        .eq('user_id', user.id)

      if (favoritesError) {
        console.error('Erro ao carregar favoritos:', favoritesError)
        return
      }

      favoriteIds = favoritesData.map(fav => fav.player_id)

      if (favoriteIds.length === 0) {
        setFavoritePlayers([])
        return
      }

      // Buscar jogadores favoritos com estatísticas
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select(`
          *,
          teams (
            id,
            name,
            logo_url
          ),
          player_stats (
            gols,
            assistencias,
            cartoes_amarelos,
            cartoes_vermelhos,
            jogos,
            avg_rating
          )
        `)
        .in('id', favoriteIds)
        .eq('organization_id', organization?.id)

      if (!playersError) {
        const playersWithFavorites = (playersData || []).map(player => {
          const stats = player.player_stats?.[0] || {};

          return {
            ...player,
            is_favorite: true,
            club: player.teams?.name || 'Sem time',
            logo_url: player.teams?.logo_url || null,
            // Incluir estatísticas da tabela player_stats
            total_goals: stats.gols || 0,
            total_assists: stats.assistencias || 0,
            total_yellow_cards: stats.cartoes_amarelos || 0,
            total_red_cards: stats.cartoes_vermelhos || 0,
            total_matches: stats.jogos || 0,
            average_rating: stats.avg_rating || 0
          }
        })
        setFavoritePlayers(playersWithFavorites)
      }
    } catch (error) {
      console.error('Erro ao processar favoritos:', error)
      // Fallback sem estatísticas
      try {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
        *,
        teams (
          id,
          name,
          logo_url
        )
          `)
          .in('id', favoriteIds)
          .eq('organization_id', organization?.id)

        if (!playersError) {
          const playersWithFavorites = (playersData || []).map(player => ({
            ...player,
            is_favorite: true,
            club: player.teams?.name || 'Sem time',
            logo_url: player.teams?.logo_url || null,
            // Valores padrão caso não encontre estatísticas
            total_goals: 0,
            total_assists: 0,
            total_yellow_cards: 0,
            total_red_cards: 0,
            total_matches: 0,
            average_rating: 0
          }))
          setFavoritePlayers(playersWithFavorites)
        }
      } catch (fallbackError) {
        console.error('Erro no fallback de favoritos:', fallbackError)
      }
    }
  }, [user, organization?.id])

  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCount = async () => {
      try {
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user.id}, user2_id.eq.${user.id} `)

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

  const loadPlayers = useCallback(async () => {
    if (!teamId) { setPlayers([]); setFilteredPlayers([]); return }
    setLoading(true)
    try {
      // Buscar jogadores com suas estatísticas da tabela player_stats
      const { data } = await supabase
        .from('players')
        .select(`
        *,
        player_stats(
          gols,
          assistencias,
          cartoes_amarelos,
          cartoes_vermelhos,
          jogos,
          avg_rating
        )
        `)
        .eq('team_id', teamId)
        .eq('organization_id', organization?.id)

      const mapped = (data || []).map((p: any) => {
        const stats = p.player_stats?.[0] || {}; // Pega o primeiro registro de estatísticas

        return {
          ...p,
          club: p.team_id ? (p.team_id === teamId ? (team?.name ?? 'Meu Time') : 'Outro') : 'Sem Time',
          logo_url: p.team_id === teamId ? (team?.logo_url ?? null) : p.logo_url ?? null,
          skills: p.skills || [],
          alternative_positions: p.alternative_positions || [],
          preferred_foot: p.preferred_foot || 'Nenhum',
          playstyle: p.playstyle || null,
          nationality: p.nationality || 'Desconhecida',
          height: p.height || null,
          is_penalty_specialist: p.is_penalty_specialist || false,
          injury_resistance: p.injury_resistance || null,
          // Atualizar para usar dados da tabela player_stats
          total_goals: stats.gols || 0,
          total_assists: stats.assistencias || 0,
          total_yellow_cards: stats.cartoes_amarelos || 0,
          total_red_cards: stats.cartoes_vermelhos || 0,
          total_matches: stats.jogos || 0,
          average_rating: stats.avg_rating || 0
        }
      })

      const sortedPlayers = mapped.sort((a, b) => {
        if (b.overall !== a.overall) {
          return b.overall - a.overall
        }
        return a.name.localeCompare(b.name)
      })

      setPlayers(sortedPlayers)
      setFilteredPlayers(sortedPlayers)
    } catch (e) {
      console.error('Erro ao carregar jogadores:', e)
      // Fallback: buscar sem estatísticas
      try {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', teamId)
          .eq('organization_id', organization?.id)

        const mapped = (data || []).map((p: any) => ({
          ...p,
          club: p.team_id ? (p.team_id === teamId ? (team?.name ?? 'Meu Time') : 'Outro') : 'Sem Time',
          logo_url: p.team_id === teamId ? (team?.logo_url ?? null) : p.logo_url ?? null,
          skills: p.skills || [],
          alternative_positions: p.alternative_positions || [],
          preferred_foot: p.preferred_foot || 'Nenhum',
          playstyle: p.playstyle || null,
          nationality: p.nationality || 'Desconhecida',
          height: p.height || null,
          is_penalty_specialist: p.is_penalty_specialist || false,
          injury_resistance: p.injury_resistance || null,
          // Valores padrão caso não encontre estatísticas
          total_goals: 0,
          total_assists: 0,
          total_yellow_cards: 0,
          total_red_cards: 0,
          total_matches: 0,
          average_rating: 0
        }))

        const sortedPlayers = mapped.sort((a, b) => {
          if (b.overall !== a.overall) {
            return b.overall - a.overall
          }
          return a.name.localeCompare(b.name)
        })

        setPlayers(sortedPlayers)
        setFilteredPlayers(sortedPlayers)
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError)
        setPlayers([])
        setFilteredPlayers([])
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, teamId, team, organization?.id])

  const loadAllTeams = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('organization_id', organization?.id)
        .order('name')

      setAllTeams(data || [])
    } catch (e) {
      console.error('Erro ao carregar times:', e)
    }
  }, [supabase, organization?.id])

  useEffect(() => {
    if (organization?.id) {
      loadAllTeams()
      loadAllPlayers()
    }
  }, [loadAllTeams, loadAllPlayers, organization?.id])

  useEffect(() => {
    if (organization?.id) {
      loadPlayers()
      loadFavoritePlayers()
    }
  }, [loadPlayers, loadFavoritePlayers, organization?.id])

  const handleSellPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setTransferModalOpen(true)
  }

  const handleDismissPlayer = (player: Player) => {
    setPlayerToDismiss(player)
    setDismissModalOpen(true)
  }

  const params = useParams()

  const navigateToPlayerInPlayersPage = (player: Player) => {
    sessionStorage.setItem('selectedPlayer', JSON.stringify({
      id: player.id,
      name: player.name,
      shouldExpand: true
    }))
    router.push(`/${params.site}/dashboard/jogadores#player-${player.id}`)
  }

  const handleProposeToCoach = async (player: Player) => {
    if (!player.team_id) {
      alert('Este jogador não tem um time associado.')
      return
    }

    try {
      const { data: playerTeamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('id', player.team_id)
        .single()

      if (teamError || !playerTeamData) {
        console.error('❌ Erro ao buscar time do jogador:', teamError)
        alert('Erro ao buscar informações do time do jogador.')
        return
      }

      const { data: coachProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, coach_name, full_name, team_id')
        .eq('team_id', player.team_id)
        .single()

      if (profileError || !coachProfile) {
        const teamsWithCoaches = [
          'Cruzeiro EC',
          'Fortaleza EC',
          'SC Internacional',
          'Sport Club do Recife'
        ]

        if (teamsWithCoaches.includes(playerTeamData.name)) {
          alert(`Erro: O time ${playerTeamData.name} deveria ter um técnico, mas não foi possível encontrá-lo. Contate o administrador.`)
        } else {
          alert(`O time ${playerTeamData.name} não tem um técnico associado no momento. Você só pode fazer propostas para times que tenham técnicos cadastrados.`)
        }
        return
      }

      await createOrOpenConversation(player, playerTeamData, coachProfile)

    } catch (error) {
      console.error('💥 Erro inesperado:', error)
      alert('Erro inesperado ao processar proposta.')
    }
  }

  const createOrOpenConversation = async (player: Player, playerTeamData: any, coachProfile: any) => {
    try {
      const { data: existingConversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .or(`user1_id.eq.${coachProfile.id},user2_id.eq.${coachProfile.id}`)
        .single()

      let conversationId

      if (existingConversation && !conversationError) {
        conversationId = existingConversation.id
      } else {
        const { data: newConversation, error: newConversationError } = await supabase
          .from('conversations')
          .insert([
            {
              user1_id: user?.id,
              user2_id: coachProfile.id,
              team1_id: team?.id,
              team2_id: playerTeamData.id,
              created_at: new Date().toISOString(),
              last_message: `Interesse em ${player.name}`,
              last_message_at: new Date().toISOString()
            }
          ])
          .select()
          .single()

        if (newConversationError) {
          console.error('❌ Erro ao criar conversa:', newConversationError)
          alert('Erro ao iniciar conversa com o técnico.')
          return
        }

        conversationId = newConversation.id

        const playerData = {
          id: player.id,
          name: player.name,
          overall: player.overall,
          position: player.position,
          photo_url: player.photo_url,
          team_id: player.team_id,
          team_name: playerTeamData.name,
          team_logo: playerTeamData.logo_url
        }

        const { error: messageError } = await supabase
          .from('private_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user?.id,
            message: `Olá! Tenho interesse no jogador ${player.name} (${player.position} - OVR ${player.overall})`,
            player_data: playerData,
            created_at: new Date().toISOString()
          })

        if (messageError) {
          console.error('⚠️ Erro ao enviar mensagem inicial:', messageError)
        }
      }

      setIsChatOpen(true)

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceReloadConversations'))
      }, 1000)

    } catch (error) {
      console.error('💥 Erro ao criar/abrir conversa:', error)
      throw error
    }
  }

  const handleSharePlayer = async (player: Player) => {
    try {
      setIsChatOpen(true)
      await handleProposeToCoach(player)
    } catch (error) {
      console.error('Erro ao compartilhar jogador:', error)
      alert('Erro ao abrir chat com o técnico.')
    }
  }

  const handleRemoveFromFavorites = async (player: Player) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('player_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('player_id', player.id)

      if (error) throw error

      setFavoritePlayers(prev => prev.filter(p => p.id !== player.id))
      alert('Jogador removido dos favoritos!')
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error)
      alert('Erro ao remover jogador dos favoritos.')
    }
  }

  const handleConfirmDismiss = async (playerId: string, playerName: string, overall: number) => {
    try {
      const dismissValue = overall <= 73 ? 2_000_000 : 5_000_000

      const { error: playerError } = await supabase
        .from('players')
        .update({ team_id: null })
        .eq('id', playerId)

      if (playerError) {
        console.error('❌ Erro ao remover jogador do time:', playerError)
        throw new Error(`Falha ao remover jogador: ${playerError.message}`)
      }

      try {
        await supabase
          .from('balance_transactions')
          .insert([{
            team_id: teamId,
            amount: dismissValue,
            type: 'credit',
            description: `Dispensa de jogador - ${playerName}`,
            created_at: new Date().toISOString(),
            player_name: playerName,
            organization_id: organization?.id
          }])
      } catch (balanceError) {
        console.warn('⚠️ Aviso: Não foi possível registrar transação de saldo:', balanceError)
      }

      try {
        const { data: currentTeam } = await supabase
          .from('teams')
          .select('balance')
          .eq('id', teamId)
          .single()

        if (currentTeam) {
          const newBalance = currentTeam.balance + dismissValue
          await supabase
            .from('teams')
            .update({ balance: newBalance })
            .eq('id', teamId)
        }
      } catch (balanceUpdateError) {
        console.warn('⚠️ Aviso: Erro na atualização de saldo:', balanceUpdateError)
      }

      try {
        const transferPayload = {
          player_id: playerId,
          player_name: playerName,
          from_team_id: teamId,
          to_team_id: null,
          value: dismissValue,
          status: 'approved',
          approved_by_seller: true,
          approved_by_buyer: true,
          approved_by_admin: true,
          created_at: new Date().toISOString(),
          transfer_type: 'dismiss',
          is_exchange: false,
          exchange_players: [],
          exchange_value: 0
        }

        await supabase
          .from('player_transfers')
          .insert([{ ...transferPayload, organization_id: organization?.id }])
      } catch (transferError) {
        console.warn('⚠️ Aviso: Erro no registro de transferência:', transferError)
      }

      setDismissModalOpen(false)
      setPlayerToDismiss(null)
      loadPlayers()

      alert(`✅ ${playerName} dispensado com sucesso!\nValor da dispensa: R$ ${dismissValue.toLocaleString('pt-BR')}`)

    } catch (error: any) {
      console.error('💥 Erro crítico ao dispensar jogador:', error)
      alert(`❌ Erro ao dispensar jogador: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleConfirmTransfer = async (transferData: any) => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        alert('Erro: Usuário não autenticado')
        return
      }

      const transferPayload: any = {
        player_id: transferData.playerId,
        player_name: transferData.playerName,
        from_team_id: transferData.fromTeamId,
        to_team_id: transferData.toTeamId,
        value: transferData.value,
        status: 'pending',
        approved_by_seller: true,
        approved_by_buyer: false,
        approved_by_admin: false,
        created_at: new Date().toISOString(),
        transfer_type: transferData.type
      }

      if (transferData.type === 'multi_sell') {
        transferPayload.transfer_players = transferData.transferPlayers || []
        transferPayload.player_names = transferData.playerNames || []
        transferPayload.player_values = transferData.playerValues || []
        transferPayload.is_exchange = false
      }
      else if (transferData.type === 'exchange') {
        transferPayload.exchange_players = transferData.exchangePlayers || []
        transferPayload.exchange_value = transferData.exchangeValue || 0
        transferPayload.money_direction = transferData.moneyDirection || 'send'
        transferPayload.is_exchange = true
      }
      else if (transferData.type === 'sell') {
        transferPayload.is_exchange = false
      }

      console.log('Enviando dados para transferência:', transferPayload)

      const { data, error } = await supabase
        .from('player_transfers')
        .insert([{ ...transferPayload, organization_id: organization?.id }])
        .select()

      if (error) {
        console.error('❌ Erro Supabase detalhado:', error)
        if (error.code === '42501') {
          alert('Erro de permissão: Contate o administrador para configurar as políticas de segurança.')
        } else {
          alert(`Erro ao enviar proposta: ${error.message}`)
        }
        return
      }

      setTransferModalOpen(false)
      setSelectedPlayer(null)
      loadPlayers()

      const message = transferData.type === 'multi_sell'
        ? '✅ Proposta de venda múltipla enviada com sucesso! Aguarde a aprovação do comprador e do administrador.'
        : transferData.type === 'sell'
          ? '✅ Proposta de transferência enviada com sucesso! Aguarde a aprovação do comprador e do administrador.'
          : '✅ Proposta de troca enviada com sucesso! Aguarde a aprovação do outro time e do administrador.'

      alert(message)

    } catch (e) {
      console.error('💥 Erro inesperado:', e)
      alert('Erro inesperado ao enviar proposta')
    }
  }

  const togglePosition = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    )
  }

  const togglePlaystyle = (playstyle: string) => {
    setSelectedPlaystyles(prev =>
      prev.includes(playstyle)
        ? prev.filter(p => p !== playstyle)
        : [...prev, playstyle]
    )
  }

  const clearPositionFilters = () => setSelectedPositions([])
  const clearPlaystyleFilters = () => setSelectedPlaystyles([])

  const togglePlayer = useCallback((playerId: string) => {
    if (isTransitioning) return;
    setOpenedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }, [isTransitioning])

  const handleGridCardClick = useCallback((player: Player) => {
    if (activeSection === 'elenco') {
      setViewMode('list')
      setTimeout(() => {
        setOpenedPlayers([player.id])
        const element = document.getElementById(`player-${player.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } else if (activeSection === 'favoritos') {
      navigateToPlayerInPlayersPage(player)
    }
  }, [activeSection])

  const handleFavoriteListClick = useCallback((player: Player) => {
    if (activeSection === 'favoritos') {
      navigateToPlayerInPlayersPage(player)
    } else {
      togglePlayer(player.id)
    }
  }, [activeSection, togglePlayer])

  const playersToShow = useMemo(() => {
    switch (activeSection) {
      case 'favoritos':
        return favoritePlayers
      case 'elenco':
      default:
        return players
    }
  }, [activeSection, players, favoritePlayers])

  // Aplicar filtros - ATUALIZADO PARA INCLUIR POSIÇÕES ALTERNATIVAS COM OPÇÃO
  useEffect(() => {
    let f = [...playersToShow]
    if (search) f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

    if (selectedPositions.length > 0) {
      f = f.filter(p =>
        selectedPositions.includes(p.position) ||
        (includeSecondaryPositions && p.alternative_positions && p.alternative_positions.some(altPos => selectedPositions.includes(altPos)))
      )
    }

    if (selectedPlaystyles.length > 0) {
      f = f.filter(p => p.playstyle && selectedPlaystyles.includes(p.playstyle))
    }

    f = f.sort((a, b) => {
      if (b.overall !== a.overall) {
        return b.overall - a.overall
      }
      return a.name.localeCompare(b.name)
    })

    setFilteredPlayers(f)
  }, [search, selectedPositions, selectedPlaystyles, playersToShow, includeSecondaryPositions])

  const chatUser = useMemo(() => ({
    id: user?.id || '',
    name: profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico',
    email: user?.email || ''
  }), [user, profile])

  const chatTeam = useMemo(() => ({
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }), [team])

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar user={user!} profile={profile} team={team} />

      <div className="flex-1 transition-all duration-300 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-8 mb-6 lg:mb-8">
              <div className="flex items-center gap-3 lg:gap-4">
                {team?.logo_url && <img src={team.logo_url} alt={team.name} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-contain" />}
                <div>
                  <h1 className="text-2xl lg:text-4xl font-black">Elenco {team ? `- ${team.name}` : ''}</h1>
                  <p className="text-zinc-400 text-sm lg:text-base">
                    {activeSection === 'elenco' && 'Jogadores do seu time'}
                    {activeSection === 'favoritos' && 'Jogadores favoritos de outros times'}
                    {activeSection === 'comparacao' && 'Comparação entre jogadores'}
                    {activeSection === 'planejador' && 'Planejador de formação'}
                  </p>
                </div>
              </div>

              {activeSection !== 'comparacao' && activeSection !== 'planejador' && (
                <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                  <div className="relative">
                    <Input
                      placeholder="Procurar..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-10 w-48 lg:w-64 h-9 lg:h-10 bg-zinc-900/70 border-zinc-700 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  </div>

                  <div className="relative">
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 lg:h-10 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-xs lg:text-sm",
                        selectedPositions.length > 0 && "border-purple-500 text-purple-400"
                      )}
                      onClick={() => setPositionFilterOpen(!positionFilterOpen)}
                    >
                      <Filter className="w-3 h-3 lg:w-4 lg:h-4" />
                      Posições
                      {selectedPositions.length > 0 && (
                        <Badge className="bg-purple-600 text-xs h-4 px-1 min-w-4">{selectedPositions.length}</Badge>
                      )}
                    </Button>

                    {positionFilterOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 lg:w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-10 p-3 lg:p-4">
                        <div className="flex justify-between items-center mb-2 lg:mb-3">
                          <h3 className="font-semibold text-sm lg:text-base">Filtrar por Posição</h3>
                          {selectedPositions.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearPositionFilters}
                              className="text-xs text-red-400 hover:text-red-300 h-6"
                            >
                              Limpar
                            </Button>
                          )}
                        </div>

                        {/* Opção para Incluir Posições Secundárias */}
                        <div className="flex items-center space-x-2 mb-3 p-2 bg-zinc-800/50 rounded-md border border-zinc-700/50">
                          <Checkbox
                            id="include-secondary-elenco"
                            checked={includeSecondaryPositions}
                            onCheckedChange={(checked) => setIncludeSecondaryPositions(!!checked)}
                            className="border-zinc-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 w-4 h-4"
                          />
                          <label
                            htmlFor="include-secondary-elenco"
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300 cursor-pointer"
                          >
                            Incluir posições secundárias
                          </label>
                        </div>

                        <div className="space-y-1 lg:space-y-2 max-h-48 lg:max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {POSITIONS.map(position => (
                            <CustomCheckbox
                              key={position}
                              id={`position-${position}`}
                              checked={selectedPositions.includes(position)}
                              onChange={() => togglePosition(position)}
                              label={position}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 lg:h-10 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-xs lg:text-sm",
                        selectedPlaystyles.length > 0 && "border-purple-500 text-purple-400"
                      )}
                      onClick={() => setPlaystyleFilterOpen(!playstyleFilterOpen)}
                    >
                      <Filter className="w-3 h-3 lg:w-4 lg:h-4" />
                      Estilos
                      {selectedPlaystyles.length > 0 && (
                        <Badge className="bg-purple-600 text-xs h-4 px-1 min-w-4">{selectedPlaystyles.length}</Badge>
                      )}
                    </Button>

                    {playstyleFilterOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 lg:w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-10 p-3 lg:p-4">
                        <div className="flex justify-between items-center mb-2 lg:mb-3">
                          <h3 className="font-semibold text-sm lg:text-base">Filtrar por Estilo</h3>
                          {selectedPlaystyles.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearPlaystyleFilters}
                              className="text-xs text-red-400 hover:text-red-300 h-6"
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1 lg:space-y-2 max-h-48 lg:max-h-60 overflow-y-auto">
                          {PLAYSTYLES.map(playstyle => (
                            <CustomCheckbox
                              key={playstyle}
                              id={`playstyle-${playstyle}`}
                              checked={selectedPlaystyles.includes(playstyle)}
                              onChange={() => togglePlaystyle(playstyle)}
                              label={playstyle}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex bg-zinc-900/70 rounded-lg lg:rounded-xl p-1 border border-zinc-700">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={cn('rounded-md lg:rounded-lg text-xs', viewMode === 'grid' && 'bg-purple-600')}
                    >
                      <Grid3X3 className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={cn('rounded-md lg:rounded-lg text-xs', viewMode === 'list' && 'bg-purple-600')}
                    >
                      <List className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </header>

            <SectionSwitch activeSection={activeSection} onSectionChange={setActiveSection} />

            {(positionFilterOpen || playstyleFilterOpen) && (
              <div
                className="fixed inset-0 z-0 bg-transparent cursor-default"
                onClick={(e) => {
                  e.preventDefault()
                  setPositionFilterOpen(false)
                  setPlaystyleFilterOpen(false)
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            )}

            {loading && activeSection !== 'comparacao' && activeSection !== 'planejador' && (
              <div className="flex justify-center py-16 lg:py-20">
                <Loader2 className="w-12 h-12 lg:w-16 lg:h-16 animate-spin text-purple-400" />
              </div>
            )}

            {activeSection === 'comparacao' && (
              <ComparisonSection
                players={allPlayers}
                preSelectedPlayerId={preSelectedPlayerId}
              />
            )}

            {activeSection === 'planejador' && (
              <PlannerSection teamPlayers={players} allPlayers={allPlayers} />
            )}

            {activeSection !== 'comparacao' && activeSection !== 'planejador' && (
              <>
                {!loading && filteredPlayers.length === 0 && (
                  <div className="text-center py-16 lg:py-20">
                    <div className="inline-block bg-zinc-900/80 rounded-2xl lg:rounded-3xl p-8 lg:p-12 border border-zinc-800">
                      <AlertCircle className="w-10 h-10 lg:w-12 lg:h-12 text-red-500 mx-auto mb-3 lg:mb-4" />
                      <h3 className="text-xl lg:text-2xl font-bold">
                        {activeSection === 'elenco' ? 'Nenhum jogador no elenco' : 'Nenhum jogador favorito'}
                      </h3>
                      <p className="text-zinc-400 text-sm lg:text-base">
                        {activeSection === 'elenco'
                          ? 'Verifique se seu perfil está associado a um time.'
                          : 'Adicione jogadores de outros times aos favoritos na página de jogadores.'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {viewMode === 'grid' && !loading && filteredPlayers.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
                    {filteredPlayers.map(player => (
                      <div
                        key={player.id}
                        onClick={() => handleGridCardClick(player)}
                        onMouseDown={(e) => e.preventDefault()}
                        tabIndex={0}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        <PlayerCard
                          player={player}
                          activeSection={activeSection}
                          showProposeButton={activeSection === 'favoritos'}
                          onSellClick={handleSellPlayer}
                          onDismissClick={handleDismissPlayer}
                          onShareClick={handleSharePlayer}
                          onRemoveFavorite={handleRemoveFromFavorites}
                          onCardClick={activeSection === 'favoritos'
                            ? navigateToPlayerInPlayersPage
                            : handleGridCardClick}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'list' && !loading && filteredPlayers.length > 0 && (
                  <div className="space-y-4 lg:space-y-6">
                    {filteredPlayers.map(player => (
                      <PlayerListItem
                        key={player.id}
                        player={player}
                        isOpen={openedPlayers.includes(player.id)}
                        activeSection={activeSection}
                        onToggle={() => togglePlayer(player.id)}
                        onSellClick={handleSellPlayer}
                        onDismissClick={handleDismissPlayer}
                        onShareClick={handleSharePlayer}
                        onRemoveFavorite={handleRemoveFromFavorites}
                        onCardClick={activeSection === 'favoritos'
                          ? navigateToPlayerInPlayersPage
                          : () => { }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            <TransferModal
              player={selectedPlayer}
              isOpen={transferModalOpen}
              onClose={() => setTransferModalOpen(false)}
              onConfirm={handleConfirmTransfer}
              teams={allTeams}
            />

            <DismissModal
              player={playerToDismiss}
              isOpen={dismissModalOpen}
              onClose={() => setDismissModalOpen(false)}
              onConfirm={handleConfirmDismiss}
            />
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
  )
}