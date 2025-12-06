import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import { DismissModalProps } from '../types'

export const DismissModal: React.FC<DismissModalProps> = ({ 
  player, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen || !player) return null

  const getDismissValue = () => {
    if (player.overall <= 73) return 2_000_000
    if (player.overall === 74) return 5_000_000
    return 0
  }

  const dismissValue = getDismissValue()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-zinc-700">
          <h2 className="text-2xl font-bold text-white">Dispensar Jogador</h2>
          <p className="text-zinc-400 mt-1">Confirmar dispensa do jogador</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
            {player.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={player.name} 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                <span className="text-lg font-black text-white">{player.position}</span>
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg text-white">{player.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-purple-600">{player.position}</Badge>
                <span className="text-zinc-400 text-sm">OVR {player.overall}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/30 p-4 rounded-lg">
            <p className="text-zinc-400 text-sm">Valor da Dispensa</p>
            <p className="text-emerald-400 font-bold text-2xl">
              R$ {dismissValue.toLocaleString('pt-BR')}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              {player.overall <= 73 
                ? "Jogadores até 73 de OVR: R$ 2.000.000" 
                : "Jogadores com 74 de OVR: R$ 5.000.000"
              }
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-400 font-semibold">Atenção</p>
                <p className="text-yellow-300 text-sm mt-1">
                  O jogador será desassociado do clube e ficará sem time. 
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-700 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent border-zinc-600 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(player.id, player.name, player.overall)}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            Confirmar Dispensa
          </Button>
        </div>
      </div>
    </div>
  )
}