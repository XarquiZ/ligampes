import React from 'react'
import { Button } from '@/components/ui/button'
import { Users, Heart, GitCompare, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionSwitchProps } from './types'

export const SectionSwitch: React.FC<SectionSwitchProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  return (
    <div className="flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700 w-fit mx-auto mb-6">
      <Button
        variant={activeSection === 'elenco' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSectionChange('elenco')}
        className={cn(
          'rounded-lg text-xs font-bold px-4 py-2 transition-all',
          activeSection === 'elenco' && 'bg-purple-600 shadow-lg shadow-purple-600/20'
        )}
      >
        <Users className="w-4 h-4 mr-2" />
        Elenco
      </Button>
      <Button
        variant={activeSection === 'favoritos' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSectionChange('favoritos')}
        className={cn(
          'rounded-lg text-xs font-bold px-4 py-2 transition-all',
          activeSection === 'favoritos' && 'bg-pink-600 shadow-lg shadow-pink-600/20'
        )}
      >
        <Heart className="w-4 h-4 mr-2" />
        Favoritos
      </Button>
      <Button
        variant={activeSection === 'comparacao' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSectionChange('comparacao')}
        className={cn(
          'rounded-lg text-xs font-bold px-4 py-2 transition-all',
          activeSection === 'comparacao' && 'bg-blue-600 shadow-lg shadow-blue-600/20'
        )}
      >
        <GitCompare className="w-4 h-4 mr-2" />
        Comparação
      </Button>
      <Button
        variant={activeSection === 'planejador' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSectionChange('planejador')}
        className={cn(
          'rounded-lg text-xs font-bold px-4 py-2 transition-all',
          activeSection === 'planejador' && 'bg-emerald-600 shadow-lg shadow-emerald-600/20'
        )}
      >
        <ClipboardList className="w-4 h-4 mr-2" />
        Planejador
      </Button>
    </div>
  )
}