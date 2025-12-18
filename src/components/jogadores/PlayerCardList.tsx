import { ChevronDown, Pencil, GitCompare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FavoriteButton } from './FavoriteButton'
import { PlayerBasicInfo } from './PlayerBasicInfo'
import { PlayerAttributes } from './PlayerAttributes'
import { PlayerSkills } from './PlayerSkills'
import { PlayerInspirational } from './PlayerInspirational'
import { Player } from '@/components/jogadores/types'
import { useRouter } from 'next/navigation'
import React from 'react'

interface PlayerCardListProps {
  player: any
  isOpen: boolean
  isTransitioning: boolean
  userRole: string | null
  favoritePlayers: string[]
  onToggle: (playerId: string) => void
  onEditClick: (player: any, e: React.MouseEvent) => void
  onToggleFavorite: (playerId: string, e: React.MouseEvent) => void
  formatBasePrice: (price: number) => string
  renderClubLogo: (url: string | null, name: string) => React.ReactNode
}

export function PlayerCardList({
  player,
  isOpen,
  isTransitioning,
  userRole,
  favoritePlayers,
  onToggle,
  onEditClick,
  onToggleFavorite,
  formatBasePrice,
  renderClubLogo
}: PlayerCardListProps) {
  const router = useRouter()
  const isFavorite = favoritePlayers.includes(player.id)

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Armazenar o jogador selecionado para comparação
    const compareData = {
      comparePlayer: {
        id: player.id,
        name: player.name,
        position: player.position,
        overall: player.overall,
        photo_url: player.photo_url,
        base_price: player.base_price,
        playstyle: player.playstyle,
        nationality: player.nationality,
        age: player.age,
        height: player.height
      },
      timestamp: Date.now(),
      source: 'jogadores_page'
    }
    
    sessionStorage.setItem('comparePlayer1', JSON.stringify(compareData))
    
    // Redirecionar para a página de elenco na seção de comparação
    router.push('/dashboard/elenco?section=comparacao')
  }

  // Handler para lidar com clicks no card
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isTransitioning) {
      onToggle(player.id)
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
      <div className="p-3 sm:p-4 lg:p-6 flex items-start sm:items-center gap-3 sm:gap-4 lg:gap-6">
        {/* Imagem - Responsiva mas mantém proporção */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden ring-2 sm:ring-3 lg:ring-4 ring-purple-500/50 flex-shrink-0">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
              <span className="text-sm sm:text-xl lg:text-2xl font-black text-white">{player.position}</span>
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
                <p className="text-2xl sm:text-3xl lg:text-3xl font-black text-[#fcc600]">
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
                    {player.club}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <div>
                <p className="text-emerald-400 font-bold text-sm sm:text-base lg:text-base whitespace-nowrap">
                  {formatBasePrice(player.base_price)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Botão de Comparação */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCompareClick}
                  className="hover:bg-blue-600/20 p-1.5 h-7 w-7 sm:h-8 sm:w-8 min-w-0 group"
                  title="Comparar jogador"
                >
                  <GitCompare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 group-hover:text-blue-300" />
                </Button>

                {/* Botão de Favorito */}
                <div onClick={(e) => e.stopPropagation()}>
                  <FavoriteButton
                    isFavorite={isFavorite}
                    onClick={(e) => onToggleFavorite(player.id, e)}
                    size="sm"
                    showLabel={false}
                  />
                </div>

                {/* Botão de Edição (admin) */}
                {userRole === 'admin' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleActionClick(e, () => onEditClick(player, e))}
                    className="hover:bg-purple-600/20 p-1.5 h-7 w-7 sm:h-8 sm:w-8 min-w-0"
                  >
                    <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </Button>
                )}

                {/* Seta para expandir */}
                <div
                  className="flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isTransitioning) {
                      onToggle(player.id)
                    }
                  }}
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 transition-transform duration-300 flex-shrink-0 hover:text-purple-400",
                      isOpen && "rotate-180 text-purple-400"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Para desktop: Layout em grid (original) */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-9 gap-3 lg:gap-4 text-xs lg:text-sm items-center">
            {/* Nome e Playstyle */}
            <div className="md:col-span-2">
              <p className="font-bold text-base lg:text-lg leading-tight">{player.name}</p>
              <p className="text-zinc-400 text-xs lg:text-sm mt-1 line-clamp-1">{player.playstyle || 'Nenhum estilo de jogo'}</p>
            </div>
            
            {/* Posição */}
            <div className="flex flex-col">
              <p className="text-zinc-500 text-xs">Posição</p>
              <Badge className="bg-purple-600 text-xs mt-1 w-fit">{player.position}</Badge>
            </div>
            
            {/* Clube */}
            <div className="flex flex-col">
              <p className="text-zinc-500 text-xs">Clube</p>
              <div className="flex items-center gap-2 mt-1">
                {renderClubLogo(player.logo_url, player.club)}
                <span className="text-xs lg:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] lg:max-w-[120px]">
                  {player.club}
                </span>
              </div>
            </div>
            
            {/* Overall */}
            <div className="flex flex-col items-center">
              <p className="text-zinc-500 text-xs">Overall</p>
              <p className="text-2xl lg:text-3xl font-black text-[#fcc600]">
                {player.overall}
              </p>
            </div>
            
            {/* Botão de Comparação */}
            <div className="flex flex-col items-center justify-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCompareClick}
                className="hover:bg-blue-600/20 p-1.5 h-7 w-7 min-w-0 group"
                title="Comparar jogador"
              >
                <GitCompare className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-blue-400 group-hover:text-blue-300" />
              </Button>
              <span className="text-[12px] text-zinc-500 mt-1 hidden lg:block">Comparar</span>
            </div>
            
            {/* Botão de Favorito */}
            <div className="flex flex-col items-center justify-center">
              <FavoriteButton
                isFavorite={isFavorite}
                onClick={(e) => onToggleFavorite(player.id, e)}
                size="md"
                showLabel
              />
            </div>

            {/* Valor Base */}
            <div className="flex flex-col items-end">
              <p className="text-zinc-500 text-right text-xs">Valor Base</p>
              <p className="text-emerald-400 font-bold text-sm lg:text-base whitespace-nowrap leading-tight">
                {formatBasePrice(player.base_price)}
              </p>
            </div>
            
            {/* Botão de Edição e Seta */}
            <div className="flex items-center justify-end gap-2 lg:gap-2" onClick={(e) => e.stopPropagation()}>
              {userRole === 'admin' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleActionClick(e, () => onEditClick(player, e))}
                  className="hover:bg-purple-600/20 p-1.5 h-7 w-7 min-w-0"
                >
                  <Pencil className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                </Button>
              )}

              <div
                className="flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isTransitioning) {
                    onToggle(player.id)
                  }
                }}
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 lg:w-4 lg:h-4 text-zinc-400 transition-transform duration-300 flex-shrink-0 hover:text-purple-400",
                    isOpen && "rotate-180 text-purple-400"
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {isOpen && (
        <div 
          className="border-t border-zinc-800 bg-zinc-900/50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4 lg:space-y-6">
            <PlayerBasicInfo
              age={player.age}
              height={player.height}
              nationality={player.nationality}
              preferred_foot={player.preferred_foot}
              alternative_positions={player.alternative_positions}
            />

            <PlayerAttributes player={player} />

            <PlayerInspirational
              weak_foot_usage={player.weak_foot_usage}
              weak_foot_accuracy={player.weak_foot_accuracy}
              form={player.form}
              injury_resistance={player.injury_resistance}
              inspiring_ball_carry={player.inspiring_ball_carry}
              inspiring_low_pass={player.inspiring_low_pass}
              inspiring_lofted_pass={player.inspiring_lofted_pass}
            />

            <PlayerSkills skills={player.skills} />
          </div>
        </div>
      )}
    </div>
  )
}