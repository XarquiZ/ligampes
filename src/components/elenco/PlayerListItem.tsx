import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PlayerListItemProps } from './types'
import { DollarSign, X, MessageCircle, Trash2, ChevronDown, Ruler, Star } from 'lucide-react'
import { LevelBars } from './LevelBars'

// Função para formatar o preço (mesma do PlayerCard)
const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    const valueInMillions = price / 1000000
    if (valueInMillions % 1 === 0) {
      return `R$ ${valueInMillions.toFixed(0)}M`
    }
    if (valueInMillions < 10) {
      return `R$ ${valueInMillions.toFixed(1)}M`
    }
    return `R$ ${Math.round(valueInMillions)}M`
  } else if (price >= 1000) {
    const valueInThousands = price / 1000
    if (valueInThousands % 1 === 0) {
      return `R$ ${valueInThousands.toFixed(0)}K`
    }
    return `R$ ${valueInThousands.toFixed(1)}K`
  }
  return `R$ ${price}`
}

export const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  isOpen,
  activeSection,
  onToggle,
  onSellClick,
  onDismissClick,
  onShareClick,
  onRemoveFavorite,
  onCardClick
}) => {
  const stats = {
    goals: player.total_goals || 0,
    assists: player.total_assists || 0,
    yellowCards: player.total_yellow_cards || 0,
    redCards: player.total_red_cards || 0,
    averageRating: player.average_rating ? player.average_rating.toFixed(1) : '0.0'
  }

  const getAttrColorHex = (value: number) => {
    if (value >= 95) return '#4FC3F7'
    if (value >= 85) return '#00FF00'
    if (value >= 75) return '#FFFF00'
    return '#E53935'
  }

  const formatHeight = (height: number | null | undefined) => {
    if (height === null || height === undefined) return '-'
    return `${height}cm`
  }

  const renderClubLogo = (url: string | null, name: string) => 
    url ? <img src={url} alt={name} className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded-full ring-1 sm:ring-2 ring-zinc-700" onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'} /> : null

  const attributes = [
    { k: 'offensive_talent', l: 'Tal. Ofensivo' },
    { k: 'ball_control', l: 'Controle de bola' },
    { k: 'dribbling', l: 'Drible' },
    { k: 'tight_possession', l: 'Condução Firme' },
    { k: 'low_pass', l: 'Passe rasteiro' },
    { k: 'lofted_pass', l: 'Passe Alto' },
    { k: 'finishing', l: 'Finalização' },
    { k: 'heading', l: 'Cabeceio' },
    { k: 'place_kicking', l: 'Chute colocado' },
    { k: 'curl', l: 'Curva' },
    { k: 'speed', l: 'Velocidade' },
    { k: 'acceleration', l: 'Aceleração' },
    { k: 'kicking_power', l: 'Força do chute' },
    { k: 'jump', l: 'Impulsão' },
    { k: 'physical_contact', l: 'Contato Físico' },
    { k: 'balance', l: 'Equilíbrio' },
    { k: 'stamina', l: 'Resistência' },
    { k: 'defensive_awareness', l: 'Talento defensivo' },
    { k: 'ball_winning', l: 'Desarme' },
    { k: 'aggression', l: 'Agressividade' },
    { k: 'gk_awareness', l: 'Talento de GO' },
    { k: 'gk_catching', l: 'Firmeza de GO' },
    { k: 'gk_clearing', l: 'Afast. de bola de GO' },
    { k: 'gk_reflexes', l: 'Reflexos de GO' },
    { k: 'gk_reach', l: 'Alcance de GO' },
  ]

  // Formatar o preço
  const formattedPrice = formatPrice(Number(player.base_price))

  // Handler para lidar com clicks no card
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeSection === 'elenco') {
      onToggle()
    } else {
      onCardClick()
    }
  }

  // Handler para botões de ação (para evitar propagação)
  const handleActionClick = (e: React.MouseEvent, callback?: () => void) => {
    e.stopPropagation()
    callback?.()
  }

  return (
    <div
      id={`player-${player.id}`}
      className="bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-xl lg:rounded-2xl overflow-hidden transition-all hover:border-purple-500/70 hover:shadow-lg lg:hover:shadow-xl hover:shadow-purple-600/20 cursor-pointer select-none"
      onClick={handleCardClick}
    >
      {/* Layout ÚNICO com breakpoints */}
      <div className="p-3 sm:p-4 lg:p-6 flex items-start sm:items-center gap-3 sm:gap-4 lg:gap-8">
        {/* Imagem - Responsiva mas mantém proporção */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 rounded-full overflow-hidden ring-2 sm:ring-3 lg:ring-4 ring-purple-500/50 flex-shrink-0">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
              <span className="text-sm sm:text-xl lg:text-3xl font-black text-white">{player.position}</span>
            </div>
          )}
        </div>

        {/* Conteúdo principal - Layout responsivo */}
        <div className="flex-1">
          {/* Para mobile: Layout empilhado */}
          <div className="md:hidden">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base lg:text-lg truncate">{player.name}</p>
                <p className="text-zinc-400 text-xs sm:text-sm lg:text-sm mt-0.5 truncate">{player.playstyle || 'Nenhum estilo de jogo'}</p>
              </div>
              <div className="ml-2 text-right">
                <p className="text-2xl sm:text-3xl lg:text-5xl font-black bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
                  {player.overall}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-zinc-500 text-xs">Posição</p>
                <div className="mt-0.5">
                  <Badge className="bg-purple-600 text-xs px-2 py-0.5">{player.position}</Badge>
                </div>
              </div>
              
              <div>
                <p className="text-zinc-500 text-xs">Clube</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {renderClubLogo(player.logo_url, player.club)}
                  <span className="text-xs truncate">
                    {activeSection === 'favoritos' ? (player.club || 'Sem time') : (player.club || '-')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <div>
                <p className="text-emerald-400 font-bold text-sm sm:text-base lg:text-lg">
                  {formattedPrice}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                {activeSection === 'favoritos' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={(e) => handleActionClick(e, () => onShareClick?.(player))}
                      className="bg-green-600 hover:bg-green-700 text-white h-7 sm:h-8 lg:h-9 px-2 sm:px-3 lg:px-4 flex items-center justify-center"
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 mr-1" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Propor</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleActionClick(e, () => onRemoveFavorite?.(player))}
                      className="bg-red-600 hover:bg-red-700 text-white h-7 sm:h-8 lg:h-9 w-7 sm:w-8 lg:w-9 p-0 flex items-center justify-center"
                      title="Remover dos favoritos"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={(e) => handleActionClick(e, () => onSellClick?.(player))}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-7 sm:h-8 lg:h-9 w-7 sm:w-8 lg:w-9 p-0 flex items-center justify-center"
                      title="Negociar"
                    >
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4" />
                    </Button>

                    {player.overall <= 74 && (
                      <Button
                        size="sm"
                        onClick={(e) => handleActionClick(e, () => onDismissClick?.(player))}
                        className="bg-red-600 hover:bg-red-700 text-white h-7 sm:h-8 lg:h-9 w-7 sm:w-8 lg:w-9 p-0 flex items-center justify-center"
                        title="Dispensar"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4" />
                      </Button>
                    )}

                    <div
                      className="flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle()
                      }}
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-zinc-400 transition-transform duration-300 flex-shrink-0 hover:text-purple-400",
                          isOpen && "rotate-180 text-purple-400"
                        )}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Para desktop: Layout em grid (original) com ajustes de alinhamento */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-6 gap-3 lg:gap-4 text-xs lg:text-sm items-start">
            {/* Nome e Playstyle */}
            <div className="flex flex-col">
              <p className="font-bold text-base lg:text-lg mb-1">{player.name}</p>
              <p className="text-zinc-400 text-xs lg:text-sm line-clamp-1">{player.playstyle || 'Nenhum estilo de jogo'}</p>
            </div>
            
            {/* Posição */}
            <div className="flex flex-col">
              <p className="text-zinc-500 mb-1">Posição</p>
              <div className="flex items-center mt-2">
                <Badge className="bg-purple-600 text-xs w-fit">{player.position}</Badge>
              </div>
            </div>
            
            {/* Clube - MAIS ESPAÇO */}
            <div className="flex flex-col">
              <p className="text-zinc-500 mb-1">Clube</p>
              <div className="flex items-center gap-2 min-w-0 mt-1">
                {renderClubLogo(player.logo_url, player.club)}
                <span className="text-xs lg:text-sm truncate min-w-0">
                  {activeSection === 'favoritos' ? (player.club || 'Sem time') : player.club}
                </span>
              </div>
            </div>
            
            {/* Overall */}
            <div className="flex flex-col items-end">
              <p className="text-zinc-500 mb-1">Overall</p>
              <p className="text-3xl lg:text-5xl font-black text-[#fcc600] leading-none">
                {player.overall}
              </p>
            </div>
            
            {/* Valor Base */}
            <div className="flex flex-col items-end">
              <p className="text-zinc-500 mb-1">Valor Base</p>
              <p className="text-emerald-400 font-bold text-sm lg:text-lg whitespace-nowrap">
                {formattedPrice}
              </p>
            </div>
            
            {/* Botões */}
            <div className="flex flex-col justify-center items-end">
              <div className="flex items-center gap-2 lg:gap-3" onClick={(e) => e.stopPropagation()}>
                {activeSection === 'favoritos' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={(e) => handleActionClick(e, () => onShareClick?.(player))}
                      className="bg-green-600 hover:bg-green-700 text-white h-8 lg:h-9 px-3 lg:px-4 flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-1 lg:mr-2" />
                      <span className="hidden lg:inline">Propor</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleActionClick(e, () => onRemoveFavorite?.(player))}
                      className="bg-red-600 hover:bg-red-700 text-white h-8 lg:h-9 w-8 lg:w-9 p-0 flex items-center justify-center"
                      title="Remover dos favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={(e) => handleActionClick(e, () => onSellClick?.(player))}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 lg:h-9 w-8 lg:w-9 p-0 flex items-center justify-center"
                      title="Negociar"
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>

                    {player.overall <= 74 && (
                      <Button
                        size="sm"
                        onClick={(e) => handleActionClick(e, () => onDismissClick?.(player))}
                        className="bg-red-600 hover:bg-red-700 text-white h-8 lg:h-9 w-8 lg:w-9 p-0 flex items-center justify-center"
                        title="Dispensar"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    <div
                      className="flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle()
                      }}
                    >
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 lg:w-6 lg:h-6 text-zinc-400 transition-transform duration-300 flex-shrink-0 hover:text-purple-400",
                          isOpen && "rotate-180 text-purple-400"
                        )}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && activeSection === 'elenco' && (
        <div 
          className="border-t border-zinc-800 bg-zinc-900/50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-zinc-500">Idade:</span> <strong>{player.age ?? '-'}</strong>
              </div>
              <div>
                <span className="text-zinc-500 flex items-center gap-1.5 sm:gap-2">
                  <Ruler className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span>Altura:</span> <strong className="ml-1 lg:ml-2">{formatHeight(player.height)}</strong>
                </span> 
              </div>
              <div>
                <span className="text-zinc-500">Nacionalidade:</span> <strong>{player.nationality}</strong>
              </div>
              <div>
                <span className="text-zinc-500">Pé:</span> <strong>{player.preferred_foot}</strong>
              </div>
            </div>

            <div>
              <p className="text-zinc-500 font-medium mb-2 lg:mb-3 text-sm lg:text-base">Estatísticas da Temporada:</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                <div><span className="text-zinc-500">Gols:</span> <strong>{stats.goals}</strong></div>
                <div><span className="text-zinc-500">Assistências:</span> <strong>{stats.assists}</strong></div>
                <div><span className="text-zinc-500">Partidas:</span> <strong>{player.total_matches || 0}</strong></div>
                <div><span className="text-zinc-500">Cartões Amarelos:</span> <strong>{stats.yellowCards}</strong></div>
                <div><span className="text-zinc-500">Cartões Vermelhos:</span> <strong>{stats.redCards}</strong></div>
                <div><span className="text-zinc-500">Nota Média:</span> <strong>{stats.averageRating}</strong></div>
              </div>
            </div>

            {player.alternative_positions && player.alternative_positions.length > 0 && (
              <div>
                <p className="text-zinc-500 font-medium mb-2">Posições Alternativas:</p>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {player.alternative_positions.map(p => (
                    <Badge key={p} className="bg-red-600/20 text-red-300 border-red-600/40 text-xs px-2 py-0.5">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-3 sm:gap-x-4 lg:gap-x-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 text-xs">
              {attributes.map(({ k, l }) => {
                const value = (player as any)[k] as number | null
                const display = (value ?? 40)
                const color = getAttrColorHex(display)
                return (
                  <div key={k} className="text-center">
                    <p className="text-zinc-500 font-medium text-xs">{l}</p>
                    <p className="text-base sm:text-lg lg:text-xl font-black" style={{ color }}>{display}</p>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm items-center">
              <div>
                <p className="text-zinc-500">Pé Fraco (Uso)</p>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                  <LevelBars value={player.weak_foot_usage ?? 0} max={4} size="sm" />
                  <span className="font-bold">{player.weak_foot_usage ?? '-'}</span>
                </div>
              </div>

              <div>
                <p className="text-zinc-500">Pé Fraco (Precisão)</p>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                  <LevelBars value={player.weak_foot_accuracy ?? 0} max={4} size="sm" />
                  <span className="font-bold">{player.weak_foot_accuracy ?? '-'}</span>
                </div>
              </div>

              <div>
                <p className="text-zinc-500">Forma Física</p>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                  <LevelBars value={player.form ?? 0} max={8} size="md" />
                  <span className="font-bold">{player.form ?? '-'}</span>
                </div>
              </div>

              <div>
                <p className="text-zinc-500">Resistência a Lesão</p>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                  <LevelBars value={player.injury_resistance ?? 0} max={3} size="sm" />
                  <span className="font-bold">{player.injury_resistance ?? '-'}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-zinc-500 font-medium mb-2">Inspirador</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
                <div className="text-xs sm:text-sm">
                  <div className="text-zinc-400">Carregando</div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 2 }).map((_, idx) => {
                      const filled = (player.inspiring_ball_carry ?? 0) > idx
                      return <Star key={idx} className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                    })}
                  </div>
                </div>

                <div className="text-xs sm:text-sm">
                  <div className="text-zinc-400">Passe Rasteiro</div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 2 }).map((_, idx) => {
                      const filled = (player.inspiring_low_pass ?? 0) > idx
                      return <Star key={idx} className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                    })}
                  </div>
                </div>

                <div className="text-xs sm:text-sm">
                  <div className="text-zinc-400">Passe Alto</div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 2 }).map((_, idx) => {
                      const filled = (player.inspiring_lofted_pass ?? 0) > idx
                      return <Star key={idx} className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                    })}
                  </div>
                </div>
              </div>
            </div>

            {player.skills && player.skills.length > 0 && (
              <div>
                <p className="text-zinc-400 font-medium mb-2">Habilidades Especiais</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {player.skills.map(s => (
                    <Badge key={s} className="bg-purple-600/20 text-purple-300 border-purple-600/40 text-xs px-2 py-0.5">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}