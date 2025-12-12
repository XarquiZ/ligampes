import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { DollarSign, ArrowRightLeft, X, Check, AlertCircle, Info, Scale, ArrowUp, ArrowDown } from 'lucide-react'
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
  const [selectedSellPlayers, setSelectedSellPlayers] = useState<string[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [playerValues, setPlayerValues] = useState<{[key: string]: string}>({})
  const [selectedExchangeTeamInfo, setSelectedExchangeTeamInfo] = useState<Team | null>(null)
  const [moneyDirection, setMoneyDirection] = useState<'send' | 'receive'>('send')

  // Carregar todos os jogadores do time atual
  useEffect(() => {
    const loadTeamPlayers = async () => {
      if (!player?.team_id) return

      try {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', player.team_id)

        setAvailablePlayers(data || [])
        
        // Inicializar valores com base_price de cada jogador
        const initialValues: {[key: string]: string} = {}
        data?.forEach(p => {
          initialValues[p.id] = p.base_price.toString()
        })
        setPlayerValues(initialValues)
      } catch (error) {
        console.error('Erro ao carregar jogadores do time:', error)
        setAvailablePlayers([])
      }
    }

    if (isOpen && player) {
      loadTeamPlayers()
    }
  }, [isOpen, player])

  useEffect(() => {
    if (isOpen && player) {
      setTransferValue("")
      setSelectedTeam("")
      setError("")
      setActiveTab('sell')
      setExchangePlayers([])
      setExchangeValue("")
      setSelectedExchangeTeam("")
      setSelectedPlayers([])
      setSelectedSellPlayers([player.id])
      setSelectedExchangeTeamInfo(null)
      setMoneyDirection('send')
    }
  }, [isOpen, player])

  // Carregar jogadores do time selecionado para troca
  useEffect(() => {
    const loadExchangeTeamPlayers = async () => {
      if (!selectedExchangeTeam) {
        setTeamPlayers([])
        setSelectedExchangeTeamInfo(null)
        return
      }

      // Encontrar informações do time selecionado
      const teamInfo = teams.find(team => team.id === selectedExchangeTeam)
      setSelectedExchangeTeamInfo(teamInfo || null)

      try {
        const query = supabase
        .from('players')
        .select('*')
        .eq('team_id', selectedExchangeTeam);
      
      // Só adiciona neq se player?.id existir
      if (player?.id) {
        query.neq('id', player.id);
      }
      
      const { data } = await query;

        setTeamPlayers(data || [])
      } catch (error) {
        console.error('Erro ao carregar jogadores do time:', error)
        setTeamPlayers([])
      }
    }

    loadExchangeTeamPlayers()
  }, [selectedExchangeTeam, player?.id, teams])

  // Calcular valor total dos jogadores selecionados para venda
  const sellTotalValue = useMemo(() => {
    return selectedSellPlayers.reduce((total, playerId) => {
      const valueStr = playerValues[playerId] || "0"
      const value = parseFloat(valueStr.replace(/\./g, '').replace(',', '.')) || 0
      return total + value
    }, 0)
  }, [selectedSellPlayers, playerValues])

  // Calcular valor total dos jogadores oferecidos
  const offeredPlayersValue = useMemo(() => {
    return exchangePlayers.reduce((total, p) => total + p.base_price, 0)
  }, [exchangePlayers])

  // Calcular valor de dinheiro inserido
  const cashValue = useMemo(() => {
    return parseFloat(exchangeValue.replace(/\./g, '').replace(',', '.')) || 0
  }, [exchangeValue])

  // Calcular valor líquido que o usuário recebe
  const exchangeNetValue = useMemo(() => {
    // O usuário SEMPRE recebe os jogadores oferecidos
    // Se ele manda dinheiro, isso não reduz o valor que ele recebe
    // Se ele recebe dinheiro, isso aumenta o valor que ele recebe
    return offeredPlayersValue + (moneyDirection === 'receive' ? cashValue : 0)
  }, [offeredPlayersValue, cashValue, moneyDirection])

  // Calcular valor total da transação (considerando dinheiro mandado/recebido)
  const totalTransactionValue = useMemo(() => {
    // Para verificar se a troca está equilibrada, precisamos considerar:
    // - Valor dos jogadores que o usuário RECEBE (exchangeNetValue)
    // - Valor do dinheiro que ele MANDA (se for o caso)
    // A troca está equilibrada se o valor total recebido for >= valor do jogador
    return exchangeNetValue
  }, [exchangeNetValue])

  // Calcular valor mínimo para venda (soma dos valores base)
  const minSellValue = useMemo(() => {
    return selectedSellPlayers.reduce((total, playerId) => {
      const player = availablePlayers.find(p => p.id === playerId)
      return total + (player?.base_price || 0)
    }, 0)
  }, [selectedSellPlayers, availablePlayers])

  // Calcular diferença de valores na troca
  const exchangeDifference = useMemo(() => {
    if (!player) return 0
    
    const playerValue = player.base_price
    const transactionValue = totalTransactionValue
    
    return transactionValue - playerValue
  }, [player, totalTransactionValue])

  // Encontrar jogador com maior valor base na troca
  const highestValuePlayer = useMemo(() => {
    if (exchangePlayers.length === 0) return null
    
    return exchangePlayers.reduce((highest, current) => 
      current.base_price > (highest?.base_price || 0) ? current : highest
    )
  }, [exchangePlayers])

  // Verificar se a troca está equilibrada
  const isExchangeBalanced = useMemo(() => {
    if (!player) return false
    
    // Para troca estar equilibrada, o valor total da transação deve ser >= valor do jogador
    return totalTransactionValue >= player.base_price
  }, [player, totalTransactionValue])

  // Verificar se o meu jogador tem maior valor do que os oferecidos
  const isMyPlayerHigherValue = useMemo(() => {
    if (!player || exchangePlayers.length === 0) return false
    
    // Se meu jogador vale mais que todos os jogadores oferecidos combinados
    return player.base_price > offeredPlayersValue
  }, [player, offeredPlayersValue])

  // Verificar se há jogador oferecido com valor mais alto
  const hasHigherValuePlayer = useMemo(() => {
    if (!player || exchangePlayers.length === 0) return false
    
    // Se algum jogador oferecido vale mais que meu jogador
    return exchangePlayers.some(p => p.base_price > player.base_price)
  }, [player, exchangePlayers])

  // Verificar se o valor total oferecido é maior
  const isTotalOfferedValueHigher = useMemo(() => {
    if (!player) return false
    return offeredPlayersValue > player.base_price
  }, [player, offeredPlayersValue])

  // Calcular quanto dinheiro é necessário para equilibrar (mínimo)
  const requiredMoneyToBalance = useMemo(() => {
    if (!player) return 0
    
    // Se meu jogador vale mais que os jogadores oferecidos
    if (player.base_price > offeredPlayersValue) {
      // Eu preciso receber dinheiro (mínimo para equilibrar)
      return player.base_price - offeredPlayersValue
    } 
    // Se os jogadores oferecidos valem mais que meu jogador
    else if (offeredPlayersValue > player.base_price) {
      // Eu preciso mandar dinheiro para cobrir a diferença
      // Mas o usuário pode mandar MAIS dinheiro se quiser
      return 0 // Não há mínimo obrigatório para mandar, pode mandar qualquer valor
    }
    
    return 0
  }, [player, offeredPlayersValue])

  // Verificar se a direção do dinheiro está correta
  const isMoneyDirectionCorrect = useMemo(() => {
    if (!player || cashValue === 0) return true
    
    // Se meu jogador vale mais, devo RECEBER dinheiro
    if (player.base_price > offeredPlayersValue) {
      return moneyDirection === 'receive'
    }
    // Se os jogadores oferecidos valem mais, posso MANDAR ou RECEBER dinheiro
    // O usuário pode escolher mandar dinheiro mesmo recebendo jogadores mais valiosos
    return true // Qualquer direção é válida se os jogadores oferecidos valem mais
  }, [player, offeredPlayersValue, moneyDirection, cashValue])

  // Verificar se o valor de dinheiro é suficiente (apenas quando deve RECEBER)
  const isMoneyAmountSufficient = useMemo(() => {
    if (!player || cashValue === 0) return true
    
    // Se devo RECEBER dinheiro (meu jogador vale mais)
    if (player.base_price > offeredPlayersValue && moneyDirection === 'receive') {
      // Preciso receber pelo menos a diferença
      return cashValue >= requiredMoneyToBalance
    }
    
    // Se estou MANDANDO dinheiro, não há mínimo obrigatório
    // O usuário pode mandar qualquer valor (incluindo 0)
    return true
  }, [player, offeredPlayersValue, moneyDirection, cashValue, requiredMoneyToBalance])

  // Verificar se a troca pode prosseguir
  const canProceedWithExchange = useMemo(() => {
    if (!player || exchangePlayers.length === 0) return false
    
    // 1. Deve estar equilibrada (valor total >= valor do jogador)
    if (!isExchangeBalanced) return false
    
    // 2. Se está mandando dinheiro quando deveria receber, bloquear
    if (player.base_price > offeredPlayersValue && moneyDirection === 'send') {
      return false
    }
    
    // 3. Se está recebendo dinheiro, verificar se é suficiente
    if (player.base_price > offeredPlayersValue && moneyDirection === 'receive' && !isMoneyAmountSufficient) {
      return false
    }
    
    return true
  }, [player, isExchangeBalanced, isMoneyAmountSufficient, exchangePlayers, offeredPlayersValue, moneyDirection])

  // Verificar se deve mostrar alerta de valor insuficiente
  const shouldShowInsufficientValueAlert = useMemo(() => {
    if (!player || exchangePlayers.length === 0) return false
    
    // Se não está equilibrada OU está mandando quando deveria receber OU (recebendo mas valor insuficiente)
    return !isExchangeBalanced || 
           (player.base_price > offeredPlayersValue && moneyDirection === 'send') ||
           (player.base_price > offeredPlayersValue && moneyDirection === 'receive' && !isMoneyAmountSufficient)
  }, [player, isExchangeBalanced, isMoneyAmountSufficient, exchangePlayers, offeredPlayersValue, moneyDirection])

  if (!isOpen || !player) return null

  const handleConfirm = () => {
    if (activeTab === 'sell') {
      if (!selectedTeam) {
        setError("Selecione um clube para vender")
        return
      }

      if (selectedSellPlayers.length === 0) {
        setError("Selecione pelo menos um jogador para vender")
        return
      }

      const value = parseFloat(transferValue.replace(/\./g, '').replace(',', '.'))
      
      if (isNaN(value) || value <= 0) {
        setError("Valor inválido")
        return
      }

      if (value < minSellValue) {
        setError(`O valor não pode ser menor que R$ ${minSellValue.toLocaleString('pt-BR')} (soma dos valores base)`)
        return
      }

      if (selectedTeam === player.team_id) {
        setError("Não é possível vender para o próprio time")
        return
      }

      // Verificar se todos os jogadores têm valor válido
      const invalidPlayers = selectedSellPlayers.filter(playerId => {
        const player = availablePlayers.find(p => p.id === playerId)
        const valueStr = playerValues[playerId] || "0"
        const value = parseFloat(valueStr.replace(/\./g, '').replace(',', '.')) || 0
        return value < (player?.base_price || 0)
      })

      if (invalidPlayers.length > 0) {
        const playerNames = invalidPlayers.map(id => 
          availablePlayers.find(p => p.id === id)?.name
        ).filter(Boolean).join(', ')
        
        setError(`Os seguintes jogadores têm valor abaixo do mínimo: ${playerNames}`)
        return
      }

      // Determinar se é venda única ou múltipla
      const isMultiSell = selectedSellPlayers.length > 1
      const firstPlayerId = selectedSellPlayers[0]
      const firstPlayer = availablePlayers.find(p => p.id === firstPlayerId)
      
      onConfirm({
        // SEMPRE enviar um player_id (o primeiro da lista para múltiplos)
        playerId: firstPlayerId,
        playerName: isMultiSell ? 'Múltiplos Jogadores' : (firstPlayer?.name || ''),
        
        // Dados para múltiplos jogadores
        transferPlayers: selectedSellPlayers,
        playerNames: selectedSellPlayers.map(id => 
          availablePlayers.find(p => p.id === id)?.name || ''
        ),
        playerValues: selectedSellPlayers.map(playerId => {
          const valueStr = playerValues[playerId] || "0"
          return parseFloat(valueStr.replace(/\./g, '').replace(',', '.')) || 0
        }),
        
        fromTeamId: player.team_id!,
        toTeamId: selectedTeam,
        value: value,
        type: isMultiSell ? 'multi_sell' : 'sell'
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

      // Verificar se pode prosseguir
      if (!canProceedWithExchange) {
        if (player.base_price > offeredPlayersValue && moneyDirection === 'send') {
          setError(`Seu jogador é mais valioso! Você deve RECEBER dinheiro do outro time.`)
          return
        }
        
        if (player.base_price > offeredPlayersValue && moneyDirection === 'receive' && !isMoneyAmountSufficient) {
          setError(`Valor de dinheiro insuficiente! Você precisa receber pelo menos R$ ${requiredMoneyToBalance.toLocaleString('pt-BR')} para equilibrar.`)
          return
        }
        
        if (!isExchangeBalanced) {
          setError(`A troca não está equilibrada! Ajuste os valores para prosseguir.`)
          return
        }
        
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
        value: totalTransactionValue,
        type: 'exchange',
        exchangePlayers: exchangePlayers.map(p => p.id),
        exchangeValue: cashValue,
        moneyDirection: moneyDirection
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

  const handlePlayerValueChange = (playerId: string, value: string) => {
    const formattedValue = formatCurrency(value)
    setPlayerValues(prev => ({
      ...prev,
      [playerId]: formattedValue
    }))
    setError("")
  }

  const toggleSellPlayerSelection = (playerId: string) => {
    setSelectedSellPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId)
      } else {
        return [...prev, playerId]
      }
    })
    setError("")
  }

  const toggleExchangePlayerSelection = (player: Player) => {
    if (selectedPlayers.includes(player.id)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
      setExchangePlayers(exchangePlayers.filter(p => p.id !== player.id))
    } else {
      setSelectedPlayers([...selectedPlayers, player.id])
      setExchangePlayers([...exchangePlayers, player])
    }
    setError("")
  }

  const removeExchangePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(id => id !== playerId))
    setExchangePlayers(exchangePlayers.filter(p => p.id !== playerId))
  }

  // Renderizar jogadores selecionados para venda
  const renderSelectedPlayers = () => {
    return selectedSellPlayers.map(playerId => {
      const player = availablePlayers.find(p => p.id === playerId)
      if (!player) return null
      
      const individualValue = playerValues[playerId] || player.base_price.toString()
      const parsedValue = parseFloat(individualValue.replace(/\./g, '').replace(',', '.')) || player.base_price
      const isAboveMinimum = parsedValue >= player.base_price
      
      return (
        <div key={playerId} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mb-2">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              {player.photo_url ? (
                <img 
                  src={player.photo_url} 
                  alt={player.name} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                  <span className="text-sm font-black text-white">{player.position}</span>
                </div>
              )}
              <div>
                <h4 className="font-bold text-white">{player.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-purple-600 text-xs">{player.position}</Badge>
                  <span className="text-zinc-400 text-xs">OVR {player.overall}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSellPlayerSelection(playerId)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            <label className="text-zinc-400 text-xs font-medium mb-1 block">
              Valor individual
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3 h-3" />
              <Input
                placeholder="0,00"
                value={playerValues[playerId] || player.base_price.toString()}
                onChange={(e) => handlePlayerValueChange(playerId, e.target.value)}
                className="pl-8 bg-zinc-800/70 border-zinc-600 h-8 text-sm"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-zinc-500 text-xs">
                Mín: R$ {player.base_price.toLocaleString('pt-BR')}
              </span>
              <span className={cn(
                "text-xs font-medium",
                isAboveMinimum ? "text-emerald-400" : "text-red-400"
              )}>
                {isAboveMinimum ? '✓ OK' : 'Abaixo do mínimo'}
              </span>
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Cabeçalho com tipo de venda */}
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Negociar Jogador</h2>
              <p className="text-zinc-400 mt-1">Enviar proposta de transferência ou troca</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "px-4 py-2 rounded-lg font-bold",
                activeTab === 'sell' 
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              )}>
                {activeTab === 'sell' ? 'VENDA' : 'TROCA'}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-zinc-700 mt-4">
            <button
              className={cn(
                "flex-1 py-3 px-4 text-center font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'sell'
                  ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30"
              )}
              onClick={() => setActiveTab('sell')}
            >
              <DollarSign className="w-4 h-4" />
              Vender
            </button>
            <button
              className={cn(
                "flex-1 py-3 px-4 text-center font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'exchange'
                  ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30"
              )}
              onClick={() => setActiveTab('exchange')}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Trocar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Informações do jogador principal */}
            <div className={cn(
              "p-4 rounded-lg",
              activeTab === 'sell' ? "bg-zinc-800/30" : "bg-purple-600/10 border border-purple-500/20"
            )}>
              <div className="flex items-center gap-4">
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
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white">{player.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-purple-600">{player.position}</Badge>
                    <span className="text-zinc-400 text-sm">OVR {player.overall}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-sm">Valor Base</p>
                  <p className="text-emerald-400 font-bold text-xl">
                    R$ {player.base_price.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {activeTab === 'sell' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna esquerda: Jogadores selecionados */}
                <div className="space-y-4">
                  <div className="bg-zinc-800/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-white">Jogadores para Venda</h3>
                      <Badge className="bg-emerald-600">
                        {selectedSellPlayers.length} selecionado(s)
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedSellPlayers.length > 0 ? (
                        renderSelectedPlayers()
                      ) : (
                        <p className="text-zinc-500 text-center py-4">
                          Selecione jogadores abaixo
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-zinc-400 text-sm">Valor base total:</p>
                          <p className="text-white font-bold text-lg">
                            R$ {minSellValue.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-zinc-400 text-sm">Valor total da venda:</p>
                          <p className="text-emerald-400 font-bold text-xl">
                            R$ {sellTotalValue.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {sellTotalValue < minSellValue && (
                        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-red-400 text-sm">
                              Valor total abaixo do mínimo! Aumente o valor para R$ {minSellValue.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Jogadores disponíveis */}
                  <div className="bg-zinc-800/30 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-white mb-3">Selecionar Jogadores do Seu Time</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availablePlayers.map(availablePlayer => (
                        <div
                          key={availablePlayer.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            selectedSellPlayers.includes(availablePlayer.id)
                              ? "bg-emerald-500/20 border-emerald-500/50"
                              : "bg-zinc-800/30 border-zinc-600 hover:border-zinc-500"
                          )}
                          onClick={() => toggleSellPlayerSelection(availablePlayer.id)}
                        >
                          <Checkbox
                            checked={selectedSellPlayers.includes(availablePlayer.id)}
                            onCheckedChange={() => toggleSellPlayerSelection(availablePlayer.id)}
                          />
                          {availablePlayer.photo_url ? (
                            <img 
                              src={availablePlayer.photo_url} 
                              alt={availablePlayer.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                              <span className="text-sm font-black text-white">{availablePlayer.position}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-white">{availablePlayer.name}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge className="bg-purple-600">{availablePlayer.position}</Badge>
                              <span className="text-zinc-400">OVR {availablePlayer.overall}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-400 font-bold">
                              R$ {availablePlayer.base_price.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coluna direita: Configuração da venda */}
                <div className="space-y-4">
                  <div className="bg-zinc-800/30 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-white mb-3">Configurar Venda</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Valor Total da Transferência
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                          <Input
                            placeholder="0,00"
                            value={transferValue}
                            onChange={handleValueChange}
                            className="pl-10 bg-zinc-800/50 border-zinc-600 h-12 text-lg"
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <p className="text-zinc-500 text-sm">
                            Mínimo: R$ {minSellValue.toLocaleString('pt-BR')}
                          </p>
                          <p className={cn(
                            "text-sm font-medium",
                            sellTotalValue >= minSellValue ? "text-emerald-400" : "text-red-400"
                          )}>
                            {sellTotalValue >= minSellValue ? '✓ Valor válido' : '✗ Abaixo do mínimo'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Vender para
                        </label>
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600 h-12">
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
                  </div>

                  {/* Resumo da venda */}
                  {selectedTeam && selectedSellPlayers.length > 0 && (
                    <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-600">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Resumo da Venda
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Tipo:</span>
                          <span className="text-emerald-400 font-medium">
                            {selectedSellPlayers.length === 1 ? 'Venda Individual' : 'Venda Múltipla'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Jogadores:</span>
                          <span className="text-white">{selectedSellPlayers.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Valor base total:</span>
                          <span className="text-white">R$ {minSellValue.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Valor da venda:</span>
                          <span className={cn(
                            "font-bold",
                            sellTotalValue >= minSellValue ? "text-emerald-400" : "text-red-400"
                          )}>
                            R$ {sellTotalValue.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna esquerda: Seleção do time e jogadores */}
                <div className="space-y-4">
                  <div className="bg-zinc-800/30 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-white mb-3">Selecionar Time para Troca</h3>
                    
                    <Select value={selectedExchangeTeam} onValueChange={setSelectedExchangeTeam}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-600 h-12">
                        <SelectValue placeholder="Selecione um clube para trocar" />
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
                      <div className="bg-zinc-800/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg text-white">Jogadores do Time Oponente</h3>
                          {selectedExchangeTeamInfo && (
                            <div className="flex items-center gap-2">
                              {selectedExchangeTeamInfo.logo_url && (
                                <img 
                                  src={selectedExchangeTeamInfo.logo_url} 
                                  alt={selectedExchangeTeamInfo.name} 
                                  className="w-6 h-6 rounded-full object-contain"
                                />
                              )}
                              <span className="text-sm text-zinc-400">{selectedExchangeTeamInfo.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {teamPlayers.map(teamPlayer => (
                            <div
                              key={teamPlayer.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                selectedPlayers.includes(teamPlayer.id)
                                  ? "bg-blue-500/20 border-blue-500/50"
                                  : "bg-zinc-800/30 border-zinc-600 hover:border-zinc-500"
                              )}
                              onClick={() => toggleExchangePlayerSelection(teamPlayer)}
                            >
                              <Checkbox
                                checked={selectedPlayers.includes(teamPlayer.id)}
                                onCheckedChange={() => toggleExchangePlayerSelection(teamPlayer)}
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
                                {teamPlayer.base_price > player.base_price && (
                                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                                    <ArrowUp className="w-3 h-3" /> Mais valioso
                                  </span>
                                )}
                                {teamPlayer.base_price < player.base_price && (
                                  <span className="text-xs text-red-400 flex items-center gap-1">
                                    <ArrowDown className="w-3 h-3" /> Menos valioso
                                  </span>
                                )}
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

                      <div className="bg-zinc-800/30 p-4 rounded-lg">
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">
                          Dinheiro Adicional
                        </label>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={moneyDirection === 'send' ? "default" : "outline"}
                              onClick={() => setMoneyDirection('send')}
                              className={cn(
                                "flex-1",
                                moneyDirection === 'send' 
                                  ? "bg-red-600 hover:bg-red-700" 
                                  : "bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
                              )}
                            >
                              <ArrowUp className="w-4 h-4 mr-2" />
                              Mandar
                            </Button>
                            <Button
                              type="button"
                              variant={moneyDirection === 'receive' ? "default" : "outline"}
                              onClick={() => setMoneyDirection('receive')}
                              className={cn(
                                "flex-1",
                                moneyDirection === 'receive' 
                                  ? "bg-emerald-600 hover:bg-emerald-700" 
                                  : "bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
                              )}
                            >
                              <ArrowDown className="w-4 h-4 mr-2" />
                              Receber
                            </Button>
                          </div>
                          
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <Input
                              placeholder="0,00"
                              value={exchangeValue}
                              onChange={handleExchangeValueChange}
                              className="pl-10 bg-zinc-800/50 border-zinc-600 h-12 text-lg"
                            />
                          </div>
                          
                          {player.base_price > offeredPlayersValue && moneyDirection === 'receive' && (
                            <div className="text-sm">
                              <p className="text-emerald-400 font-medium">
                                Mínimo necessário: R$ {requiredMoneyToBalance.toLocaleString('pt-BR')}
                              </p>
                              <p className="text-zinc-500 mt-1">
                                Você pode receber mais dinheiro do que o mínimo
                              </p>
                            </div>
                          )}
                          
                          {offeredPlayersValue > player.base_price && moneyDirection === 'send' && (
                            <div className="text-sm">
                              <p className="text-blue-400 font-medium">
                                Você pode mandar qualquer valor (ou nenhum)
                              </p>
                              <p className="text-zinc-500 mt-1">
                                Os jogadores oferecidos já são mais valiosos
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Coluna direita: Resumo da troca */}
                <div className="space-y-4">
                  {(exchangePlayers.length > 0 || cashValue > 0) && (
                    <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-600">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Análise da Troca
                      </h4>
                      
                      {/* Alerta sobre equilíbrio */}
                      <div className={cn(
                        "mb-4 p-3 rounded-md",
                        canProceedWithExchange
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-red-500/10 border border-red-500/20"
                      )}>
                        <div className="flex items-start gap-2">
                          {canProceedWithExchange ? (
                            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className={cn(
                              "font-medium mb-1",
                              canProceedWithExchange ? "text-emerald-400" : "text-red-400"
                            )}>
                              {canProceedWithExchange ? '✅ Troca Equilibrada' : '⚖️ Troca Desequilibrada'}
                            </p>
                            {!canProceedWithExchange && (
                              <div className="text-red-400 text-sm space-y-1">
                                {player.base_price > offeredPlayersValue && moneyDirection === 'send' ? (
                                  <p>{'\u2022'} Seu jogador vale mais! Você deve <span className="font-bold">RECEBER</span> dinheiro.</p>
                                ) : player.base_price > offeredPlayersValue && moneyDirection === 'receive' && !isMoneyAmountSufficient ? (
                                  <p>{'\u2022'} Valor de dinheiro insuficiente! Precisa receber pelo menos R$ {requiredMoneyToBalance.toLocaleString('pt-BR')}</p>
                                ) : !isExchangeBalanced ? (
                                  <p>{'\u2022'} Valor total insuficiente! Precisa adicionar R$ {Math.abs(exchangeDifference).toLocaleString('pt-BR')}</p>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Verificação específica de valor */}
                      {exchangePlayers.length > 0 && (
                        <div className={cn(
                          "mb-4 p-3 rounded-md",
                          isMyPlayerHigherValue 
                            ? "bg-purple-500/10 border border-purple-500/20" 
                            : isTotalOfferedValueHigher
                            ? "bg-blue-500/10 border border-blue-500/20"
                            : "bg-zinc-800/50 border border-zinc-600"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            {isMyPlayerHigherValue ? (
                              <ArrowUp className="w-4 h-4 text-purple-400" />
                            ) : isTotalOfferedValueHigher ? (
                              <ArrowDown className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Scale className="w-4 h-4 text-zinc-400" />
                            )}
                            <span className={cn(
                              "font-medium",
                              isMyPlayerHigherValue ? "text-purple-400" : 
                              isTotalOfferedValueHigher ? "text-blue-400" : 
                              "text-zinc-400"
                            )}>
                              {isMyPlayerHigherValue ? 'Seu jogador vale MAIS' : 
                               isTotalOfferedValueHigher ? 'Jogadores oferecidos valem MAIS' : 
                               'Valores similares'}
                            </span>
                          </div>
                          
                          {isMyPlayerHigherValue && (
                            <div className="text-sm text-zinc-300 space-y-1">
                              <p>{'\u2022'} Você deve <span className="text-emerald-400 font-bold">RECEBER</span> dinheiro</p>
                              <p>{'\u2022'} Mínimo necessário: R$ {requiredMoneyToBalance.toLocaleString('pt-BR')}</p>
                              <p>{'\u2022'} Pode receber mais do que o mínimo</p>
                              {selectedExchangeTeamInfo && (
                                <p className="text-emerald-400">
                                  {selectedExchangeTeamInfo.logo_url && (
                                    <img 
                                      src={selectedExchangeTeamInfo.logo_url} 
                                      alt={selectedExchangeTeamInfo.name} 
                                      className="w-4 h-4 inline-block mr-1 rounded-full"
                                    />
                                  )}
                                  <span className="font-medium">{selectedExchangeTeamInfo.name}</span> deve adicionar este valor
                                </p>
                              )}
                            </div>
                          )}
                          
                          {isTotalOfferedValueHigher && (
                            <div className="text-sm text-zinc-300 space-y-1">
                              <p>{'\u2022'} Você <span className="text-blue-400 font-bold">PODE</span> mandar dinheiro (opcional)</p>
                              <p>{'\u2022'} Não há valor mínimo obrigatório</p>
                              <p>{'\u2022'} Pode mandar qualquer valor (ou nenhum)</p>
                              <p className="text-blue-400 font-medium">
                                Os jogadores oferecidos já são mais valiosos!
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Informações sobre jogador mais valioso */}
                      {highestValuePlayer && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 font-medium">Jogador mais valioso oferecido:</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {highestValuePlayer.photo_url ? (
                              <img 
                                src={highestValuePlayer.photo_url} 
                                alt={highestValuePlayer.name} 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-cyan-700 flex items-center justify-center">
                                <span className="text-xs font-black text-white">{highestValuePlayer.position}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-white font-medium">{highestValuePlayer.name}</p>
                              <p className="text-emerald-400 text-sm">
                                R$ {highestValuePlayer.base_price.toLocaleString('pt-BR')}
                              </p>
                            </div>
                            {highestValuePlayer.base_price > player.base_price && (
                              <Badge className="bg-emerald-600">MAIS VALIOSO</Badge>
                            )}
                            {highestValuePlayer.base_price < player.base_price && (
                              <Badge className="bg-red-600">MENOS VALIOSO</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Resumo dos valores */}
                      <div className="space-y-2">
                        <h5 className="font-semibold text-white mb-2">Resumo Financeiro</h5>
                        
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
                        
                        {cashValue > 0 && (
                          <div className="flex items-center justify-between border-t border-zinc-600 pt-2">
                            <span className="text-white">
                              Dinheiro ({moneyDirection === 'send' ? 'Mandar' : 'Receber'})
                            </span>
                            <span className={cn(
                              moneyDirection === 'send' ? "text-red-400" : "text-emerald-400"
                            )}>
                              {moneyDirection === 'send' ? '-' : '+'}R$ {formatCurrency(exchangeValue)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between border-t border-zinc-600 pt-2">
                          <span className="text-white font-medium">Valor total recebido</span>
                          <span className={cn(
                            "font-bold text-lg",
                            totalTransactionValue >= player.base_price ? "text-emerald-400" : "text-red-400"
                          )}>
                            R$ {totalTransactionValue.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">Valor do seu jogador</span>
                          <span className="text-purple-400 font-bold text-lg">
                            R$ {player.base_price.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-zinc-600 pt-2">
                          <span className="text-white font-bold">Balanço final</span>
                          <span className={cn(
                            "text-xl font-bold",
                            exchangeDifference >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {exchangeDifference >= 0 ? '+' : '-'}R$ {Math.abs(exchangeDifference).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Mensagem de bloqueio quando condições não atendidas */}
                      {shouldShowInsufficientValueAlert && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                          <div className="flex items-start gap-2">
                            <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-red-400 font-medium mb-1">⚠️ Ajuste Necessário</p>
                              <div className="text-red-400 text-sm space-y-1">
                                {player.base_price > offeredPlayersValue && moneyDirection === 'send' ? (
                                  <>
                                    <p>{'\u2022'} Seu jogador vale R$ {player.base_price.toLocaleString('pt-BR')} (MAIS)</p>
                                    <p>{'\u2022'} Jogadores oferecidos: R$ {offeredPlayersValue.toLocaleString('pt-BR')} (MENOS)</p>
                                    <p className="font-bold">{'\u2022'} Você deve RECEBER dinheiro do outro time</p>
                                  </>
                                ) : player.base_price > offeredPlayersValue && moneyDirection === 'receive' && !isMoneyAmountSufficient ? (
                                  <>
                                    <p>{'\u2022'} Valor de dinheiro atual: R$ {formatCurrency(exchangeValue)}</p>
                                    <p>{'\u2022'} Mínimo necessário: R$ {requiredMoneyToBalance.toLocaleString('pt-BR')}</p>
                                    <p className="font-bold">{'\u2022'} Aumente o valor para receber pelo menos o mínimo</p>
                                  </>
                                ) : !isExchangeBalanced ? (
                                  <>
                                    <p>{'\u2022'} Valor total recebido: R$ {totalTransactionValue.toLocaleString('pt-BR')}</p>
                                    <p>{'\u2022'} Valor necessário: R$ {player.base_price.toLocaleString('pt-BR')}</p>
                                    <p className="font-bold">{'\u2022'} Adicione mais valor para equilibrar</p>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instruções gerais */}
                  <div className="bg-zinc-800/30 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-zinc-400">
                        <p className="font-medium text-white mb-1">Regras da Troca:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><span className="text-purple-400">Seu jogador vale mais</span>: Configure para <span className="text-emerald-400">RECEBER</span> dinheiro</li>
                          <li><span className="text-blue-400">Jogadores oferecidos valem mais</span>: Você pode <span className="text-red-400">MANDAR</span> dinheiro (opcional)</li>
                          <li>Se recebendo dinheiro: valor deve ser pelo menos a diferença</li>
                          <li>Se mandando dinheiro: pode mandar qualquer valor (incluindo 0)</li>
                          <li>A troca só é liberada quando o valor total recebido ≥ valor do seu jogador</li>
                          <li>Valor mínimo: R$ {player.base_price.toLocaleString('pt-BR')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-zinc-700 bg-zinc-900/80">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="sm:flex-1 bg-transparent border-zinc-600 hover:bg-zinc-800 h-12"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={activeTab === 'exchange' && !canProceedWithExchange}
              className={cn(
                "sm:flex-1 h-12 font-bold",
                activeTab === 'sell' 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {activeTab === 'sell' ? (
                <>ENVIAR PROPOSTA DE VENDA</>
              ) : (
                <>
                  {canProceedWithExchange ? (
                    'CONFIRMAR TROCA EQUILIBRADA'
                  ) : (
                    'AJUSTE OS VALORES PARA PROSSEGUIR'
                  )}
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {activeTab === 'exchange' && !canProceedWithExchange && exchangePlayers.length > 0 && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium mb-1">Não é possível enviar a proposta</p>
                  <div className="text-red-400 text-sm space-y-1">
                    {player.base_price > offeredPlayersValue && moneyDirection === 'send' ? (
                      <>
                        <p>{'\u2022'} Seu jogador: R$ {player.base_price.toLocaleString('pt-BR')}</p>
                        <p>{'\u2022'} Jogadores oferecidos: R$ {offeredPlayersValue.toLocaleString('pt-BR')}</p>
                        <p className="font-bold mt-1">{'\u2022'} Mude para "Receber" dinheiro e adicione pelo menos R$ {requiredMoneyToBalance.toLocaleString('pt-BR')}</p>
                      </>
                    ) : player.base_price > offeredPlayersValue && moneyDirection === 'receive' && !isMoneyAmountSufficient ? (
                      <>
                        <p>{'\u2022'} Mínimo necessário: R$ {requiredMoneyToBalance.toLocaleString('pt-BR')}</p>
                        <p>{'\u2022'} Valor atual: R$ {formatCurrency(exchangeValue)}</p>
                        <p className="font-bold mt-1">{'\u2022'} Aumente o valor para receber pelo menos R$ {requiredMoneyToBalance.toLocaleString('pt-BR')}</p>
                      </>
                    ) : !isExchangeBalanced ? (
                      <>
                        <p>{'\u2022'} Valor necessário: R$ {player.base_price.toLocaleString('pt-BR')}</p>
                        <p>{'\u2022'} Valor recebido: R$ {totalTransactionValue.toLocaleString('pt-BR')}</p>
                        <p className="font-bold mt-1">{'\u2022'} Adicione pelo menos R$ {Math.abs(exchangeDifference).toLocaleString('pt-BR')} para equilibrar</p>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}