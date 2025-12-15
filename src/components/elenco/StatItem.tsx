import React from 'react'
import { cn } from '@/lib/utils'
import { StatItemProps } from './types'

export const StatItem: React.FC<StatItemProps> = ({ 
  icon, 
  value, 
  label 
}) => (
  <div className="flex flex-col items-center justify-center">
    <div className="text-zinc-400 mb-1">{icon}</div>
    <div className={cn(
      "text-xs font-semibold text-center min-h-[16px]",
      value === 0 || value === '0' || value === '0.0' || value === '0' ? "text-zinc-500" : "text-white"
    )}>
      {value === 0 || value === '0' || value === '0.0' || value === '0' ? '0' : value}
    </div>
  </div>
)