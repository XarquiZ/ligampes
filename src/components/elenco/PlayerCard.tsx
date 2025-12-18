import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlayerCardProps } from './types'
import { Target, Footprints, Square, Pencil, DollarSign, X, MessageCircle, Trash2 } from 'lucide-react'
import { StatItem } from './StatItem'

// Função para formatar o preço
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

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  showProposeButton = false,
  activeSection,
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
    averageRating: player.average_rating ? Number(player.average_rating).toFixed(1) : '0.0'
  }

  const handleCardClick = () => {
    onCardClick(player)
  }

  const formattedPrice = formatPrice(Number(player.base_price))

  return (
    <div 
      className="group relative bg-zinc-900/90 rounded-xl lg:rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/70 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl lg:hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer select-none"
      onClick={handleCardClick}
      onMouseDown={(e) => e.preventDefault()}
      tabIndex={0}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {activeSection === 'favoritos' && onRemoveFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemoveFavorite(player)
          }}
          className="absolute top-2 lg:top-3 right-2 lg:right-3 z-20 bg-black/70 backdrop-blur p-1.5 rounded-full border border-zinc-700 hover:bg-red-600/20 transition-all"
          title="Remover dos favoritos"
        >
          <Trash2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-red-400" />
        </button>
      )}

      <div className="relative h-40 lg:h-52 bg-zinc-800">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.name}
            className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
            <span className="text-4xl lg:text-6xl font-black text-zinc-500 opacity-70">{player.position}</span>
          </div>
        )}

        <div className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-black/70 backdrop-blur px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-zinc-700 flex flex-col items-center">
          <span className="text-2xl lg:text-3xl font-black text-yellow-400">{player.overall}</span>
          <span className="text-[8px] lg:text-[10px] text-zinc-300 -mt-1">OVR</span>
        </div>

        {activeSection === 'favoritos' && player.club && (
          <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 bg-black/70 backdrop-blur px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-zinc-700 flex items-center gap-2">
            {player.logo_url && (
              <img 
                src={player.logo_url} 
                alt={player.club}
                className="w-4 h-4 lg:w-5 lg:h-5 rounded-full object-contain"
              />
            )}
            <span className="text-xs lg:text-sm text-white font-medium">{player.club}</span>
          </div>
        )}
      </div>

      <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
        <h3 className="font-bold text-base lg:text-lg text-center leading-tight line-clamp-2">{player.name}</h3>

        <div className="flex justify-center">
          <Badge className="bg-purple-600 text-white text-xs font-bold px-3 lg:px-4 py-1 lg:py-1.5">
            {player.position}
          </Badge>
        </div>

        <p className="text-xs text-zinc-400 text-center">{player.playstyle || 'Nenhum'}</p>

        <div className="grid grid-cols-5 gap-1 lg:gap-2 py-2 border-y border-zinc-700/50">
          <StatItem
            icon={<Target className="w-3 h-3 lg:w-4 lg:h-4" />}
            value={stats.goals}
            label="Gols"
            highlight={stats.goals > 0}
          />
          <StatItem
            icon={<Footprints className="w-3 h-3 lg:w-4 lg:h-4" />}
            value={stats.assists}
            label="Assist"
            highlight={stats.assists > 0}
          />
          <StatItem
            icon={<Square className="w-3 h-3 lg:w-4 lg:h-4" style={{ color: '#FFD700' }} />}
            value={stats.yellowCards}
            label="Amarelos"
            warning={stats.yellowCards > 2}
          />
          <StatItem
            icon={<Square className="w-3 h-3 lg:w-4 lg:h-4" style={{ color: '#FF4444' }} />}
            value={stats.redCards}
            label="Vermelhos"
            danger={stats.redCards > 0}
          />
          <StatItem
            icon={<Pencil className="w-3 h-3 lg:w-4 lg:h-4" />}
            value={stats.averageRating}
            label="Nota"
            highlight={parseFloat(stats.averageRating) >= 7.0}
          />
        </div>

        {player.total_matches > 0 && (
          <div className="text-center text-xs text-zinc-500">
            {player.total_matches} jogo{player.total_matches !== 1 ? 's' : ''}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-center text-lg lg:text-xl font-black text-emerald-400">
            {formattedPrice}
          </p>
          
          <div className="flex gap-2 w-full">
            {activeSection === 'favoritos' && showProposeButton && onShareClick ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onShareClick(player)
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-7 lg:h-8 min-w-0 px-2"
                size="sm"
              >
                <MessageCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 mr-1" />
                Propor
              </Button>
            ) : (
              <>
                {onSellClick && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSellClick(player)
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 lg:h-8 min-w-0 px-2"
                    size="sm"
                  >
                    <DollarSign className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </Button>
                )}
                
                {player.overall <= 74 && onDismissClick && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDismissClick(player)
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-7 lg:h-8 min-w-0 px-2"
                    size="sm"
                  >
                    <X className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}