'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft, Tag, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewSwitchProps {
  activeView: 'transferencias' | 'mercado'
  setActiveView: (view: 'transferencias' | 'mercado') => void
}

const viewConfig = {
  transferencias: {
    label: 'Transferências',
    icon: ArrowRightLeft,
    color: 'purple-600',
    shadow: 'shadow-purple-600/20'
  },
  mercado: {
    label: 'Mercado',
    icon: Tag,
    color: 'green-600',
    shadow: 'shadow-green-600/20'
  }
}

export default function ViewSwitch({ activeView, setActiveView }: ViewSwitchProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const ActiveIcon = viewConfig[activeView].icon
  const activeConfig = viewConfig[activeView]

  return (
    <div className="relative w-full max-w-xs sm:max-w-none sm:w-fit mx-auto mb-6">
      {/* Mobile Dropdown (below 768px) */}
      <div className="sm:hidden">
        <Button
          variant="default"
          size="lg"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full justify-between rounded-xl bg-zinc-900/70 border border-zinc-700',
            `bg-${activeConfig.color}`,
            activeConfig.shadow
          )}
        >
          <div className="flex items-center">
            <ActiveIcon className="w-5 h-5 mr-3" />
            <span className="font-bold">{activeConfig.label}</span>
          </div>
          <ChevronDown className={cn(
            'w-5 h-5 transition-transform',
            isOpen && 'transform rotate-180'
          )} />
        </Button>
        
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg overflow-hidden">
              {Object.entries(viewConfig).map(([key, config]) => {
                if (key === activeView) return null
                
                const Icon = config.icon
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setActiveView(key as 'transferencias' | 'mercado')
                      setIsOpen(false)
                    }}
                    className="w-full justify-start rounded-none border-b border-zinc-700 last:border-b-0 hover:bg-zinc-800"
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-bold">{config.label}</span>
                  </Button>
                )
              })}
            </div>
          </>
        )}
      </div>
      
      {/* Desktop View (768px and above) */}
      <div className="hidden sm:flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700 w-fit">
        {Object.entries(viewConfig).map(([key, config]) => {
          const Icon = config.icon
          return (
            <Button
              key={key}
              variant={activeView === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView(key as 'transferencias' | 'mercado')}
              className={cn(
                'rounded-lg text-xs font-bold px-4 py-2 transition-all',
                activeView === key && `bg-${config.color} ${config.shadow} text-white`
              )}
            >
              <Icon className="w-4 h-4 mr-2" />
              {config.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}