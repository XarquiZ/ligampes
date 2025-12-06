import React from 'react'
import { cn } from '@/lib/utils'
import { LevelBarsProps } from './types'

export const LevelBars: React.FC<LevelBarsProps> = ({ 
  value = 0, 
  max = 3, 
  size = 'sm' 
}) => {
  const v = Math.max(0, Math.min(max, value ?? 0))
  
  const getBarWidth = () => {
    if (max === 8) return 'w-2 h-2'
    return size === 'sm' ? 'w-4 h-2' : 'w-6 h-2.5'
  }
  
  const barWidth = getBarWidth()
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const active = i < v
        return (
          <div
            key={i}
            className={cn(
              `${barWidth} rounded-sm transition-all`,
              active ? 'bg-yellow-400 shadow-sm' : 'bg-zinc-700/80'
            )}
          />
        )
      })}
    </div>
  )
}