import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  isFavorite: boolean
  onClick: (e: React.MouseEvent) => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function FavoriteButton({ 
  isFavorite, 
  onClick, 
  size = 'md',
  showLabel = false 
}: FavoriteButtonProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={onClick}
        className={cn(
          "bg-black/70 backdrop-blur rounded-full border border-zinc-700 hover:bg-pink-600/20 transition-all",
          size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : 'p-2'
        )}
      >
        <Star 
          className={cn(
            sizeClasses[size],
            "transition-all",
            isFavorite 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-zinc-400 hover:text-yellow-400"
          )} 
        />
      </button>
      {showLabel && (
        <span className="text-xs text-zinc-500 text-center mt-1">
          {isFavorite ? 'Favorito' : 'Favoritar'}
        </span>
      )}
    </div>
  )
}