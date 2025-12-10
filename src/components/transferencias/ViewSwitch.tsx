'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRightLeft, Tag } from 'lucide-react'

interface ViewSwitchProps {
  activeView: 'transferencias' | 'mercado'
  setActiveView: (view: 'transferencias' | 'mercado') => void
}

export default function ViewSwitch({ activeView, setActiveView }: ViewSwitchProps) {
  return (
    <div className="flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700 w-fit mx-auto mb-6">
      <Button
        variant={activeView === 'transferencias' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('transferencias')}
        className={cn(
          'rounded-lg text-sm font-bold px-6 py-2 transition-all',
          activeView === 'transferencias' && 'bg-purple-600 shadow-lg shadow-purple-600/20 text-white'
        )}
      >
        <ArrowRightLeft className="w-4 h-4 mr-2" />
        Transferências
      </Button>
      <Button
        variant={activeView === 'mercado' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('mercado')}
        className={cn(
          'rounded-lg text-sm font-bold px-6 py-2 transition-all',
          activeView === 'mercado' && 'bg-green-600 shadow-lg shadow-green-600/20 text-white'
        )}
      >
        <Tag className="w-4 h-4 mr-2" />
        Mercado
      </Button>
    </div>
  )
}