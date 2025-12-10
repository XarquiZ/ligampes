import { Pencil } from 'lucide-react'
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

  return (
    <div
      key={player.id}
      onClick={() => !isTransitioning && onGridClick(player.id)}
      className="group relative bg-zinc-900/90 rounded-xl lg:rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/70 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl lg:hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer"
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
      </div>

      <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
        <h3 className="font-bold text-base lg:text-lg text-center leading-tight line-clamp-2">{player.name}</h3>

        <div className="flex justify-center">
          <Badge className="bg-purple-600 text-white text-xs font-bold px-3 lg:px-4 py-1 lg:py-1.5">{player.position}</Badge>
        </div>

        <p className="text-xs text-zinc-400 text-center">{player.playstyle || 'Nenhum'}</p>

        <div className="flex items-center justify-center gap-2 lg:gap-2.5 mt-1">
          {player.logo_url ? (
            <img
              src={player.logo_url}
              alt={player.club}
              className="w-6 h-6 lg:w-7 lg:h-7 object-contain rounded-full ring-2 ring-zinc-700"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-6 h-6 lg:w-7 lg:h-7 bg-zinc-700 rounded-full" />
          )}

          <p className="text-xs lg:text-sm text-zinc-300 truncate max-w-[120px] lg:max-w-[150px] text-center">{player.club}</p>
        </div>

        <p className="text-center text-lg lg:text-xl font-black text-emerald-400 mt-1 lg:mt-2">
          {formatBasePrice(player.base_price)}
        </p>
      </div>
    </div>
  )
}