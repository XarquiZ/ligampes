"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search, Grid3X3, List, ChevronDown, Star, AlertCircle, Filter, Check, Circle, Square, Pencil, Footprints, Target, DollarSign, ArrowRightLeft, X, Users, Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'

interface Player {
  id: string
  name: string
  position: string
  overall: number
  club: string
  nationality: string
  base_price: number
  logo_url: string | null
  photo_url?: string | null
  preferred_foot: string | null
  team_id: string | null
  skills: string[] | null
  playstyle?: string | null
  alternative_positions?: string[] | null
  age?: number | null
  height?: number | null
  is_penalty_specialist?: boolean | null
  injury_resistance?: number | null
  
  // NOVAS ESTATÍSTICAS - adicione estas linhas
  total_goals?: number
  total_assists?: number
  total_yellow_cards?: number
  total_red_cards?: number
  total_matches?: number
  average_rating?: number

  // ... mantenha todos os outros atributos existentes
  offensive_talent?: number
  ball_control?: number
  dribbling?: number
  tight_possession?: number
  low_pass?: number
  lofted_pass?: number
  finishing?: number
  heading?: number
  place_kicking?: number
  curl?: number
  speed?: number
  acceleration?: number
  kicking_power?: number
  jump?: number
  physical_contact?: number
  balance?: number
  stamina?: number
  defensive_awareness?: number
  ball_winning?: number
  aggression?: number
  gk_awareness?: number
  gk_catching?: number
  gk_clearing?: number
  gk_reflexes?: number
  gk_reach?: number

  weak_foot_usage?: number | null
  weak_foot_accuracy?: number | null
  form?: number | null
  inspiring_ball_carry?: number | null
  inspiring_low_pass?: number | null
  inspiring_lofted_pass?: number | null
}

interface Team { 
  id: string; 
  name: string; 
  logo_url: string | null 
}

interface TransferModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (transferData: {
    playerId: string
    playerName: string
    fromTeamId: string
    toTeamId: string
    value: number
    type: 'sell' | 'exchange'
    exchangePlayers?: string[]
    exchangeValue?: number
  }) => void
  teams: Team[]
}

// Componente do Modal de Transferência ATUALIZADO
const TransferModal: React.FC<TransferModalProps> = ({ 
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
  
  // Estados para troca
  const [exchangePlayers, setExchangePlayers] = useState<Player[]>([])
  const [exchangeValue, setExchangeValue] = useState("")
  const [selectedExchangeTeam, setSelectedExchangeTeam] = useState("")
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  // Resetar form quando modal abrir
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

  // Carregar jogadores do time selecionado para troca
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
          .neq('id', player?.id) // Excluir o jogador que está sendo negociado

        setTeamPlayers(data || [])
      } catch (error) {
        console.error('Erro ao carregar jogadores do time:', error)
        setTeamPlayers([])
      }
    }

    loadTeamPlayers()
  }, [selectedExchangeTeam, player?.id])

  // Calcular valor total da troca
  const exchangeTotalValue = useMemo(() => {
    const playersValue = exchangePlayers.reduce((total, p) => total + p.base_price, 0)
    const cashValue = parseFloat(exchangeValue.replace(/\./g, '').replace(',', '.')) || 0
    return playersValue + cashValue
  }, [exchangePlayers, exchangeValue])

  // Valor mínimo necessário para a troca
  const minExchangeValue = player?.base_price || 0

  if (!isOpen || !player) return null

  const handleConfirm = () => {
    if (activeTab === 'sell') {
      // Validações para venda
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
      // Validações para troca
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
          {/* Info do Jogador */}
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

          {/* Valor Base */}
          <div className="bg-zinc-800/30 p-3 rounded-lg">
            <p className="text-zinc-400 text-sm">Valor Base</p>
            <p className="text-emerald-400 font-bold text-lg">
              R$ {player.base_price.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Abas Vender/Trocar */}
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

          {/* Conteúdo das Abas */}
          {activeTab === 'sell' ? (
            // ABA VENDER
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
            // ABA TROCAR
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

                  {/* Resumo da Troca */}
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

// Componente do Modal de Dispensa
interface DismissModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (playerId: string, playerName: string, overall: number) => void
}

const DismissModal: React.FC<DismissModalProps> = ({ 
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
          {/* Info do Jogador */}
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

          {/* Valor da Dispensa */}
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

          {/* Aviso */}
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

// Componente LevelBars atualizado
function LevelBars({ value = 0, max = 3, size = 'sm' }: { value?: number | null; max?: number; size?: 'sm' | 'md' }) {
  const v = Math.max(0, Math.min(max, value ?? 0))
  const w = size === 'sm' ? 'w-4 h-2' : 'w-6 h-2.5'
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const active = i < v
        return (
          <div
            key={i}
            className={cn(
              `${w} rounded-sm transition-all`,
              active ? 'bg-yellow-400 shadow-sm' : 'bg-zinc-700/80'
            )}
          />
        )
      })}
    </div>
  )
}

export default function ElencoPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')

  // Estados para o chat
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Filtros atualizados para checkboxes
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedPlaystyles, setSelectedPlaystyles] = useState<string[]>([])
  
  // Estados para controlar abertura dos filtros
  const [positionFilterOpen, setPositionFilterOpen] = useState(false)
  const [playstyleFilterOpen, setPlaystyleFilterOpen] = useState(false)

  // Estados para transferência
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])

  // Estados para dispensa
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [playerToDismiss, setPlayerToDismiss] = useState<Player | null>(null)

  // control opened in list view
  const [openedPlayers, setOpenedPlayers] = useState<string[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  const POSITIONS = ['GO','ZC','LE','LD','VOL','MLG','MAT','MLE','MLD','PTE','PTD','SA','CA']
  const PLAYSTYLES = ['Artilheiro', 'Armador criativo', 'Atacante surpresa', 'Clássica nº 10', 'Especialista em cruz.', 'Goleiro defensivo', 'Goleiro ofensivo', 'Homem de área', 'Jog. de infiltração', 'Jog. de Lado de Campo', 'Lateral móvel', 'Meia versátil', 'Nenhum', 'Orquestrador', 'Pivô', 'Ponta velocista', 'Primeiro volante', 'Provocador', 'Puxa marcação', 'Volantão', 'Zagueiro defensivo', 'Zagueiro ofensivo']

  // color map like PES mapping requested
  const getAttrColorHex = (value:number) => {
    if (value >= 95) return '#4FC3F7' // azul claro
    if (value >= 85) return '#8BC34A' // verde claro
    if (value >= 75) return '#FB8C00' // laranja
    return '#E53935' // vermelho
  }

  // Funções auxiliares simplificadas
  const formatHeight = (height: number | null | undefined) => {
    if (height === null || height === undefined) return '-'
    return `${height}cm`
  }

  // Componente de Checkbox personalizado com caixa branca
  const CustomCheckbox = ({ 
    checked, 
    onChange, 
    id, 
    label 
  }: { 
    checked: boolean; 
    onChange: () => void; 
    id: string; 
    label: string;
  }) => (
    <div className="flex items-center space-x-3 cursor-pointer" onClick={onChange}>
      <div className={cn(
        "w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200",
        checked 
          ? "bg-white border-white" 
          : "bg-transparent border-white"
      )}>
        {checked && (
          <Check className="w-3 h-3 text-black font-bold" />
        )}
      </div>
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none cursor-pointer flex-1"
      >
        {label}
      </label>
    </div>
  )

  // Carrega dados do usuário para o Sidebar
  useEffect(() => {
    if (authLoading || !user) return

    const loadUserData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
          .single()

        if (!profileError) {
          setProfile(profileData)
          setTeam(profileData?.teams || null)
          setTeamId(profileData?.teams?.id || null)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadUserData()
  }, [authLoading, user])

  // Carregar contagem de mensagens não lidas
  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCount = async () => {
      try {
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        if (!conversations?.length) {
          setUnreadCount(0)
          return
        }

        const conversationIds = conversations.map(conv => conv.id)
        
        const { count } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('read', false)
          .neq('sender_id', user.id)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Erro ao carregar contagem de mensagens:', error)
      }
    }

    loadUnreadCount()

    // Subscription para atualizar em tempo real
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages'
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const loadPlayers = useCallback(async () => {
    if (!teamId) { setPlayers([]); setFilteredPlayers([]); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
      
      const mapped = (data || []).map((p:any) => ({
        ...p,
        club: p.team_id ? (p.team_id === teamId ? (team?.name ?? 'Meu Time') : 'Outro') : 'Sem Time',
        logo_url: p.team_id === teamId ? (team?.logo_url ?? null) : p.logo_url ?? null,
        skills: p.skills || [],
        alternative_positions: p.alternative_positions || [],
        preferred_foot: p.preferred_foot || 'Nenhum',
        playstyle: p.playstyle || null,
        nationality: p.nationality || 'Desconhecida',
        height: p.height || null,
        is_penalty_specialist: p.is_penalty_specialist || false,
        injury_resistance: p.injury_resistance || null,
        // As estatísticas já virão automaticamente do SELECT *
        total_goals: p.total_goals || 0,
        total_assists: p.total_assists || 0,
        total_yellow_cards: p.total_yellow_cards || 0,
        total_red_cards: p.total_red_cards || 0,
        total_matches: p.total_matches || 0,
        average_rating: p.average_rating || 0
      }))
      setPlayers(mapped)
      setFilteredPlayers(mapped)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase, teamId, team])

  // Carregar todos os times para o select
  const loadAllTeams = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .order('name')
      
      setAllTeams(data || [])
    } catch (e) {
      console.error('Erro ao carregar times:', e)
    }
  }, [supabase])

  useEffect(() => { 
    loadAllTeams()
  }, [loadAllTeams])

  useEffect(() => { loadPlayers() }, [loadPlayers])

  // Função para abrir modal de transferência
  const handleSellPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setTransferModalOpen(true)
  }

  // Função para abrir modal de dispensa
  const handleDismissPlayer = (player: Player) => {
    setPlayerToDismiss(player)
    setDismissModalOpen(true)
  }

  // Função para confirmar dispensa - VERSÃO SIMPLIFICADA E ROBUSTA
  const handleConfirmDismiss = async (playerId: string, playerName: string, overall: number) => {
    try {
      const dismissValue = overall <= 73 ? 2_000_000 : 5_000_000

      console.log('🔄 Iniciando dispensa do jogador:', playerName)

      // 1. PRIMEIRO: Remover jogador do time (ação principal)
      console.log('🗑️ Removendo jogador do time...')
      const { error: playerError } = await supabase
        .from('players')
        .update({ team_id: null })
        .eq('id', playerId)

      if (playerError) {
        console.error('❌ Erro ao remover jogador do time:', playerError)
        throw new Error(`Falha ao remover jogador: ${playerError.message}`)
      }

      console.log('✅ Jogador removido do time com sucesso')

      // 2. TENTAR registrar transação de saldo (opcional)
      try {
        console.log('💰 Tentando registrar transação de saldo...')
        const { error: balanceError } = await supabase
          .from('balance_transactions')
          .insert([{
            team_id: teamId,
            amount: dismissValue,
            type: 'credit',
            description: `Dispensa de jogador - ${playerName}`,
            created_at: new Date().toISOString(),
            player_name: playerName
          }])

        if (balanceError) {
          console.warn('⚠️ Aviso: Não foi possível registrar transação de saldo:', balanceError.message)
        } else {
          console.log('✅ Transação de saldo registrada')
        }
      } catch (balanceError) {
        console.warn('⚠️ Aviso: Erro no registro de saldo (continuando...):', balanceError)
      }

      // 3. TENTAR atualizar saldo do time (opcional)
      try {
        console.log('🔄 Tentando atualizar saldo do time...')
        const { data: currentTeam } = await supabase
          .from('teams')
          .select('balance')
          .eq('id', teamId)
          .single()

        if (currentTeam) {
          const newBalance = currentTeam.balance + dismissValue
          const { error: teamError } = await supabase
            .from('teams')
            .update({ balance: newBalance })
            .eq('id', teamId)

          if (teamError) {
            console.warn('⚠️ Aviso: Não foi possível atualizar saldo do time:', teamError.message)
          } else {
            console.log('✅ Saldo do time atualizado')
          }
        }
      } catch (balanceUpdateError) {
        console.warn('⚠️ Aviso: Erro na atualização de saldo (continuando...):', balanceUpdateError)
      }

      // 4. TENTAR registrar na tabela de transferências (opcional)
      try {
        console.log('📝 Tentando registrar na tabela de transferências...')
        const transferPayload = {
          player_id: playerId,
          player_name: playerName,
          from_team_id: teamId,
          to_team_id: null,
          value: dismissValue,
          status: 'approved',
          approved_by_seller: true,
          approved_by_buyer: true,
          approved_by_admin: true,
          created_at: new Date().toISOString(),
          transfer_type: 'dismiss',
          is_exchange: false,
          exchange_players: [],
          exchange_value: 0
        }

        const { error: transferError } = await supabase
          .from('player_transfers')
          .insert([transferPayload])

        if (transferError) {
          console.warn('⚠️ Aviso: Não foi possível registrar transferência:', transferError.message)
        } else {
          console.log('✅ Transferência registrada')
        }
      } catch (transferError) {
        console.warn('⚠️ Aviso: Erro no registro de transferência (continuando...):', transferError)
      }

      // Sucesso - mesmo que algumas operações falhem, o essencial (remover jogador) foi feito
      setDismissModalOpen(false)
      setPlayerToDismiss(null)
      
      // Recarregar jogadores
      loadPlayers()
      
      console.log('🎉 Dispensa concluída com sucesso!')
      alert(`✅ ${playerName} dispensado com sucesso!\nValor da dispensa: R$ ${dismissValue.toLocaleString('pt-BR')}`)
      
    } catch (error: any) {
      console.error('💥 Erro crítico ao dispensar jogador:', error)
      alert(`❌ Erro ao dispensar jogador: ${error.message || 'Erro desconhecido'}`)
    }
  }

  // Função para confirmar transferência - ATUALIZADA PARA SUPORTAR TROCA
  const handleConfirmTransfer = async (transferData: {
    playerId: string
    playerName: string
    fromTeamId: string
    toTeamId: string
    value: number
    type: 'sell' | 'exchange'
    exchangePlayers?: string[]
    exchangeValue?: number
  }) => {
    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        alert('Erro: Usuário não autenticado')
        return
      }

      console.log('🔍 DEBUG - Dados da transferência:', transferData)

      // Preparar dados para inserção
      const transferPayload: any = {
        player_id: transferData.playerId,
        player_name: transferData.playerName,
        from_team_id: transferData.fromTeamId,
        to_team_id: transferData.toTeamId,
        value: transferData.value,
        status: 'pending',
        approved_by_seller: true,
        approved_by_buyer: false,
        approved_by_admin: false,
        created_at: new Date().toISOString(),
        transfer_type: transferData.type
      }

      // Adicionar dados específicos de troca
      if (transferData.type === 'exchange') {
        transferPayload.exchange_players = transferData.exchangePlayers || []
        transferPayload.exchange_value = transferData.exchangeValue || 0
        transferPayload.is_exchange = true
      }

      const { data, error } = await supabase
        .from('player_transfers')
        .insert([transferPayload])
        .select()

      if (error) {
        console.error('❌ Erro Supabase detalhado:', error)
        
        if (error.code === '42501') {
          alert('Erro de permissão: Contate o administrador para configurar as políticas de segurança.')
        } else {
          alert(`Erro ao enviar proposta: ${error.message}`)
        }
        return
      }

      // Sucesso
      console.log('✅ Transferência criada com sucesso:', data)
      setTransferModalOpen(false)
      setSelectedPlayer(null)
      
      // Recarregar os jogadores para refletir possíveis mudanças
      loadPlayers()
      
      const message = transferData.type === 'sell' 
        ? '✅ Proposta de transferência enviada com sucesso! Aguarde a aprovação do comprador e do administrador.'
        : '✅ Proposta de troca enviada com sucesso! Aguarde a aprovação do outro time e do administrador.'
      
      alert(message)
      
    } catch (e) {
      console.error('💥 Erro inesperado:', e)
      alert('Erro inesperado ao enviar proposta')
    }
  }

  // Funções para manipular checkboxes
  const togglePosition = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    )
  }

  const togglePlaystyle = (playstyle: string) => {
    setSelectedPlaystyles(prev =>
      prev.includes(playstyle)
        ? prev.filter(p => p !== playstyle)
        : [...prev, playstyle]
    )
  }

  const clearPositionFilters = () => setSelectedPositions([])
  const clearPlaystyleFilters = () => setSelectedPlaystyles([])

  const togglePlayer = useCallback((playerId: string) => {
    if (isTransitioning) return;
    setOpenedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }, [isTransitioning])

  // NOVA FUNÇÃO: Handle click no card do grid para expandir na lista
  const handleGridCardClick = useCallback((player: Player) => {
    // Mudar para vista de lista
    setViewMode('list')
    
    // Aguardar um pouco para a transição de vista e depois expandir o jogador
    setTimeout(() => {
      // Fechar todos os outros e abrir apenas este jogador
      setOpenedPlayers([player.id])
      
      // Scroll para o jogador
      const element = document.getElementById(`player-${player.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }, [])

  useEffect(() => {
    let f = [...players]
    if (search) f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    
    // Filtro por posições (múltipla seleção)
    if (selectedPositions.length > 0) {
      f = f.filter(p => selectedPositions.includes(p.position))
    }
    
    // Filtro por estilos de jogo (múltipla seleção)
    if (selectedPlaystyles.length > 0) {
      f = f.filter(p => p.playstyle && selectedPlaystyles.includes(p.playstyle))
    }
    
    setFilteredPlayers(f)
  }, [search, selectedPositions, selectedPlaystyles, players])

  const renderClubLogo = (url:string|null, name:string) => url ? <img src={url} alt={name} className="w-8 h-8 object-contain rounded-full ring-2 ring-zinc-700" onError={(e)=> (e.currentTarget as HTMLImageElement).style.display='none'} /> : null

  // attribute labels mapping for list view
  const ATTR_LABELS: Record<string,string> = {
    offensive_talent: 'Tal. Ofensivo',
    ball_control: 'Controle de bola',
    dribbling: 'Drible',
    tight_possession: 'Condução Firme',
    low_pass: 'Passe rasteiro',
    lofted_pass: 'Passe Alto',
    finishing: 'Finalização',
    heading: 'Cabeceio',
    place_kicking: 'Chute colocado',
    curl: 'Curva',
    speed: 'Velocidade',
    acceleration: 'Aceleração',
    kicking_power: 'Força do chute',
    jump: 'Impulsão',
    physical_contact: 'Contato Físico',
    balance: 'Equilíbrio',
    stamina: 'Resistência',
    defensive_awareness: 'Talento defensivo',
    ball_winning: 'Desarme',
    aggression: 'Agressividade',
    gk_awareness: 'Talento de GO',
    gk_catching: 'Firmeza de GO',
    gk_clearing: 'Afast. de bola de GO',
    gk_reflexes: 'Reflexos de GO',
    gk_reach: 'Alcance de GO',
  }

  // list of attributes in the order to display
  const ATTR_ORDER = [
    'offensive_talent','ball_control','dribbling','tight_possession','low_pass','lofted_pass','finishing','heading','place_kicking','curl',
    'speed','acceleration','kicking_power','jump','physical_contact','balance','stamina','defensive_awareness','ball_winning','aggression',
    'gk_awareness','gk_catching','gk_clearing','gk_reflexes','gk_reach'
  ]

  // FUNÇÃO ATUALIZADA: Agora usa dados reais do Supabase
  const getPlayerStats = (player: Player) => {
    return {
      goals: player.total_goals || 0,
      assists: player.total_assists || 0,
      yellowCards: player.total_yellow_cards || 0,
      redCards: player.total_red_cards || 0,
      averageRating: player.average_rating ? player.average_rating.toFixed(1) : '0.0'
    }
  }

  // Componente para exibir cada estatística
  const StatItem = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
    <div className="flex flex-col items-center justify-center">
      <div className="text-zinc-400 mb-1">{icon}</div>
      <div className={cn(
        "text-xs font-semibold text-center min-h-[16px]",
        value === 0 || value === '0' || value === '0.0' || value === '-' ? "text-zinc-500" : "text-white"
      )}>
        {value === 0 || value === '0' || value === '0.0' || value === '-' ? '-' : value}
      </div>
    </div>
  )

  // Criar objetos compatíveis com os componentes de chat
  const chatUser = useMemo(() => ({
    id: user?.id || '',
    name: profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico',
    email: user?.email || ''
  }), [user, profile])

  const chatTeam = useMemo(() => ({
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }), [team])

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar user={user!} profile={profile} team={team} />

      {/* Conteúdo Principal */}
      <div className="flex-1 transition-all duration-300 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-8 mb-6 lg:mb-8">
              <div className="flex items-center gap-3 lg:gap-4">
                {team?.logo_url && <img src={team.logo_url} alt={team.name} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-contain" />}
                <div>
                  <h1 className="text-2xl lg:text-4xl font-black">Elenco {team ? `- ${team.name}` : ''}</h1>
                  <p className="text-zinc-400 text-sm lg:text-base">Jogadores do seu time</p>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                <div className="relative">
                  <Input 
                    placeholder="Procurar..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="pl-10 w-48 lg:w-64 h-9 lg:h-10 bg-zinc-900/70 border-zinc-700 text-sm" 
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                </div>

                {/* Filtro de Posições com Checkboxes */}
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className={cn(
                      "h-9 lg:h-10 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-xs lg:text-sm",
                      selectedPositions.length > 0 && "border-purple-500 text-purple-400"
                    )}
                    onClick={() => setPositionFilterOpen(!positionFilterOpen)}
                  >
                    <Filter className="w-3 h-3 lg:w-4 lg:h-4" />
                    Posições
                    {selectedPositions.length > 0 && (
                      <Badge className="bg-purple-600 text-xs h-4 px-1 min-w-4">{selectedPositions.length}</Badge>
                    )}
                  </Button>
                  
                  {positionFilterOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 lg:w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-10 p-3 lg:p-4">
                      <div className="flex justify-between items-center mb-2 lg:mb-3">
                        <h3 className="font-semibold text-sm lg:text-base">Filtrar por Posição</h3>
                        {selectedPositions.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearPositionFilters}
                            className="text-xs text-red-400 hover:text-red-300 h-6"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1 lg:space-y-2 max-h-48 lg:max-h-60 overflow-y-auto">
                        {POSITIONS.map(position => (
                          <CustomCheckbox
                            key={position}
                            id={`position-${position}`}
                            checked={selectedPositions.includes(position)}
                            onChange={() => togglePosition(position)}
                            label={position}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Filtro de Estilos de Jogo com Checkboxes */}
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className={cn(
                      "h-9 lg:h-10 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-xs lg:text-sm",
                      selectedPlaystyles.length > 0 && "border-purple-500 text-purple-400"
                    )}
                    onClick={() => setPlaystyleFilterOpen(!playstyleFilterOpen)}
                  >
                    <Filter className="w-3 h-3 lg:w-4 lg:h-4" />
                    Estilos
                    {selectedPlaystyles.length > 0 && (
                      <Badge className="bg-purple-600 text-xs h-4 px-1 min-w-4">{selectedPlaystyles.length}</Badge>
                    )}
                  </Button>
                  
                  {playstyleFilterOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 lg:w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-10 p-3 lg:p-4">
                      <div className="flex justify-between items-center mb-2 lg:mb-3">
                        <h3 className="font-semibold text-sm lg:text-base">Filtrar por Estilo</h3>
                        {selectedPlaystyles.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearPlaystyleFilters}
                            className="text-xs text-red-400 hover:text-red-300 h-6"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1 lg:space-y-2 max-h-48 lg:max-h-60 overflow-y-auto">
                        {PLAYSTYLES.map(playstyle => (
                          <CustomCheckbox
                            key={playstyle}
                            id={`playstyle-${playstyle}`}
                            checked={selectedPlaystyles.includes(playstyle)}
                            onChange={() => togglePlaystyle(playstyle)}
                            label={playstyle}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex bg-zinc-900/70 rounded-lg lg:rounded-xl p-1 border border-zinc-700">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('grid')} 
                    className={cn('rounded-md lg:rounded-lg text-xs', viewMode === 'grid' && 'bg-purple-600')}
                  >
                    <Grid3X3 className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('list')} 
                    className={cn('rounded-md lg:rounded-lg text-xs', viewMode === 'list' && 'bg-purple-600')}
                  >
                    <List className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Button>
                </div>
              </div>
            </header>

            {/* Fechar filtros quando clicar fora */}
            {(positionFilterOpen || playstyleFilterOpen) && (
              <div 
                className="fixed inset-0 z-0 bg-transparent cursor-default"
                onClick={(e) => {
                  e.preventDefault()
                  setPositionFilterOpen(false)
                  setPlaystyleFilterOpen(false)
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            )}

            {loading && (
              <div className="flex justify-center py-16 lg:py-20">
                <Loader2 className="w-12 h-12 lg:w-16 lg:h-16 animate-spin text-purple-400" />
              </div>
            )}

            {!loading && filteredPlayers.length === 0 && (
              <div className="text-center py-16 lg:py-20">
                <div className="inline-block bg-zinc-900/80 rounded-2xl lg:rounded-3xl p-8 lg:p-12 border border-zinc-800">
                  <AlertCircle className="w-10 h-10 lg:w-12 lg:h-12 text-red-500 mx-auto mb-3 lg:mb-4" />
                  <h3 className="text-xl lg:text-2xl font-bold">Nenhum jogador no elenco</h3>
                  <p className="text-zinc-400 text-sm lg:text-base">Verifique se seu perfil está associado a um time.</p>
                </div>
              </div>
            )}

            {/* GRID VIEW - ATUALIZADO COM CLICK PARA EXPANDIR NA LISTA E BOTÕES CORRIGIDOS */}
            {viewMode === 'grid' && !loading && filteredPlayers.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
                {filteredPlayers.map(j => {
                  const stats = getPlayerStats(j)
                  return (
                    <div
                      key={j.id}
                      className="group relative bg-zinc-900/90 rounded-xl lg:rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/70 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl lg:hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer select-none"
                      onClick={() => handleGridCardClick(j)}
                      onMouseDown={(e) => e.preventDefault()}
                      tabIndex={0}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {/* FOTO MENOR + OVR DESTACADO SEM NOME EM CIMA */}
                      <div className="relative h-40 lg:h-52 bg-zinc-800">
                        {j.photo_url ? (
                          <img
                            src={j.photo_url}
                            alt={j.name}
                            className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                            <span className="text-4xl lg:text-6xl font-black text-zinc-500 opacity-70">{j.position}</span>
                          </div>
                        )}

                        {/* OVR estilo PES */}
                        <div className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-black/70 backdrop-blur px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-zinc-700 flex flex-col items-center">
                          <span className="text-2xl lg:text-3xl font-black text-yellow-400">{j.overall}</span>
                          <span className="text-[8px] lg:text-[10px] text-zinc-300 -mt-1">OVR</span>
                        </div>
                      </div>

                      {/* ÁREA DE INFORMAÇÕES FORA DA FOTO */}
                      <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">

                        {/* Nome */}
                        <h3 className="font-bold text-base lg:text-lg text-center leading-tight line-clamp-2">{j.name}</h3>

                        {/* Posição */}
                        <div className="flex justify-center">
                          <Badge className="bg-purple-600 text-white text-xs font-bold px-3 lg:px-4 py-1 lg:py-1.5">{j.position}</Badge>
                        </div>

                        {/* Estilo de jogo */}
                        <p className="text-xs text-zinc-400 text-center">{j.playstyle || 'Nenhum'}</p>

                        {/* LINHA COM 5 ESTATÍSTICAS - AGORA COM DADOS REAIS */}
                        <div className="grid grid-cols-5 gap-1 lg:gap-2 py-2 border-y border-zinc-700/50">
                          <StatItem
                            icon={<Target className="w-3 h-3 lg:w-4 lg:h-4" />}
                            value={stats.goals}
                            label="Gols"
                          />
                          <StatItem
                            icon={<Footprints className="w-3 h-3 lg:w-4 lg:h-4" />}
                            value={stats.assists}
                            label="Assistências"
                          />
                          <StatItem
                            icon={<Square className="w-3 h-3 lg:w-4 lg:h-4" style={{ color: '#FFD700' }} />}
                            value={stats.yellowCards}
                            label="Amarelos"
                          />
                          <StatItem
                            icon={<Square className="w-3 h-3 lg:w-4 lg:h-4" style={{ color: '#FF4444' }} />}
                            value={stats.redCards}
                            label="Vermelhos"
                          />
                          <StatItem
                            icon={<Pencil className="w-3 h-3 lg:w-4 lg:h-4" />}
                            value={stats.averageRating}
                            label="Nota"
                          />
                        </div>

                        {/* Valor e Botões - LAYOUT CORRIGIDO E PROPORCIONAL */}
                        <div className="space-y-2">
                          <p className="text-center text-lg lg:text-xl font-black text-emerald-400">
                            R$ {Number(j.base_price).toLocaleString('pt-BR')}
                          </p>
                          
                          {/* Container para os dois botões lado a lado - AJUSTADO E PROPORCIONAL */}
                          <div className="flex gap-2 w-full">
                            {/* Botão Negociar - redimensionado e proporcional */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSellPlayer(j)
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 lg:h-8 min-w-0 px-2"
                              size="sm"
                            >
                              <DollarSign className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            </Button>
                            
                            {/* Botão Dispensar - só aparece para overall <= 74 */}
                            {j.overall <= 74 && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDismissPlayer(j)
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-7 lg:h-8 min-w-0 px-2"
                                size="sm"
                              >
                                <X className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* LIST VIEW - ATUALIZADA COM LAYOUT OTIMIZADO */}
{viewMode === 'list' && !loading && filteredPlayers.length > 0 && (
  <div className="space-y-4 lg:space-y-6">
    {filteredPlayers.map(j => {
      const isOpen = openedPlayers.includes(j.id)
      const stats = getPlayerStats(j)

      return (
        <div
          key={j.id}
          id={`player-${j.id}`}
          className="bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-xl lg:rounded-2xl overflow-hidden transition-all hover:border-purple-500/70 hover:shadow-lg lg:hover:shadow-xl hover:shadow-purple-600/20"
        >
          {/* Linha principal - LAYOT OTIMIZADO */}
          <div
            className="p-4 lg:p-6 flex items-center gap-4 lg:gap-6 cursor-pointer select-none"
            onClick={() => !isTransitioning && togglePlayer(j.id)}
          >
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden ring-3 ring-purple-500/50 flex-shrink-0">
              {j.photo_url ? (
                <img src={j.photo_url} alt={j.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                  <span className="text-lg lg:text-xl font-black text-white">{j.position}</span>
                </div>
              )}
            </div>

            {/* CONTEÚDO PRINCIPAL - DISTRIBUÍDO DE FORMA MAIS EQUILIBRADA */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 text-xs lg:text-sm items-center">
              {/* Coluna 1: Nome e Estilo */}
              <div className="min-w-[140px]">
                <p className="font-bold text-base lg:text-lg leading-tight">{j.name}</p>
                <p className="text-zinc-400 text-xs lg:text-sm mt-1 line-clamp-1">{j.playstyle || 'Nenhum estilo de jogo'}</p>
              </div>

              {/* Coluna 2: Posição e Idade */}
              <div className="space-y-1">
                <div>
                  <p className="text-zinc-500 text-xs">Posição</p>
                  <Badge className="bg-purple-600 text-xs">{j.position}</Badge>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Idade</p>
                  <p className="text-white font-medium">{j.age ?? '-'}</p>
                </div>
              </div>

              {/* Coluna 3: Clube */}
              <div>
                <p className="text-zinc-500 text-xs mb-2">Clube</p>
                <div className="flex items-center gap-2">
                  {renderClubLogo(j.logo_url, j.club)}
                  <span className="text-xs lg:text-sm font-medium">{j.club}</span>
                </div>
              </div>

              {/* Coluna 4: Overall e Valor - MAIS COMPACTO */}
              <div className="space-y-2">
                <div>
                  <p className="text-zinc-500 text-xs">Overall</p>
                  <p className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
                    {j.overall}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Valor Base</p>
                  <p className="text-emerald-400 font-bold text-sm lg:text-base whitespace-nowrap">
                    R$ {Number(j.base_price).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Coluna 5: Botões e Seta - AGORA MAIS COMPACTA */}
              <div className="flex items-center justify-end gap-2 lg:gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSellPlayer(j)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 lg:h-9 w-8 lg:w-9 p-0 flex items-center justify-center"
                    title="Negociar"
                  >
                    <DollarSign className="w-4 h-4" />
                  </Button>

                  {/* Botão Dispensar - só aparece para overall <= 74 */}
                  {j.overall <= 74 && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismissPlayer(j)
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white h-8 lg:h-9 w-8 lg:w-9 p-0 flex items-center justify-center"
                      title="Dispensar"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-zinc-400 transition-transform duration-300 flex-shrink-0",
                      isOpen && "rotate-180 text-purple-400"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes expandidos (mantido igual) */}
          {isOpen && (
            <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 lg:px-6 py-4 lg:py-6">
              <div className="space-y-4 lg:space-y-6">
                {/* Linha 1: básicos - Altura na mesma linha da idade */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 text-xs lg:text-sm">
                  <div>
                    <span className="text-zinc-500">Idade:</span> <strong>{j.age ?? '-'}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Ruler className="w-3 h-3 lg:w-4 lg:h-4" />
                      Altura: <strong className="ml-1 lg:ml-2">{formatHeight(j.height)}</strong>
                    </span> 
                  </div>
                  <div>
                    <span className="text-zinc-500">Nacionalidade:</span> <strong>{j.nationality}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Pé:</span> <strong>{j.preferred_foot}</strong>
                  </div>
                </div>

                {/* Estatísticas da Temporada */}
                <div>
                  <p className="text-zinc-500 font-medium mb-2 lg:mb-3 text-sm lg:text-base">Estatísticas da Temporada:</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 text-xs lg:text-sm">
                    <div><span className="text-zinc-500">Gols:</span> <strong>{stats.goals}</strong></div>
                    <div><span className="text-zinc-500">Assistências:</span> <strong>{stats.assists}</strong></div>
                    <div><span className="text-zinc-500">Partidas:</span> <strong>{j.total_matches || 0}</strong></div>
                    <div><span className="text-zinc-500">Cartões Amarelos:</span> <strong>{stats.yellowCards}</strong></div>
                    <div><span className="text-zinc-500">Cartões Vermelhos:</span> <strong>{stats.redCards}</strong></div>
                    <div><span className="text-zinc-500">Nota Média:</span> <strong>{stats.averageRating}</strong></div>
                  </div>
                </div>

                {/* Posições alternativas (APENAS QUANDO EXPANDIDO) */}
                {j.alternative_positions && j.alternative_positions.length > 0 && (
                  <div>
                    <p className="text-zinc-500 font-medium mb-2">Posições Alternativas:</p>
                    <div className="flex gap-2 flex-wrap">
                      {j.alternative_positions.map(p => (
                        <Badge key={p} className="bg-red-600/20 text-red-300 border-red-600/40 text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Atributos */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 lg:gap-x-6 gap-y-3 lg:gap-y-4 text-xs">
                  {ATTR_ORDER.map(k => {
                    const value = j[k as keyof Player] as number | null
                    const display = (value ?? 40)
                    const color = getAttrColorHex(display)
                    return (
                      <div key={k} className="text-center">
                        <p className="text-zinc-500 font-medium text-xs">{ATTR_LABELS[k]}</p>
                        <p className="text-lg lg:text-xl font-black" style={{ color }}>{display}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Pé fraco, Frequência, Forma física e Resistência a Lesão */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 text-xs lg:text-sm items-center">
                  <div>
                    <p className="text-zinc-500">Pé Fraco (Uso)</p>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <LevelBars value={j.weak_foot_usage ?? 0} max={4} size="sm" />
                      <span className="font-bold">{j.weak_foot_usage ?? '-'}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-zinc-500">Pé Fraco (Precisão)</p>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <LevelBars value={j.weak_foot_accuracy ?? 0} max={4} size="sm" />
                      <span className="font-bold">{j.weak_foot_accuracy ?? '-'}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-zinc-500">Forma Física</p>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <LevelBars value={j.form ?? 0} max={8} size="md" />
                      <span className="font-bold">{j.form ?? '-'}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-zinc-500">Resistência a Lesão</p>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <LevelBars value={j.injury_resistance ?? 0} max={3} size="sm" />
                      <span className="font-bold">{j.injury_resistance ?? '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Inspirador */}
                <div>
                  <p className="text-zinc-500 font-medium mb-2">Inspirador</p>
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="text-xs lg:text-sm">
                      <div className="text-zinc-400">Carregando</div>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: 2 }).map((_, idx) => {
                          const filled = (j.inspiring_ball_carry ?? 0) > idx
                          return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                        })}
                      </div>
                    </div>

                    <div className="text-xs lg:text-sm">
                      <div className="text-zinc-400">Passe Rasteiro</div>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: 2 }).map((_, idx) => {
                          const filled = (j.inspiring_low_pass ?? 0) > idx
                          return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                        })}
                      </div>
                    </div>

                    <div className="text-xs lg:text-sm">
                      <div className="text-zinc-400">Passe Alto</div>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: 2 }).map((_, idx) => {
                          const filled = (j.inspiring_lofted_pass ?? 0) > idx
                          return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Habilidades especiais */}
                {j.skills && j.skills.length > 0 && (
                  <div>
                    <p className="text-zinc-400 font-medium mb-2">Habilidades Especiais</p>
                    <div className="flex flex-wrap gap-2">
                      {j.skills.map(s => (
                        <Badge key={s} className="bg-purple-600/20 text-purple-300 border-purple-600/40 text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    })}
  </div>
)}


            {/* Modal de Transferência ATUALIZADO */}
            <TransferModal
              player={selectedPlayer}
              isOpen={transferModalOpen}
              onClose={() => setTransferModalOpen(false)}
              onConfirm={handleConfirmTransfer}
              teams={allTeams}
            />

            {/* Modal de Dispensa */}
            <DismissModal
              player={playerToDismiss}
              isOpen={dismissModalOpen}
              onClose={() => setDismissModalOpen(false)}
              onConfirm={handleConfirmDismiss}
            />

          </div>
        </div>

        {/* Chat Components */}
        {user && team && (
          <>
            <FloatingChatButton 
              currentUser={chatUser}
              currentTeam={chatTeam}
              unreadCount={unreadCount}
              onOpenChat={() => setIsChatOpen(true)}
            />
            
            <ChatPopup
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              currentUser={chatUser}
              currentTeam={chatTeam}
            />
          </>
        )}
      </div>
    </div>
  )
}