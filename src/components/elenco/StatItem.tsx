import React from 'react'
import { cn } from '@/lib/utils'
import { StatItemProps } from './types'

export const StatItem: React.FC<StatItemProps> = ({
  icon,
  value,
  label,
  highlight,
  warning,
  danger
}) => {
  const isZero = value === 0 || value === '0' || value === '0.0' || value === '0'

  let valueColor = "text-white"
  if (isZero) valueColor = "text-zinc-500"
  else if (highlight) valueColor = "text-emerald-400"
  else if (warning) valueColor = "text-yellow-400"
  else if (danger) valueColor = "text-red-400"

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-zinc-400 mb-1">{icon}</div>
      <div className={cn(
        "text-xs font-semibold text-center min-h-[16px]",
        valueColor
      )}>
        {isZero ? '0' : value}
      </div>
    </div>
  )
}