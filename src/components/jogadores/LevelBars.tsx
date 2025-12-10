import { cn } from '@/lib/utils'

interface LevelBarsProps {
  value?: number | null
  max?: number
  size?: 'sm' | 'md'
}

export function LevelBars({ value = 0, max = 3, size = 'sm' }: LevelBarsProps) {
  const v = Math.max(0, Math.min(max, value ?? 0))
  const w = size === 'sm' ? 'w-4 h-2' : 'w-6 h-2.5'
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const active = i < v
        return (
          <div
            key={i}
            className={cn(
              `${w} rounded-sm transition-all`,
              active ? 'bg-yellow-400 shadow-sm' : 'bg-zinc-700/80'
            )}
          />
        )
      })}
    </div>
  )
}