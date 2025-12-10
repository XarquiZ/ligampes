'use client'

import { ArrowRightLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Transfer } from './types'

interface ExchangePlayersProps {
  transfer: Transfer
  exchangePlayersDetails: { [key: string]: any[] }
}

export default function ExchangePlayers({ transfer, exchangePlayersDetails }: ExchangePlayersProps) {
  const players = exchangePlayersDetails[transfer.id] || []
  
  if (players.length === 0) return null

  return (
    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <ArrowRightLeft className="w-3 h-3 text-blue-400" />
        <span className="text-blue-400 font-semibold text-xs">Jogadores na Troca</span>
      </div>
      <div className="space-y-1">
        {players.map((player: any) => (
          <div key={player.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {player.photo_url ? (
                <img 
                  src={player.photo_url} 
                  alt={player.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{player.position}</span>
                </div>
              )}
              <span className="text-white truncate max-w-[80px]">{player.name}</span>
              <Badge className="bg-blue-600 text-[10px] px-1">{player.position}</Badge>
            </div>
            <span className="text-emerald-400 text-[10px]">
              R$ {player.base_price?.toLocaleString('pt-BR') || '0'}
            </span>
          </div>
        ))}
        {transfer.exchange_value > 0 && (
          <div className="flex items-center justify-between border-t border-blue-500/30 pt-1">
            <span className="text-blue-300 text-xs">+ Dinheiro</span>
            <span className="text-emerald-400 text-xs font-semibold">
              R$ {transfer.exchange_value.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}