// components/elenco/modals/PositionSelectionModal.tsx
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Player, POSITION_MAP, POSITIONS } from '../types'

interface PositionSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPosition: (position: string) => void
  currentPosition: string
  player: Player
}

export const PositionSelectionModal: React.FC<PositionSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPosition,
  currentPosition,
  player
}) => {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isOpen) return null

  const getPositionColor = (position: string) => {
    if (position === 'GO') return 'bg-yellow-500 border-yellow-400'
    if (['LE', 'ZC', 'LD'].includes(position)) return 'bg-blue-500 border-blue-400'
    if (['VOL', 'MLG', 'MLE', 'MLD', 'MAT'].includes(position)) return 'bg-green-500 border-green-400'
    if (['PTE', 'PTD', 'SA', 'CA'].includes(position)) return 'bg-red-500 border-red-400'
    return 'bg-gray-500 border-gray-400'
  }

  const getPositionName = (position: string) => {
    return POSITION_MAP[position as keyof typeof POSITION_MAP]?.name || position
  }

  // Calcular altura máxima baseada na altura da janela
  const maxModalHeight = Math.min(windowHeight * 0.9, 700) // Máximo 90% da janela ou 700px
  const positionsGridHeight = Math.min(maxModalHeight * 0.4, 220) // Altura adaptativa para a grade

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 flex flex-col"
        style={{ maxHeight: `${maxModalHeight}px` }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Alterar Posição</h2>
            <p className="text-sm text-zinc-400">Selecione a nova posição para o jogador</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Informações do Jogador - Versão Compacta */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800/50 rounded-xl">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0">
            {player.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{player.position}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-sm truncate">{player.name}</h3>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <div className={`px-2 py-0.5 rounded-lg ${getPositionColor(player.position)} shrink-0`}>
                <span className="text-xs font-bold text-white">
                  {getPositionName(player.position)}
                </span>
              </div>
              <div className="bg-black/50 px-2 py-0.5 rounded-lg shrink-0">
                <span className="text-xs font-bold text-yellow-400">OVR {player.overall}</span>
              </div>
              <p className="text-xs text-zinc-400 truncate ml-auto">{player.club}</p>
            </div>
          </div>
        </div>

        {/* Posição Atual - Versão Compacta */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-zinc-400 mb-1.5">Posição Atual</h4>
          <div className={`px-3 py-2 rounded-lg border-2 ${getPositionColor(currentPosition)} flex items-center justify-between`}>
            <span className="font-bold text-white text-sm">{getPositionName(currentPosition)}</span>
            <span className="text-xs text-white/70">({currentPosition})</span>
          </div>
        </div>

        {/* Seleção de Nova Posição */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <h4 className="text-xs font-medium text-zinc-400 mb-2">Selecione Nova Posição</h4>
          <div 
            className="grid grid-cols-4 gap-1.5 overflow-y-auto p-1 min-h-0"
            style={{ height: `${positionsGridHeight}px` }}
          >
            {POSITIONS.map((position) => {
              const positionName = getPositionName(position)
              return (
                <button
                  key={position}
                  onClick={() => {
                    onSelectPosition(position)
                    onClose()
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all hover:scale-105 active:scale-95",
                    getPositionColor(position),
                    currentPosition === position ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : ""
                  )}
                >
                  <span className="text-xs font-bold text-white mb-0.5">{position}</span>
                  <span className="text-[10px] text-white/90 text-center leading-tight">
                    {positionName.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Botão Cancelar */}
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}