'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Plus, FileText, MessageCircle, Tag, Handshake } from 'lucide-react'
import { Player } from './types'

interface MarketPlayerFormProps {
  availablePlayers: Player[]
  selectedPlayer: Player | null
  setSelectedPlayer: (player: Player | null) => void
  marketPrice: string
  setMarketPrice: (price: string) => void
  marketDescription: string
  setMarketDescription: (description: string) => void
  priceOptions: { value: number; label: string }[]
  handlePriceChange: (value: string) => void
  handleOpenDescriptionModal: () => void
  handleAddToMarket: (saleMode: 'fixed_price' | 'negotiable') => void
  addingPlayer: boolean
  showAddForm: boolean
  setShowAddForm: (show: boolean) => void
  handleCancelAdd: () => void
}

export default function MarketPlayerForm({
  availablePlayers,
  selectedPlayer,
  setSelectedPlayer,
  marketPrice,
  setMarketPrice,
  marketDescription,
  setMarketDescription,
  priceOptions,
  handlePriceChange,
  handleOpenDescriptionModal,
  handleAddToMarket,
  addingPlayer,
  showAddForm,
  setShowAddForm,
  handleCancelAdd
}: MarketPlayerFormProps) {
  const [saleMode, setSaleMode] = useState<'fixed_price' | 'negotiable'>('fixed_price')

  return (
    <Card className="p-6 mb-6 bg-white/5 border-white/10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Anunciar Jogador</h3>
          <p className="text-zinc-400">Coloque jogadores do seu time disponíveis para negociação</p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => {
              setShowAddForm(true)
              setSelectedPlayer(null)
              setMarketPrice('')
              setMarketDescription('')
              setSaleMode('fixed_price')
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Jogador
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="space-y-4 p-4 bg-zinc-800/30 rounded-lg">
          {/* Selecionar jogador */}
          <div>
            <label className="text-zinc-400 text-sm font-medium mb-2 block">
              Selecione um jogador do seu time
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availablePlayers.map(player => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    selectedPlayer?.id === player.id
                      ? "bg-blue-500/20 border-blue-500/50"
                      : "bg-zinc-800/30 border-zinc-600 hover:border-zinc-500"
                  )}
                  onClick={() => {
                    setSelectedPlayer(player)
                    setMarketDescription('')
                    // Resetar preço quando mudar de jogador
                    setMarketPrice(`R$ ${player.base_price.toLocaleString('pt-BR')}`)
                  }}
                >
                  {player.photo_url ? (
                    <img 
                      src={player.photo_url} 
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-cyan-700 flex items-center justify-center">
                      <span className="text-sm font-black text-white">{player.position}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-white">{player.name}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-blue-600">{player.position}</Badge>
                      <span className="text-zinc-400">OVR {player.overall}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">
                      R$ {player.base_price.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedPlayer && (
            <>
              {/* Modo de venda */}
              <div>
                <label className="text-zinc-400 text-sm font-medium mb-2 block">
                  Como deseja anunciar?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSaleMode('fixed_price')}
                    className={cn(
                      "p-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-2",
                      saleMode === 'fixed_price'
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                        : "bg-zinc-800/30 border-zinc-600 hover:border-zinc-500 text-zinc-300 hover:text-white"
                    )}
                  >
                    <Tag className="w-5 h-5" />
                    <span className="font-medium">Fixar Preço</span>
                    <span className="text-xs opacity-70">Defina um valor fixo</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSaleMode('negotiable')
                      setMarketPrice(`R$ ${selectedPlayer.base_price.toLocaleString('pt-BR')}`)
                    }}
                    className={cn(
                      "p-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-2",
                      saleMode === 'negotiable'
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                        : "bg-zinc-800/30 border-zinc-600 hover:border-zinc-500 text-zinc-300 hover:text-white"
                    )}
                  >
                    <Handshake className="w-5 h-5" />
                    <span className="font-medium">Negociar</span>
                    <span className="text-xs opacity-70">Aceita propostas</span>
                  </button>
                </div>
              </div>

              {/* Preço - SUGESTÃO para modo Negociar */}
              {saleMode === 'negotiable' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-400 text-sm font-medium">
                      Sugestão de Preço (para referência)
                    </label>
                    <div className="text-emerald-400 font-bold">
                      {marketPrice}
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs mb-2">
                    O jogador será anunciado como "Aceita Propostas". O preço sugerido é apenas uma referência.
                  </p>
                </div>
              ) : (
                /* Preço - OBRIGATÓRIO para Fixar Preço */
                <div>
                  <label className="text-zinc-400 text-sm font-medium mb-2 block">
                    Selecione o Preço de Venda
                  </label>
                  <div className="relative">
                    <select
                      value={marketPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full p-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Selecione um preço...</option>
                      {priceOptions.map((option, index) => (
                        <option 
                          key={index} 
                          value={option.label}
                          className="bg-zinc-800 text-white"
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">
                    Valor base do jogador: R$ {selectedPlayer.base_price.toLocaleString('pt-BR')}
                    <span className="block mt-1">
                      Seleção de 100 opções a partir do valor base, aumentando R$ 1.000.000 a cada opção
                    </span>
                  </p>
                </div>
              )}

              {/* Descrição - OPCIONAL para ambos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-400 text-sm font-medium">
                    Descrição {saleMode === 'negotiable' ? 'da Negociação ' : ''}(opcional)
                  </label>
                  <Button
                    type="button"
                    onClick={handleOpenDescriptionModal}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "border-blue-400/30 hover:bg-blue-400/10",
                      saleMode === 'negotiable' 
                        ? "text-purple-400 border-purple-400/30 hover:bg-purple-400/10" 
                        : "text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                    )}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {marketDescription ? 'Editar Descrição' : 'Adicionar Descrição'}
                  </Button>
                </div>
                
                {/* Visualização da descrição atual */}
                {marketDescription ? (
                  <div className={cn(
                    "mt-2 p-3 rounded-lg border",
                    saleMode === 'negotiable'
                      ? "bg-purple-900/10 border-purple-700/30"
                      : "bg-zinc-800/30 border-zinc-700"
                  )}>
                    <p className="text-zinc-300 text-sm">{marketDescription}</p>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm italic">
                    {saleMode === 'negotiable' 
                      ? 'Adicione uma descrição para explicar o que você busca na negociação (ex: "Aceito propostas em jogadores da posição X").'
                      : 'Por que está colocando à venda?'
                    }
                  </p>
                )}
                
                {saleMode === 'negotiable' && (
                  <div className="mt-3 p-3 bg-purple-900/10 rounded-lg border border-purple-700/30">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                      <div>
                        <p className="text-purple-300 text-sm font-medium">Modo Negociar</p>
                        <p className="text-zinc-400 text-xs mt-1">
                          O jogador será anunciado como "Aceita Propostas". Outros treinadores poderão enviar ofertas através do chat.
                          O preço sugerido serve apenas como referência para negociação.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleAddToMarket(saleMode)}
                  disabled={addingPlayer || (saleMode === 'fixed_price' && !marketPrice)}
                  className={cn(
                    "flex-1 text-white disabled:opacity-50 disabled:cursor-not-allowed",
                    saleMode === 'fixed_price' 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  {addingPlayer ? 'Anunciando...' : (
                    saleMode === 'fixed_price' 
                      ? 'Anunciar com Preço Fixo' 
                      : 'Anunciar para Negociação'
                  )}
                </Button>
                <Button
                  onClick={handleCancelAdd}
                  variant="outline"
                  className="flex-1 text-white border-zinc-600 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  )
}