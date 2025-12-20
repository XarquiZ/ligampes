import { Pencil, Target, Footprints, Square } from 'lucide-react'
import { StatItem } from '../elenco/StatItem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FavoriteButton } from './FavoriteButton'
import { Player } from '@/components/jogadores/types'

interface PlayerCardGridProps {
  player: any
  isTransitioning: boolean
  userRole: string | null
  favoritePlayers: string[]
  onGridClick: (playerId: string) => void
  onEditClick: (player: any, e: React.MouseEvent) => void
  onToggleFavorite: (playerId: string, e: React.MouseEvent) => void
  formatBasePrice: (price: number) => string
}

export function PlayerCardGrid({
  player,
  isTransitioning,
  userRole,
  favoritePlayers,
  onGridClick,
  onEditClick,
  onToggleFavorite,
  formatBasePrice
}: PlayerCardGridProps) {
  const isFavorite = favoritePlayers.includes(player.id)

  const stats = {
    goals: player.total_goals || 0,
    assists: player.total_assists || 0,
    yellowCards: player.total_yellow_cards || 0,
    redCards: player.total_red_cards || 0,
    averageRating: player.average_rating ? Number(player.average_rating).toFixed(1) : '0.0'
  }

  return (
    <div
      key={player.id}
      onClick={() => !isTransitioning && onGridClick(player.id)}
      className="group relative bg-zinc-900/90 rounded-xl lg:rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/70 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl lg:hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer select-none"
      tabIndex={0}
    >
      <FavoriteButton
        isFavorite={isFavorite}
        onClick={(e) => onToggleFavorite(player.id, e)}
        size="sm"
      />

      {userRole === 'admin' && (
        <button
          onClick={(e) => onEditClick(player, e)}
          className="absolute top-2 lg:top-3 left-2 lg:left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800/90 hover:bg-purple-600 p-1.5 rounded-full backdrop-blur"
        >
          <Pencil className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
        </button>
      )}

      <div className="relative h-32 sm:h-40 lg:h-52 bg-zinc-800">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.name}
            className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
            <span className="text-3xl sm:text-4xl lg:text-6xl font-black text-zinc-500 opacity-70">{player.position}</span>
          </div>
        )}

        <div className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-black/70 backdrop-blur px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5 rounded-lg border border-zinc-700 flex flex-col items-center">
          <span className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-400">{player.overall}</span>
          <span className="text-[8px] lg:text-[10px] text-zinc-300 -mt-1">OVR</span>
        </div>

        <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 bg-black/70 backdrop-blur px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5 rounded-lg border border-zinc-700 flex md:hidden items-center gap-1.5 sm:gap-2">
          {player.logo_url && (
            <img
              src={player.logo_url}
              alt={player.club}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full object-contain"
            />
          )}
          <span className="text-[10px] sm:text-xs lg:text-sm text-white font-medium truncate max-w-[80px] sm:max-w-[100px]">{player.club || 'Sem Time'}</span>
        </div>
      </div>

      <div className="p-2 sm:p-3 lg:p-4 space-y-1.5 sm:space-y-2 lg:space-y-3">
        <h3 className="font-bold text-sm sm:text-base lg:text-lg text-center leading-tight line-clamp-2 min-h-[2.5em]">{player.name}</h3>

        <div className="flex justify-center">
          <Badge className="bg-purple-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-1.5">{player.position}</Badge>
        </div>

        <p className="text-[10px] sm:text-xs text-zinc-400 text-center truncate">{player.playstyle || 'Nenhum'}</p>

        <div className="hidden md:flex items-center justify-center gap-2 mt-1">
          {player.logo_url ? (
            <img
              src={player.logo_url}
              alt={player.club}
              className="w-5 h-5 lg:w-6 lg:h-6 object-contain rounded-full ring-1 ring-zinc-700"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-zinc-700 rounded-full" />
          )}
          <p className="text-xs lg:text-sm text-zinc-300 truncate max-w-[120px] text-center">{player.club}</p>
        </div>

        <div className="grid grid-cols-5 gap-0.5 sm:gap-1 lg:gap-2 py-1.5 sm:py-2 border-y border-zinc-700/50">
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

        <p className="text-center text-lg lg:text-xl font-black text-emerald-400 mt-1 lg:mt-2">
          {formatBasePrice(player.base_price)}
        </p>
      </div>
    </div >
  )
}