import React, { useEffect, useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, AlertCircle, Users, Target, X, Star, TrendingUp, Filter, Shield, Zap, Target as TargetIcon, Users as UsersIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlayerSelectionModalProps, Player, POSITION_MAP } from '../types'

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPlayer, 
  teamPlayers, 
  allPlayers,
  position,
  playerType = 'team',
  isReserveSlot = false,
  selectedPlayers = new Set() // Nova prop com valor padrão
}) => {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'team' | 'all'>(playerType)
  const [filteredTeamPlayers, setFilteredTeamPlayers] = useState<Player[]>([])
  const [filteredAllPlayers, setFilteredAllPlayers] = useState<Player[]>([])
  const [sortBy, setSortBy] = useState<'overall' | 'name' | 'price'>('overall')
  const [showAllPositionsTeam, setShowAllPositionsTeam] = useState(isReserveSlot)
  const [showAllPositionsAll, setShowAllPositionsAll] = useState(isReserveSlot)
  const modalRef = useRef<HTMLDivElement>(null)

  // Cores das posições
  const getPositionColor = (position: string) => {
    if (position === 'GO') return 'bg-yellow-500 border-yellow-400'
    if (['LE', 'ZC', 'LD'].includes(position)) return 'bg-blue-500 border-blue-400'
    if (['VOL', 'MLG', 'MLE', 'MLD', 'MAT'].includes(position)) return 'bg-green-500 border-green-400'
    if (['PTE', 'PTD', 'SA', 'CA'].includes(position)) return 'bg-red-500 border-red-400'
    return 'bg-gray-500 border-gray-400'
  }

  useEffect(() => {
    if (!isOpen) return

    const filterPlayers = (players: Player[], showAllPositions: boolean) => {
      let filtered = [...players]
      
      // Filtro de busca
      if (search) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      // Filtro de posição - apenas se NÃO for reserva e posição não estiver vazia
      if (!isReserveSlot && position && position !== '' && !showAllPositions) {
        filtered = filtered.filter(p => 
          p.position === position || 
          (p.alternative_positions && p.alternative_positions.includes(position))
        )
      }
      
      // Ordenação
      filtered.sort((a, b) => {
        if (sortBy === 'overall') return b.overall - a.overall
        if (sortBy === 'price') return b.base_price - a.base_price
        return a.name.localeCompare(b.name)
      })
      
      return filtered
    }

    // Aplicar filtros separadamente para cada aba
    setFilteredTeamPlayers(filterPlayers(teamPlayers, showAllPositionsTeam))
    setFilteredAllPlayers(filterPlayers(allPlayers, showAllPositionsAll))
  }, [search, teamPlayers, allPlayers, position, isOpen, sortBy, isReserveSlot, showAllPositionsTeam, showAllPositionsAll])

  const handleToggleShowAllPositions = (tab: 'team' | 'all') => {
    if (tab === 'team') {
      setShowAllPositionsTeam(!showAllPositionsTeam)
    } else {
      setShowAllPositionsAll(!showAllPositionsAll)
    }
  }

  const handleTabChange = (tab: 'team' | 'all') => {
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

  if (!isOpen) return null

  // Determinar showAllPositions baseado na aba atual
  const currentShowAllPositions = activeTab === 'team' 
    ? showAllPositionsTeam 
    : showAllPositionsAll

  // Filtrar jogadores que já estão selecionados
  const filterOutSelectedPlayers = (players: Player[]) => {
    return players.filter(player => !selectedPlayers.has(player.id))
  }

  const playersToShow = activeTab === 'team' 
    ? filterOutSelectedPlayers(filteredTeamPlayers)
    : filterOutSelectedPlayers(filteredAllPlayers)
  
  const totalPlayers = activeTab === 'team' 
    ? teamPlayers.length
    : allPlayers.length

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {isReserveSlot ? (
                <>
                  <span>Selecionar Jogador para Reserva</span>
                  <Badge className="bg-cyan-600 text-lg px-3 py-1">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    Reserva
                  </Badge>
                </>
              ) : (
                <>
                  <span>Selecionar Jogador para</span>
                  <Badge className={cn(
                    "text-lg px-3 py-1",
                    getPositionColor(position)
                  )}>
                    {position}
                  </Badge>
                </>
              )}
            </h2>
            <p className="text-zinc-400 mt-1">
              {isReserveSlot 
                ? "Escolha qualquer jogador para o banco de reservas"
                : `Escolha um jogador para a posição ${position}`
              }
            </p>
            {/* Aviso sobre jogadores já selecionados */}
            {selectedPlayers.size > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Badge className="bg-yellow-600 text-xs">
                  {selectedPlayers.size} jogador(es) já selecionado(s)
                </Badge>
                <span className="text-zinc-500 text-xs">
                  (não aparecerão na lista)
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filtros e Tabs */}
        <div className="p-6 space-y-4 border-b border-zinc-700 shrink-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <Input
                placeholder={isReserveSlot ? "Buscar jogador por nome..." : `Buscar jogador para ${position}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 bg-zinc-800/50 border-zinc-600 h-12 text-lg w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-800/50 border border-zinc-600 rounded-lg px-3 py-2 text-white min-w-[150px]"
              >
                <option value="overall">Overall (maior)</option>
                <option value="price">Valor (maior)</option>
                <option value="name">Nome (A-Z)</option>
              </select>
              
              {!isReserveSlot && position && (
                <button
                  onClick={() => handleToggleShowAllPositions(activeTab)}
                  className={cn(
                    "px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors",
                    currentShowAllPositions
                      ? "bg-purple-500/20 border-purple-500 text-purple-400"
                      : "bg-zinc-800/50 border-zinc-600 text-zinc-400 hover:bg-zinc-700/50"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm whitespace-nowrap">
                    {currentShowAllPositions ? "Apenas Posição" : "Todos os Jogadores"}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex border-b border-zinc-700">
            <button
              className={cn(
                "flex-1 py-4 px-4 text-center font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'team'
                  ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/10"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
              onClick={() => handleTabChange('team')}
            >
              <Users className="w-5 h-5" />
              <span>Meu Time</span>
              <Badge className="bg-emerald-600">
                {playersToShow.length}
                {selectedPlayers.size > 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    (disponíveis)
                  </span>
                )}
              </Badge>
            </button>
            <button
              className={cn(
                "flex-1 py-4 px-4 text-center font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'all'
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
              onClick={() => handleTabChange('all')}
            >
              <Target className="w-5 h-5" />
              <span>Todos os Jogadores</span>
              <Badge className="bg-cyan-600">
                {playersToShow.length}
                {selectedPlayers.size > 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    (disponíveis)
                  </span>
                )}
              </Badge>
            </button>
          </div>
        </div>

        {/* Lista de Jogadores */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {playersToShow.length === 0 ? (
            <div className="text-center py-16 h-full flex flex-col items-center justify-center">
              <AlertCircle className="w-16 h-16 text-zinc-600 mb-4" />
              <h3 className="text-xl font-bold text-zinc-400 mb-2">
                {search 
                  ? `Nenhum jogador encontrado para "${search}"`
                  : selectedPlayers.size > 0
                    ? "Todos os jogadores disponíveis já foram selecionados!"
                    : isReserveSlot 
                      ? "Nenhum jogador disponível para reserva"
                      : `Nenhum jogador disponível para a posição ${position}`
                }
              </h3>
              <p className="text-zinc-500 max-w-md mb-4">
                {selectedPlayers.size > 0
                  ? "Remova algum jogador da formação para adicionar novos jogadores."
                  : search 
                    ? "Tente uma busca diferente."
                    : isReserveSlot 
                      ? "Verifique se há jogadores disponíveis no seu time ou em todos os jogadores."
                      : `Não há jogadores compatíveis com a posição ${position} na aba selecionada.`
                }
              </p>
              {selectedPlayers.size > 0 ? (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
              ) : !isReserveSlot && position && !currentShowAllPositions ? (
                <Button
                  variant="outline"
                  onClick={() => handleToggleShowAllPositions(activeTab)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Mostrar todos os jogadores
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setSearch('')}
                  className="border-zinc-600 hover:bg-zinc-800"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {playersToShow.map(player => {
                // Verificar se o jogador é compatível com a posição
                const isCompatible = position && (player.position === position || 
                  (player.alternative_positions && player.alternative_positions.includes(position)))
                
                return (
                  <div
                    key={player.id}
                    onClick={() => {
                      onSelectPlayer(player)
                      onClose()
                    }}
                    className={cn(
                      "text-left p-4 rounded-xl border transition-all hover:scale-[1.02] relative overflow-hidden group cursor-pointer",
                      activeTab === 'team' 
                        ? "bg-zinc-800/30 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-900/20"
                        : "bg-zinc-800/30 border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-900/20",
                      !isReserveSlot && position && !isCompatible && !currentShowAllPositions
                        ? "opacity-50 hover:opacity-100"
                        : ""
                    )}
                  >
                    {/* Background overlay */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      activeTab === 'team' 
                        ? "bg-gradient-to-br from-emerald-900/20 to-transparent" 
                        : "bg-gradient-to-br from-cyan-900/20 to-transparent"
                    )}></div>
                    
                    {/* Indicador de incompatibilidade */}
                    {!isReserveSlot && position && !isCompatible && !currentShowAllPositions && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500/80 text-xs px-2 py-1">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Outra posição
                        </Badge>
                      </div>
                    )}
                    
                    {/* Indicador de disponível */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-500/80 text-xs px-2 py-1">
                        Disponível
                      </Badge>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4">
                        {/* Foto do jogador */}
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                            {player.photo_url ? (
                              <img 
                                src={player.photo_url} 
                                alt={player.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={cn(
                                "w-full h-full flex items-center justify-center",
                                activeTab === 'team' 
                                  ? "bg-gradient-to-br from-emerald-600 to-emerald-800" 
                                  : "bg-gradient-to-br from-cyan-600 to-blue-800"
                              )}>
                                <span className="text-xl font-black text-white">{player.position}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Badge de Overall */}
                          <div className="absolute -top-2 -right-2 bg-black/90 backdrop-blur px-3 py-1 rounded-lg border-2 border-yellow-500 shadow-lg">
                            <span className="text-lg font-bold text-yellow-400">{player.overall}</span>
                          </div>
                          
                          {/* Badge de Posição - APENAS A TAG */}
                          <div className={cn(
                            "absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg border-2 text-xs font-bold text-white whitespace-nowrap",
                            getPositionColor(player.position)
                          )}>
                            {player.position}
                          </div>
                        </div>
                        
                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-lg truncate mb-1">{player.name}</h3>
                          
                          {/* Posição principal e alternativas */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-zinc-400">Posição:</span>
                              <Badge className={cn(
                                "text-xs",
                                getPositionColor(player.position)
                              )}>
                                {player.position}
                              </Badge>
                            </div>
                            
                            {player.alternative_positions && player.alternative_positions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-zinc-400">Também joga:</span>
                                {player.alternative_positions.slice(0, 3).map(pos => (
                                  <Badge 
                                    key={pos}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0.5 border-zinc-600 text-zinc-300"
                                  >
                                    {pos}
                                  </Badge>
                                ))}
                                {player.alternative_positions.length > 3 && (
                                  <span className="text-xs text-zinc-500">+{player.alternative_positions.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Informações rápidas */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3 text-zinc-500" />
                              <span className="text-xs text-zinc-400">Clube:</span>
                              <span className="text-xs font-medium text-white truncate">
                                {player.club || 'Sem time'}
                              </span>
                            </div>
                            
                            {player.age && (
                              <div className="flex items-center gap-2">
                                <Zap className="w-3 h-3 text-zinc-500" />
                                <span className="text-xs text-zinc-400">Idade:</span>
                                <span className="text-xs font-medium text-white">
                                  {player.age} anos
                                </span>
                              </div>
                            )}

                            {player.preferred_foot && (
                              <div className="flex items-center gap-2">
                                <TargetIcon className="w-3 h-3 text-zinc-500" />
                                <span className="text-xs text-zinc-400">Pé:</span>
                                <span className="text-xs font-medium text-white">
                                  {player.preferred_foot}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Valor e Estatísticas */}
                      <div className="mt-4 pt-4 border-t border-zinc-700/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold text-emerald-400">
                              R$ {player.base_price.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-zinc-500">Valor de mercado</p>
                          </div>
                          
                          {player.playstyle && (
                            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                              <Star className="w-3 h-3 mr-1" />
                              <span className="text-xs">{player.playstyle}</span>
                            </Badge>
                          )}
                        </div>
                        
                        {/* Estatísticas extras */}
                        {(player.average_rating > 0 || player.total_matches > 0) && (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
                            {player.average_rating > 0 && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-yellow-500" />
                                <div>
                                  <span className="text-xs text-zinc-400">Média:</span>
                                  <span className="text-yellow-400 font-medium ml-1">{player.average_rating.toFixed(1)}</span>
                                </div>
                              </div>
                            )}
                            
                            {player.total_matches > 0 && (
                              <div className="text-xs text-zinc-400">
                                {player.total_matches} jogos
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Botão de seleção */}
                      <div className="mt-4 pt-4 border-t border-zinc-700/50">
                        <Button
                          variant="default"
                          className={cn(
                            "w-full text-sm font-medium",
                            activeTab === 'team' 
                              ? "bg-emerald-600 hover:bg-emerald-700" 
                              : "bg-cyan-600 hover:bg-cyan-700"
                          )}
                        >
                          {isReserveSlot ? 'Adicionar como Reserva' : `Selecionar para ${position}`}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 bg-zinc-900/90 backdrop-blur shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-500">
                Mostrando <span className="text-white font-medium">{playersToShow.length}</span> jogadores disponíveis
                {selectedPlayers.size > 0 && (
                  <span className="ml-2">
                    (<span className="text-yellow-400">{selectedPlayers.size}</span> já selecionados)
                  </span>
                )}
              </div>
              
              {/* Legenda de posições */}
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-zinc-500">Goleiro</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-zinc-500">Defesa</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-zinc-500">Meio</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-zinc-500">Ataque</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onSelectPlayer(null)
                  onClose()
                }}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Limpar Posição
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-zinc-600 hover:bg-zinc-800"
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