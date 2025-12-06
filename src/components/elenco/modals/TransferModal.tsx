import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { DollarSign, ArrowRightLeft, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TransferModalProps, Player, Team } from '../types'

export const TransferModal: React.FC<TransferModalProps> = ({ 
  player, 
  isOpen, 
  onClose, 
  onConfirm, 
  teams 
}) => {
  const [activeTab, setActiveTab] = useState<'sell' | 'exchange'>('sell')
  const [transferValue, setTransferValue] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [error, setError] = useState("")
  const [exchangePlayers, setExchangePlayers] = useState<Player[]>([])
  const [exchangeValue, setExchangeValue] = useState("")
  const [selectedExchangeTeam, setSelectedExchangeTeam] = useState("")
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && player) {
      setTransferValue(player.base_price.toString())
      setSelectedTeam("")
      setError("")
      setActiveTab('sell')
      setExchangePlayers([])
      setExchangeValue("")
      setSelectedExchangeTeam("")
      setSelectedPlayers([])
    }
  }, [isOpen, player])

  useEffect(() => {
    const loadTeamPlayers = async () => {
      if (!selectedExchangeTeam) {
        setTeamPlayers([])
        return
      }

      try {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', selectedExchangeTeam)
          .neq('id', player?.id)

        setTeamPlayers(data || [])
      } catch (error) {
        console.error('Erro ao carregar jogadores do time:', error)
        setTeamPlayers([])
      }
    }

    loadTeamPlayers()
  }, [selectedExchangeTeam, player?.id])

  const exchangeTotalValue = useMemo(() => {
    const playersValue = exchangePlayers.reduce((total, p) => total + p.base_price, 0)
    const cashValue = parseFloat(exchangeValue.replace(/\./g, '').replace(',', '.')) || 0
    return playersValue + cashValue
  }, [exchangePlayers, exchangeValue])

  const minExchangeValue = player?.base_price || 0

  if (!isOpen || !player) return null

  const handleConfirm = () => {
    if (activeTab === 'sell') {
      if (!selectedTeam) {
        setError("Selecione um clube para vender")
        return
      }

      const value = parseFloat(transferValue.replace(/\./g, '').replace(',', '.'))
      
      if (isNaN(value) || value <= 0) {
        setError("Valor inválido")
        return
      }

      if (value < player.base_price) {
        setError(`O valor não pode ser menor que R$ ${player.base_price.toLocaleString('pt-BR')}`)
        return
      }

      if (selectedTeam === player.team_id) {
        setError("Não é possível vender para o próprio time")
        return
      }

      onConfirm({
        playerId: player.id,
        playerName: player.name,
        fromTeamId: player.team_id!,
        toTeamId: selectedTeam,
        value: value,
        type: 'sell'
      })
    } else {
      if (!selectedExchangeTeam) {
        setError("Selecione um clube para trocar")
        return
      }

      if (exchangePlayers.length === 0 && !exchangeValue) {
        setError("Selecione pelo menos um jogador ou adicione valor em dinheiro")
        return
      }

      if (exchangeTotalValue < minExchangeValue) {
        setError(`O valor total da troca (R$ ${exchangeTotalValue.toLocaleString('pt-BR')}) não pode ser menor que o valor base do jogador (R$ ${minExchangeValue.toLocaleString('pt-BR')})`)
        return
      }

      if (selectedExchangeTeam === player.team_id) {
        setError("Não é possível trocar com o próprio time")
        return
      }

      onConfirm({
        playerId: player.id,
        playerName: player.name,
        fromTeamId: player.team_id!,
        toTeamId: selectedExchangeTeam,
        value: exchangeTotalValue,
        type: 'exchange',
        exchangePlayers: exchangePlayers.map(p => p.id),
        exchangeValue: parseFloat(exchangeValue.replace(/\./g, '').replace(',', '.')) || 0
      })
    }
  }

  const formatCurrency = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '')
    if (onlyNumbers === '') return ''
    
    const number = parseInt(onlyNumbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(e.target.value)
    setTransferValue(formattedValue)
    setError("")
  }

  const handleExchangeValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(e.target.value)
    setExchangeValue(formattedValue)
    setError("")
  }

  const togglePlayerSelection = (player: Player) => {
    if (selectedPlayers.includes(player.id)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
      setExchangePlayers(exchangePlayers.filter(p => p.id !== player.id))
    } else {
      setSelectedPlayers([...selectedPlayers, player.id])
      setExchangePlayers([...exchangePlayers, player])
    }
  }

  const removeExchangePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(id => id !== playerId))
    setExchangePlayers(exchangePlayers.filter(p => p.id !== playerId))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-zinc-700">
          <h2 className="text-2xl font-bold text-white">Negociar Jogador</h2>
          <p className="text-zinc-400 mt-1">Enviar proposta de transferência ou troca</p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
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

          <div className="bg-zinc-800/30 p-3 rounded-lg">
            <p className="text-zinc-400 text-sm">Valor Base</p>
            <p className="text-emerald-400 font-bold text-lg">
              R$ {player.base_price.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex border-b border-zinc-700">
            <button
              className={cn(
                "flex-1 py-3 px-4 text-center font-medium transition-all",
                activeTab === 'sell'
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
              onClick={() => setActiveTab('sell')}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Vender
            </button>
            <button
              className={cn(
                "flex-1 py-3 px-4 text-center font-medium transition-all",
                activeTab === 'exchange'
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
              onClick={() => setActiveTab('exchange')}
            >
              <ArrowRightLeft className="w-4 h-4 inline mr-2" />
              Trocar
            </button>
          </div>

          {activeTab === 'sell' ? (
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-sm font-medium mb-2 block">
                  Valor da Transferência
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  <Input
                    placeholder="0,00"
                    value={transferValue}
                    onChange={handleValueChange}
                    className="pl-10 bg-zinc-800/50 border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-sm font-medium mb-2 block">
                  Vender para
                </label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                    <SelectValue placeholder="Selecione um clube" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => team.id !== player.team_id)
                      .map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            {team.logo_url && (
                              <img 
                                src={team.logo_url} 
                                alt={team.name} 
                                className="w-6 h-6 rounded-full object-contain"
                              />
                            )}
                            <span>{team.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-sm font-medium mb-2 block">
                  Trocar com
                </label>
                <Select value={selectedExchangeTeam} onValueChange={setSelectedExchangeTeam}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                    <SelectValue placeholder="Selecione um clube" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => team.id !== player.team_id)
                      .map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            {team.logo_url && (
                              <img 
                                src={team.logo_url} 
                                alt={team.name} 
                                className="w-6 h-6 rounded-full object-contain"
                              />
                            )}
                            <span>{team.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {selectedExchangeTeam && (
                <>
                  <div>
                    <label className="text-zinc-400 text-sm font-medium mb-2 block">
                      Jogadores para Troca
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {teamPlayers.map(teamPlayer => (
                        <div
                          key={teamPlayer.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            selectedPlayers.includes(teamPlayer.id)
                              ? "bg-blue-500/20 border-blue-500/50"
                              : "bg-zinc-800/30 border-zinc-600 hover:border-zinc-500"
                          )}
                          onClick={() => togglePlayerSelection(teamPlayer)}
                        >
                          <Checkbox
                            checked={selectedPlayers.includes(teamPlayer.id)}
                            onCheckedChange={() => togglePlayerSelection(teamPlayer)}
                          />
                          {teamPlayer.photo_url ? (
                            <img 
                              src={teamPlayer.photo_url} 
                              alt={teamPlayer.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-cyan-700 flex items-center justify-center">
                              <span className="text-sm font-black text-white">{teamPlayer.position}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-white">{teamPlayer.name}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge className="bg-blue-600">{teamPlayer.position}</Badge>
                              <span className="text-zinc-400">OVR {teamPlayer.overall}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-400 font-bold">
                              R$ {teamPlayer.base_price.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {teamPlayers.length === 0 && (
                        <p className="text-zinc-500 text-center py-4">
                          Nenhum jogador disponível para troca neste time
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-sm font-medium mb-2 block">
                      Valor Adicional em Dinheiro (opcional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                      <Input
                        placeholder="0,00"
                        value={exchangeValue}
                        onChange={handleExchangeValueChange}
                        className="pl-10 bg-zinc-800/50 border-zinc-600"
                      />
                    </div>
                  </div>

                  {exchangePlayers.length > 0 && (
                    <div className="bg-zinc-800/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Resumo da Troca</h4>
                      <div className="space-y-2">
                        {exchangePlayers.map(player => (
                          <div key={player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeExchangePlayer(player.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <span className="text-white">{player.name}</span>
                            </div>
                            <span className="text-emerald-400">
                              R$ {player.base_price.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ))}
                        {parseFloat(exchangeValue.replace(/\./g, '').replace(',', '.')) > 0 && (
                          <div className="flex items-center justify-between border-t border-zinc-600 pt-2">
                            <span className="text-white">Dinheiro</span>
                            <span className="text-emerald-400">
                              R$ {formatCurrency(exchangeValue)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-zinc-600 pt-2 font-bold">
                          <span className="text-white">Total</span>
                          <span className={cn(
                            "text-lg",
                            exchangeTotalValue >= minExchangeValue ? "text-emerald-400" : "text-red-400"
                          )}>
                            R$ {exchangeTotalValue.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-400">
                          Valor mínimo necessário: R$ {minExchangeValue.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
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
            onClick={handleConfirm}
            className={cn(
              "flex-1",
              activeTab === 'sell' 
                ? "bg-emerald-600 hover:bg-emerald-700" 
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {activeTab === 'sell' ? 'Enviar Proposta' : 'Propor Troca'}
          </Button>
        </div>
      </div>
    </div>
  )
}