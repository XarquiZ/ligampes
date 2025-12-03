'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SaldoUpdateIndicatorProps {
  lastUpdate?: number
  lastSaldoUpdate?: Date | number | null
  className?: string
}

export function SaldoUpdateIndicator({ 
  lastUpdate, 
  lastSaldoUpdate,
  className 
}: SaldoUpdateIndicatorProps) {
  const [now, setNow] = useState(Date.now())
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Usar lastSaldoUpdate se disponível, senão usar lastUpdate
  const updateTime = lastSaldoUpdate 
    ? (typeof lastSaldoUpdate === 'number' ? lastSaldoUpdate : lastSaldoUpdate.getTime())
    : lastUpdate || Date.now()
  
  const secondsAgo = Math.floor((now - updateTime) / 1000)
  const isRecent = secondsAgo < 2
  const isStale = secondsAgo > 10
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full animate-pulse",
        isRecent ? 'bg-green-500' : 
        isStale ? 'bg-red-500' : 
        'bg-yellow-500'
      )} />
      <span className={cn(
        "text-xs",
        isRecent ? 'text-green-400' : 
        isStale ? 'text-red-400' : 
        'text-yellow-400'
      )}>
        {isRecent ? 'Agora' : `${secondsAgo}s atrás`}
      </span>
    </div>
  )
}