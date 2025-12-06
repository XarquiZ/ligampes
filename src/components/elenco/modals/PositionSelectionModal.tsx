// components/elenco/modals/PositionSelectionModal.tsx
import React, { useState } from 'react'
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Alterar Posição</h2>
            <p className="text-sm text-zinc-400">Selecione a nova posição para o jogador</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Informações do Jogador */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-zinc-800/50 rounded-xl">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500">
            {player.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{player.position}</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-white">{player.name}</h3>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-lg ${getPositionColor(player.position)}`}>
                <span className="text-xs font-bold text-white">
                  {getPositionName(player.position)}
                </span>
              </div>
              <div className="bg-black/50 px-2 py-1 rounded-lg">
                <span className="text-sm font-bold text-yellow-400">OVR {player.overall}</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mt-1">{player.club}</p>
          </div>
        </div>

        {/* Posição Atual */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Posição Atual</h4>
          <div className={`px-4 py-3 rounded-xl border-2 ${getPositionColor(currentPosition)} flex items-center justify-between`}>
            <span className="font-bold text-white">{getPositionName(currentPosition)}</span>
            <span className="text-sm text-white/70">({currentPosition})</span>
          </div>
        </div>

        {/* Seleção de Nova Posição */}
        <div>
          <h4 className="text-sm font-medium text-zinc-400 mb-3">Selecione Nova Posição</h4>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
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
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:scale-105",
                    getPositionColor(position),
                    currentPosition === position ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
                  )}
                >
                  <span className="text-xs font-bold text-white mb-1">{position}</span>
                  <span className="text-[10px] text-white/90 text-center leading-tight">
                    {positionName.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
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