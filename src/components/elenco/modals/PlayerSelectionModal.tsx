import React, { useEffect, useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, AlertCircle, Users, Target, X, Star, TrendingUp, Filter, Shield, Zap, Target as TargetIcon, Users as UsersIcon, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlayerSelectionModalProps, Player, POSITION_MAP } from '../types'
import { supabase } from '@/lib/supabase'

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPlayer, 
  teamPlayers, 
  allPlayers,
  position,
  playerType = 'team',
  isReserveSlot = false,
  selectedPlayers = new Set()
}) => {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'team' | 'all' | 'favorites'>(playerType)
  const [filteredTeamPlayers, setFilteredTeamPlayers] = useState<Player[]>([])
  const [filteredAllPlayers, setFilteredAllPlayers] = useState<Player[]>([])
  const [filteredFavoritePlayers, setFilteredFavoritePlayers] = useState<Player[]>([])
  const [favoritePlayers, setFavoritePlayers] = useState<Player[]>([])
  const [allPlayersWithTeams, setAllPlayersWithTeams] = useState<Player[]>([])
  const [sortBy, setSortBy] = useState<'overall' | 'name' | 'price'>('overall')
  const [showAllPositionsTeam, setShowAllPositionsTeam] = useState(isReserveSlot)
  const [showAllPositionsAll, setShowAllPositionsAll] = useState(isReserveSlot)
  const [showAllPositionsFavorites, setShowAllPositionsFavorites] = useState(isReserveSlot)
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [loadingAllPlayers, setLoadingAllPlayers] = useState(false)
  const [teams, setTeams] = useState<{id: string, name: string, logo_url: string}[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  // Cores das posições
  const getPositionColor = (position: string) => {
    if (position === 'GO') return 'bg-yellow-500 border-yellow-400'
    if (['LE', 'ZC', 'LD'].includes(position)) return 'bg-blue-500 border-blue-400'
    if (['VOL', 'MLG', 'MLE', 'MLD', 'MAT'].includes(position)) return 'bg-green-500 border-green-400'
    if (['PTE', 'PTD', 'SA', 'CA'].includes(position)) return 'bg-red-500 border-red-400'
    return 'bg-gray-500 border-gray-400'
  }

  // Buscar times
  useEffect(() => {
    const fetchTeams = async () => {
      if (!isOpen) return
      
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name, logo_url')
          .order('name')
        
        if (error) {
          console.error('Erro ao buscar times:', error)
          return
        }
        
        if (data) {
          setTeams(data)
        }
      } catch (error) {
        console.error('Erro ao carregar times:', error)
      }
    }
    
    fetchTeams()
  }, [isOpen])

  // Buscar todos os jogadores com informações de times
  useEffect(() => {
    const fetchAllPlayersWithTeams = async () => {
      if (!isOpen || activeTab !== 'all') return
      
      try {
        setLoadingAllPlayers(true)
        
        // Buscar todos os jogadores com join na tabela de times
        // AQUI ESTÁ A MUDANÇA: 'teams' em vez de 'teams!inner' permite jogadores sem time (LEFT JOIN)
        const { data: playersData, error } = await supabase
          .from('players')
          .select(`
            *,
            teams (
              id,
              name,
              logo_url
            )
          `)
          .order('name')
        
        if (error) {
          console.error('Erro ao buscar todos os jogadores:', error)
          
          // Fallback: usar a prop allPlayers e tentar combinar com times
          if (allPlayers.length > 0 && teams.length > 0) {
            const playersWithTeams = allPlayers.map(player => {
              const team = teams.find(t => t.id === player.team_id)
              return {
                ...player,
                club: team ? team.name : player.club || 'Sem time',
                team_logo: team ? team.logo_url : null
              }
            })
            setAllPlayersWithTeams(playersWithTeams)
          }
          return
        }
        
        if (playersData) {
          // Processar dados dos jogadores, lidando com times nulos
          const processedPlayers = playersData.map(player => ({
            ...player,
            club: player.teams?.name || 'Sem time',
            team_id: player.teams?.id || null, // Garante que team_id nulo seja tratado
            team_logo: player.teams?.logo_url || null
          }))
          
          setAllPlayersWithTeams(processedPlayers as Player[])
        }
      } catch (error) {
        console.error('Erro ao processar jogadores:', error)
      } finally {
        setLoadingAllPlayers(false)
      }
    }
    
    fetchAllPlayersWithTeams()
  }, [isOpen, activeTab, allPlayers, teams])

  // Carregar jogadores favoritos com dados dos times
  useEffect(() => {
    const loadFavoritePlayers = async () => {
      if (!isOpen || activeTab !== 'favorites') return
      
      try {
        setLoadingFavorites(true)
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Erro ao obter usuário:', userError)
          setFavoritePlayers([])
          return
        }
        
        // Buscar favoritos com join nas tabelas de times
        // Mantendo !inner aqui para favoritos, mas se quiser ver sem time, tire o !inner
        const { data: favorites, error: favoritesError } = await supabase
          .from('player_favorites')
          .select(`
            player_id,
            players (
              *,
              teams (
                id,
                name,
                logo_url
              )
            )
          `)
          .eq('user_id', user.id)
        
        if (favoritesError) {
          console.error('Erro ao buscar favoritos:', favoritesError)
          
          // Fallback: buscar jogadores favoritos e depois os times
          const { data: favoriteIds, error: idsError } = await supabase
            .from('player_favorites')
            .select('player_id')
            .eq('user_id', user.id)
          
          if (idsError || !favoriteIds?.length) {
            setFavoritePlayers([])
            return
          }
          
          const playerIds = favoriteIds.map(f => f.player_id)
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('*')
            .in('id', playerIds)
          
          if (playersError || !playersData) {
            setFavoritePlayers([])
            return
          }
          
          // Combinar com informações de times
          const playersWithTeams = playersData.map(player => {
            const team = teams.find(t => t.id === player.team_id)
            return {
              ...player,
              club: team ? team.name : player.club || 'Sem time',
              team_logo: team ? team.logo_url : null
            }
          })
          
          setFavoritePlayers(playersWithTeams as Player[])
          return
        }
        
        if (favorites && favorites.length > 0) {
          // Processar dados dos favoritos
          const playersWithTeams = favorites.map(f => {
            const player = f.players
            // Extrair informações do time se existirem
            const teamData = player.teams ? {
              club: player.teams.name || 'Sem time',
              team_id: player.teams.id,
              team_logo: player.teams.logo_url
            } : {
              club: 'Sem time',
              team_id: null,
              team_logo: null
            }
            
            return {
              ...player,
              club: teamData.club,
              team_id: teamData.team_id,
              team_logo: teamData.team_logo
            }
          })
          
          setFavoritePlayers(playersWithTeams as Player[])
        } else {
          setFavoritePlayers([])
        }
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error)
        setFavoritePlayers([])
      } finally {
        setLoadingFavorites(false)
      }
    }
    
    if (activeTab === 'favorites' || favoritePlayers.length === 0) {
      loadFavoritePlayers()
    }
  }, [isOpen, activeTab, teams])

  useEffect(() => {
    if (!isOpen) return

    const filterPlayers = (players: Player[], showAllPositions: boolean) => {
      let filtered = [...players]
      
      if (search) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      if (!isReserveSlot && position && position !== '' && !showAllPositions) {
        filtered = filtered.filter(p => 
          p.position === position || 
          (p.alternative_positions && p.alternative_positions.includes(position))
        )
      }
      
      filtered.sort((a, b) => {
        if (sortBy === 'overall') return b.overall - a.overall
        if (sortBy === 'price') return b.base_price - a.base_price
        return a.name.localeCompare(b.name)
      })
      
      return filtered
    }

    // Processar teamPlayers para garantir que tenham informações do time
    const processedTeamPlayers = teamPlayers.map(player => {
      const team = teams.find(t => t.id === player.team_id)
      return {
        ...player,
        club: team ? team.name : player.club || 'Meu Time',
        team_logo: team ? team.logo_url : player.team_logo || null
      }
    })

    setFilteredTeamPlayers(filterPlayers(processedTeamPlayers, showAllPositionsTeam))
    setFilteredAllPlayers(filterPlayers(allPlayersWithTeams, showAllPositionsAll))
    setFilteredFavoritePlayers(filterPlayers(favoritePlayers, showAllPositionsFavorites))
  }, [search, teamPlayers, allPlayersWithTeams, favoritePlayers, position, isOpen, sortBy, isReserveSlot, showAllPositionsTeam, showAllPositionsAll, showAllPositionsFavorites, teams])

  const handleToggleShowAllPositions = (tab: 'team' | 'all' | 'favorites') => {
    if (tab === 'team') {
      setShowAllPositionsTeam(!showAllPositionsTeam)
    } else if (tab === 'all') {
      setShowAllPositionsAll(!showAllPositionsAll)
    } else {
      setShowAllPositionsFavorites(!showAllPositionsFavorites)
    }
  }

  const handleTabChange = (tab: 'team' | 'all' | 'favorites') => {
    setActiveTab(tab)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Função para obter a logo do time
  const getTeamLogo = (player: Player) => {
    if (player.team_logo) return player.team_logo
    
    const team = teams.find(t => t.id === player.team_id)
    return team ? team.logo_url : null
  }

  // Função para obter o nome do time
  const getTeamName = (player: Player) => {
    // Primeiro tenta usar o clube do player
    if (player.club && player.club !== 'Sem time') return player.club
    
    // Depois busca pelo team_id
    const team = teams.find(t => t.id === player.team_id)
    return team ? team.name : 'Sem time'
  }

  if (!isOpen) return null

  const currentShowAllPositions = activeTab === 'team' 
    ? showAllPositionsTeam 
    : activeTab === 'all'
    ? showAllPositionsAll
    : showAllPositionsFavorites

  const filterOutSelectedPlayers = (players: Player[]) => {
    return players.filter(player => !selectedPlayers.has(player.id))
  }

  const getPlayersToShow = () => {
    let players: Player[] = []
    let totalPlayers = 0
    let isLoading = false
    
    switch(activeTab) {
      case 'team':
        players = filterOutSelectedPlayers(filteredTeamPlayers)
        totalPlayers = teamPlayers.length
        break
      case 'all':
        players = filterOutSelectedPlayers(filteredAllPlayers)
        totalPlayers = allPlayersWithTeams.length
        isLoading = loadingAllPlayers
        break
      case 'favorites':
        players = filterOutSelectedPlayers(filteredFavoritePlayers)
        totalPlayers = favoritePlayers.length
        isLoading = loadingFavorites
        break
    }
    
    return { players, totalPlayers, isLoading }
  }

  const { players: playersToShow, totalPlayers, isLoading } = getPlayersToShow()
  
  const getTabColor = (tab: 'team' | 'all' | 'favorites') => {
    switch(tab) {
      case 'team': return 'emerald'
      case 'all': return 'cyan'
      case 'favorites': return 'pink'
    }
  }

  const getTabIcon = (tab: 'team' | 'all' | 'favorites') => {
    switch(tab) {
      case 'team': return <Users className="w-4 h-4" />
      case 'all': return <Target className="w-4 h-4" />
      case 'favorites': return <Heart className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl"
      >
        {/* Header Compacto */}
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                {isReserveSlot ? 'Selecionar Reserva' : `Posição: ${position}`}
              </h2>
              <Badge className={cn(
                "text-sm px-2 py-0.5",
                isReserveSlot ? "bg-cyan-600" : getPositionColor(position)
              )}>
                {isReserveSlot ? (
                  <>
                    <UsersIcon className="w-3 h-3 mr-1" />
                    Reserva
                  </>
                ) : (
                  position
                )}
              </Badge>
            </div>
            {selectedPlayers.size > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400">
                {selectedPlayers.size} já selecionado(s)
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filtros e Tabs Compactos */}
        <div className="p-3 border-b border-zinc-700 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <Input
                placeholder={isReserveSlot ? "Buscar jogador..." : `Buscar jogador para ${position}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-800/50 border-zinc-600 h-10 text-sm w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-800/50 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm min-w-[130px] h-10"
              >
                <option value="overall">Overall ↓</option>
                <option value="price">Valor ↓</option>
                <option value="name">Nome A-Z</option>
              </select>
              
              {!isReserveSlot && position && (
                <button
                  onClick={() => handleToggleShowAllPositions(activeTab)}
                  className={cn(
                    "px-3 py-2 rounded-lg border flex items-center gap-1.5 transition-colors h-10",
                    currentShowAllPositions
                      ? "bg-purple-500/20 border-purple-500 text-purple-400"
                      : "bg-zinc-800/50 border-zinc-600 text-zinc-400 hover:bg-zinc-700/50"
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="text-sm whitespace-nowrap">
                    {currentShowAllPositions ? "Apenas Posição" : "Todos"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs Compactos */}
          <div className="flex border-b border-zinc-700">
            {(['team', 'all', 'favorites'] as const).map((tab) => {
              const isActive = activeTab === tab
              const playersCount = tab === 'team' ? filteredTeamPlayers.length : 
                                 tab === 'all' ? filteredAllPlayers.length : 
                                 filteredFavoritePlayers.length
              
              return (
                <button
                  key={tab}
                  className={cn(
                    "flex-1 py-3 px-2 text-center font-medium transition-all flex items-center justify-center gap-2 text-sm",
                    isActive
                      ? tab === 'team'
                        ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/10"
                        : tab === 'all'
                        ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10"
                        : "text-pink-400 border-b-2 border-pink-400 bg-pink-400/10"
                      : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
                  onClick={() => handleTabChange(tab)}
                >
                  {getTabIcon(tab)}
                  <span className="hidden sm:inline">
                    {tab === 'team' ? 'Meu Time' : 
                     tab === 'all' ? 'Todos' : 'Favoritos'}
                  </span>
                  <Badge className={cn(
                    "text-xs h-5 min-w-[20px] flex items-center justify-center",
                    isActive 
                      ? tab === 'team' ? "bg-emerald-600" 
                        : tab === 'all' ? "bg-cyan-600" 
                        : "bg-pink-600"
                      : "bg-zinc-700"
                  )}>
                    {tab === 'favorites' && loadingFavorites ? '...' : 
                     tab === 'all' && loadingAllPlayers ? '...' : 
                     playersCount}
                  </Badge>
                </button>
              )
            })}
          </div>
        </div>

        {/* Área Principal - Cards dos Jogadores */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {isLoading ? (
            <div className="text-center py-16 h-full flex flex-col items-center justify-center">
              <div className={cn(
                "animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4",
                activeTab === 'team' ? "border-emerald-600" :
                activeTab === 'all' ? "border-cyan-600" :
                "border-pink-600"
              )}></div>
              <h3 className="text-lg font-bold text-zinc-400">
                {activeTab === 'all' ? 'Carregando jogadores...' : 'Carregando favoritos...'}
              </h3>
            </div>
          ) : playersToShow.length === 0 ? (
            <div className="text-center py-16 h-full flex flex-col items-center justify-center">
              {activeTab === 'favorites' ? (
                <>
                  <Heart className="w-14 h-14 text-pink-500/30 mb-4" />
                  <h3 className="text-lg font-bold text-zinc-400 mb-2">
                    {search 
                      ? `Nenhum favorito encontrado`
                      : "Nenhum favorito"
                    }
                  </h3>
                </>
              ) : (
                <>
                  <AlertCircle className="w-14 h-14 text-zinc-600 mb-4" />
                  <h3 className="text-lg font-bold text-zinc-400 mb-2">
                    {search 
                      ? `Nenhum jogador encontrado`
                      : "Nenhum jogador disponível"
                    }
                  </h3>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {playersToShow.map(player => {
                const isCompatible = position && (player.position === position || 
                  (player.alternative_positions && player.alternative_positions.includes(position)))
                
                const tabColor = getTabColor(activeTab)
                const bgColorClass = activeTab === 'team' 
                  ? "bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-900/20"
                  : activeTab === 'all'
                  ? "bg-cyan-900/10 border-cyan-500/20 hover:border-cyan-500 hover:bg-cyan-900/20"
                  : "bg-pink-900/10 border-pink-500/20 hover:border-pink-500 hover:bg-pink-900/20"
                
                const teamLogo = getTeamLogo(player)
                const teamName = getTeamName(player)
                
                return (
                  <div
                    key={player.id}
                    onClick={() => {
                      onSelectPlayer(player)
                      onClose()
                    }}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-all hover:scale-[1.02] relative overflow-hidden group cursor-pointer h-full flex flex-col",
                      bgColorClass,
                      !isReserveSlot && position && !isCompatible && !currentShowAllPositions
                        ? "opacity-60 hover:opacity-100"
                        : ""
                    )}
                  >
                    {/* Indicador de incompatibilidade */}
                    {!isReserveSlot && position && !isCompatible && !currentShowAllPositions && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <div className="w-5 h-5 rounded-full bg-red-500/90 flex items-center justify-center">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Indicador de favorito */}
                    {activeTab !== 'favorites' && favoritePlayers.some(fp => fp.id === player.id) && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <div className="w-5 h-5 rounded-full bg-pink-500/90 flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Header do Card - Foto e Overall */}
                    <div className="flex items-start gap-3 mb-2">
                      {/* Foto do jogador */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                          {player.photo_url ? (
                            <img 
                              src={player.photo_url} 
                              alt={player.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center ${
                                    activeTab === 'team' 
                                      ? "bg-gradient-to-br from-emerald-600 to-emerald-800" 
                                      : activeTab === 'all'
                                      ? "bg-gradient-to-br from-cyan-600 to-blue-800"
                                      : "bg-gradient-to-br from-pink-600 to-purple-800"
                                  }">
                                    <span class="text-lg font-bold text-white">${player.position}</span>
                                  </div>
                                `
                              }}
                            />
                          ) : (
                            <div className={cn(
                              "w-full h-full flex items-center justify-center",
                              activeTab === 'team' 
                                ? "bg-gradient-to-br from-emerald-600 to-emerald-800" 
                                : activeTab === 'all'
                                ? "bg-gradient-to-br from-cyan-600 to-blue-800"
                                : "bg-gradient-to-br from-pink-600 to-purple-800"
                            )}>
                              <span className="text-lg font-bold text-white">{player.position}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Badge de Overall */}
                        <div className="absolute -top-1 -right-1 bg-black/90 backdrop-blur px-2 py-1 rounded border border-yellow-500 shadow">
                          <span className="text-sm font-bold text-yellow-400">{player.overall}</span>
                        </div>
                      </div>
                      
                      {/* Nome e Posição */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate mb-1">{player.name}</h3>
                        
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          <Badge className={cn(
                            "text-xs px-2 py-0.5",
                            getPositionColor(player.position)
                          )}>
                            {player.position}
                          </Badge>
                          
                          {player.alternative_positions && player.alternative_positions.length > 0 && (
                            <span className="text-xs text-zinc-400">
                              +{player.alternative_positions.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações Rápidas */}
                    <div className="mb-3 space-y-1.5 flex-1">
                      {/* Logo e nome do time */}
                      <div className="flex items-center gap-2">
                        {teamLogo ? (
                          <div className="w-5 h-5 flex-shrink-0 rounded-full overflow-hidden border border-zinc-600 bg-zinc-800">
                            <img 
                              src={teamLogo} 
                              alt={teamName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-zinc-700">
                                    <Shield class="w-3 h-3 text-zinc-400" />
                                  </div>
                                `
                              }}
                            />
                          </div>
                        ) : (
                          <Shield className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        )}
                        <span className="text-xs text-zinc-300 truncate" title={teamName}>
                          {teamName}
                        </span>
                      </div>
                      
                      {player.age && (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <span className="text-xs text-zinc-300">
                            {player.age} anos
                          </span>
                        </div>
                      )}
                      
                      {player.preferred_foot && (
                        <div className="flex items-center gap-2">
                          <TargetIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <span className="text-xs text-zinc-300">
                            Pé: {player.preferred_foot}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Valor e Estatísticas */}
                    <div className="mt-2 pt-2 border-t border-zinc-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-base font-bold text-emerald-400">
                            R$ {player.base_price.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-[10px] text-zinc-500">Valor</p>
                        </div>
                        
                        {player.playstyle && (
                          <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-[10px] px-2">
                            {player.playstyle}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Botão de seleção compacto */}
                      <Button
                        variant="default"
                        size="sm"
                        className={cn(
                          "w-full text-xs font-medium h-8",
                          activeTab === 'team' 
                            ? "bg-emerald-600 hover:bg-emerald-700" 
                            : activeTab === 'all'
                            ? "bg-cyan-600 hover:bg-cyan-700"
                            : "bg-pink-600 hover:bg-pink-700"
                        )}
                      >
                        {isReserveSlot ? 'Adicionar' : `Selecionar`}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Compacto */}
        <div className="p-3 border-t border-zinc-700 bg-zinc-900/90 backdrop-blur shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-sm text-zinc-500">
              <span className="text-white font-medium">{playersToShow.length}</span> jogadores disponíveis
              {selectedPlayers.size > 0 && (
                <span className="ml-2 text-yellow-400 text-xs">
                  ({selectedPlayers.size} já selecionados)
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSelectPlayer(null)
                  onClose()
                }}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 text-sm"
              >
                Limpar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-zinc-600 hover:bg-zinc-800 h-8 text-sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}