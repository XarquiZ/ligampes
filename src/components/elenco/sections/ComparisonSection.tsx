import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowUp, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LevelBars } from '../LevelBars'
import { ComparisonSectionProps, Player } from '../types'

// Função para formatar o preço (mesma do PlayerCard)
const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    const valueInMillions = price / 1000000
    if (valueInMillions % 1 === 0) {
      return `R$ ${valueInMillions.toFixed(0)}M`
    }
    if (valueInMillions < 10) {
      return `R$ ${valueInMillions.toFixed(1)}M`
    }
    return `R$ ${Math.round(valueInMillions)}M`
  } else if (price >= 1000) {
    const valueInThousands = price / 1000
    if (valueInThousands % 1 === 0) {
      return `R$ ${valueInThousands.toFixed(0)}K`
    }
    return `R$ ${valueInThousands.toFixed(1)}K`
  }
  return `R$ ${price}`
}

export const ComparisonSection: React.FC<ComparisonSectionProps & { preSelectedPlayerId?: string | null }> = ({ 
  players,
  preSelectedPlayerId 
}) => {
  const [player1, setPlayer1] = useState<Player | null>(null)
  const [player2, setPlayer2] = useState<Player | null>(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [filteredPlayers1, setFilteredPlayers1] = useState<Player[]>([])
  const [filteredPlayers2, setFilteredPlayers2] = useState<Player[]>([])

  const [activeTab, setActiveTab] = useState<'comparacao' | 'extras'>('comparacao')

  // Efeito para pré-selecionar o jogador 1 quando o componente monta ou quando preSelectedPlayerId muda
  useEffect(() => {
    if (preSelectedPlayerId && players.length > 0 && !player1) {
      const foundPlayer = players.find(p => p.id === preSelectedPlayerId)
      if (foundPlayer) {
        setPlayer1(foundPlayer)
        console.log('Jogador pré-selecionado carregado:', foundPlayer.name)
      }
    }
  }, [preSelectedPlayerId, players, player1])

  useEffect(() => {
    if (search1) {
      const filtered = players.filter(p => 
        p.name.toLowerCase().includes(search1.toLowerCase())
      )
      setFilteredPlayers1(filtered.slice(0, 5))
    } else {
      setFilteredPlayers1([])
    }
  }, [search1, players])

  useEffect(() => {
    if (search2) {
      const filtered = players.filter(p => 
        p.name.toLowerCase().includes(search2.toLowerCase())
      )
      setFilteredPlayers2(filtered.slice(0, 5))
    } else {
      setFilteredPlayers2([])
    }
  }, [search2, players])

  const attributes = [
    { key: 'overall', label: 'Overall' },
    { key: 'offensive_talent', label: 'Tal. Ofensivo' },
    { key: 'ball_control', label: 'Controle de Bola' },
    { key: 'dribbling', label: 'Drible' },
    { key: 'tight_possession', label: 'Condução Firme' },
    { key: 'low_pass', label: 'Passe Rasteiro' },
    { key: 'lofted_pass', label: 'Passe Alto' },
    { key: 'finishing', label: 'Finalização' },
    { key: 'heading', label: 'Cabeceio' },
    { key: 'place_kicking', label: 'Chute Colocado' },
    { key: 'curl', label: 'Curva' },
    { key: 'speed', label: 'Velocidade' },
    { key: 'acceleration', label: 'Aceleração' },
    { key: 'kicking_power', label: 'Força do Chute' },
    { key: 'jump', label: 'Impulsão' },
    { key: 'physical_contact', label: 'Contato Físico' },
    { key: 'balance', label: 'Equilíbrio' },
    { key: 'stamina', label: 'Resistência' },
    { key: 'defensive_awareness', label: 'Tal. Defensivo' },
    { key: 'ball_winning', label: 'Desarme' },
    { key: 'aggression', label: 'Agressividade' },
    { key: 'gk_awareness', label: 'Tal. de GO' },
    { key: 'gk_catching', label: 'Firmeza de GO' },
    { key: 'gk_clearing', label: 'Afast. de GO' },
    { key: 'gk_reflexes', label: 'Reflexos de GO' },
    { key: 'gk_reach', label: 'Alcance de GO' }
  ]

  const extraAttributes = [
    { key: 'weak_foot_usage', label: 'Pé Fraco (Uso)' },
    { key: 'weak_foot_accuracy', label: 'Pé Fraco (Precisão)' },
    { key: 'form', label: 'Forma Física' },
    { key: 'injury_resistance', label: 'Resistência a Lesão' },
    { key: 'inspiring_ball_carry', label: 'Insp. Carregando' },
    { key: 'inspiring_low_pass', label: 'Insp. Passe Rasteiro' },
    { key: 'inspiring_lofted_pass', label: 'Insp. Passe Alto' }
  ]

  const getAttributeValue = (player: Player | null, key: string): number => {
    if (!player) return 0
    return (player as any)[key] || 0
  }

  const getAttrColorHex = (value: number) => {
    if (value >= 95) return '#4FC3F7'
    if (value >= 85) return '#00FF00'
    if (value >= 75) return '#FFFF00'
    return '#E53935'
  }

  const PlayerHeader = ({ player, side }: { player: Player | null; side: 'left' | 'right' }) => {
    if (!player) return null

    return (
      <div className={cn(
        "sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700 p-3 sm:p-4",
        side === 'left' ? 'text-left' : 'text-right'
      )}>
        <div className={cn(
          "flex items-center gap-2 sm:gap-3",
          side === 'left' ? 'flex-row' : 'flex-row-reverse'
        )}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 ring-purple-500/50 flex-shrink-0">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-black text-white">{player.position}</span>
              </div>
            )}
          </div>
          <div className={cn("flex-1 min-w-0", side === 'left' ? 'text-left' : 'text-right')}>
            <h3 className="font-bold text-white text-sm truncate">{player.name}</h3>
            <div className={cn("flex items-center gap-2 mt-0.5 sm:mt-1 flex-wrap", side === 'left' ? 'justify-start' : 'justify-end')}>
              <Badge className="bg-purple-600 text-xs">{player.position}</Badge>
              <span className="text-zinc-400 text-xs">OVR {player.overall}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMainAttributes = () => (
    <div className="space-y-2 sm:space-y-3">
      {attributes.map(({ key, label }) => {
        const value1 = getAttributeValue(player1, key)
        const value2 = getAttributeValue(player2, key)
        const color1 = getAttrColorHex(value1)
        const color2 = getAttrColorHex(value2)
        
        const player1Wins = value1 > value2
        const player2Wins = value2 > value1
        
        return (
          <div key={key} className="flex items-center justify-between gap-2 sm:gap-4 px-1 sm:px-0">
            <div className="text-right w-12 sm:w-20 flex items-center justify-end gap-1">
              {player1Wins && (
                <ArrowUp className="w-3 h-3 text-green-400 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium min-w-[20px] text-right" style={{ color: color1 }}>
                {value1}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-center">
                <span className="text-xs text-zinc-400 font-medium truncate block px-1 min-h-[20px] flex items-center justify-center">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 mt-1">
                <div 
                  className="h-1.5 sm:h-2 bg-zinc-700 rounded-full flex-1 overflow-hidden"
                  title={`${player1?.name || 'Jogador 1'}: ${value1}`}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(value1 / 100) * 100}%`,
                      backgroundColor: color1
                    }}
                  />
                </div>
                <div 
                  className="h-1.5 sm:h-2 bg-zinc-700 rounded-full flex-1 overflow-hidden"
                  title={`${player2?.name || 'Jogador 2'}: ${value2}`}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(value2 / 100) * 100}%`,
                      backgroundColor: color2
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="text-left w-12 sm:w-20 flex items-center gap-1">
              <span className="text-xs sm:text-sm font-medium min-w-[20px]" style={{ color: color2 }}>
                {value2}
              </span>
              {player2Wins && (
                <ArrowUp className="w-3 h-3 text-green-400 flex-shrink-0" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderExtraAttributes = () => (
    <div className="space-y-3 sm:space-y-4">
      {extraAttributes.map(({ key, label }) => {
        const value1 = getAttributeValue(player1, key)
        const value2 = getAttributeValue(player2, key)
        
        const getBarConfig = (attrKey: string) => {
          if (attrKey.includes('inspiring')) return { max: 2, size: 'sm' as const }
          if (attrKey === 'form') return { max: 8, size: 'sm' as const }
          return { max: 4, size: 'sm' as const }
        }
        
        const config = getBarConfig(key)
        
        const player1Wins = value1 > value2
        const player2Wins = value2 > value1
        
        return (
          <div key={key} className="flex items-center justify-between gap-2 sm:gap-4 px-1 sm:px-0">
            <div className="text-right w-12 sm:w-20 flex items-center justify-end gap-1">
              {player1Wins && (
                <ArrowUp className="w-3 h-3 text-green-400 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium text-white min-w-[20px] text-right">
                {value1}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-center">
                <span className="text-xs text-zinc-400 font-medium truncate block px-1 min-h-[20px] flex items-center justify-center">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 mt-1">
                <div className="flex-1 flex justify-center">
                  <LevelBars 
                    value={value1} 
                    max={config.max}
                    size={config.size}
                  />
                </div>
                <div className="flex-1 flex justify-center">
                  <LevelBars 
                    value={value2} 
                    max={config.max}
                    size={config.size}
                  />
                </div>
              </div>
            </div>
            
            <div className="text-left w-12 sm:w-20 flex items-center gap-1">
              <span className="text-xs sm:text-sm font-medium text-white min-w-[20px]">
                {value2}
              </span>
              {player2Wins && (
                <ArrowUp className="w-3 h-3 text-green-400 flex-shrink-0" />
              )}
            </div>
          </div>
        )
      })}

      <div className="pt-3 sm:pt-4 border-t border-zinc-700">
        <h4 className="text-center text-sm font-medium text-zinc-400 mb-2 sm:mb-3">Habilidades Especiais</h4>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            {player1?.skills?.map(skill => (
              <Badge 
                key={skill} 
                className="bg-purple-600/20 text-purple-300 border-purple-600/40 text-xs w-full justify-center truncate px-1 py-0.5 sm:px-2 sm:py-1"
                title={skill}
              >
                {skill}
              </Badge>
            ))}
            {(!player1?.skills || player1.skills.length === 0) && (
              <span className="text-zinc-500 text-xs text-center block">Nenhuma habilidade</span>
            )}
          </div>
          <div className="space-y-1 sm:space-y-2">
            {player2?.skills?.map(skill => (
              <Badge 
                key={skill} 
                className="bg-blue-600/20 text-blue-300 border-blue-600/40 text-xs w-full justify-center truncate px-1 py-0.5 sm:px-2 sm:py-1"
                title={skill}
              >
                {skill}
              </Badge>
            ))}
            {(!player2?.skills || player2.skills.length === 0) && (
              <span className="text-zinc-500 text-xs text-center block">Nenhuma habilidade</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Componente de informações do jogador para mobile
  const PlayerMobileInfo = ({ player, side }: { player: Player | null; side: 'left' | 'right' }) => {
    if (!player) return null

    return (
      <div className={cn(
        "bg-zinc-800/50 rounded-lg p-3 border",
        side === 'left' ? 'border-purple-500/30' : 'border-blue-500/30'
      )}>
        <div className={cn(
          "flex items-center gap-2 mb-2",
          side === 'left' ? 'flex-row' : 'flex-row-reverse'
        )}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 flex-shrink-0"
               style={{ borderColor: side === 'left' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.5)' }}>
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <div className={cn(
                "w-full h-full flex items-center justify-center",
                side === 'left' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-blue-600 to-cyan-600'
              )}>
                <span className="text-sm font-black text-white">{player.position}</span>
              </div>
            )}
          </div>
          <div className={cn("flex-1 min-w-0", side === 'left' ? 'text-left' : 'text-right')}>
            <h3 className="font-bold text-white text-xs sm:text-sm truncate leading-tight">{player.name}</h3>
            <div className={cn("flex items-center gap-1 mt-1", side === 'left' ? 'justify-start' : 'justify-end')}>
              <Badge className={cn("text-xs", side === 'left' ? 'bg-purple-600' : 'bg-blue-600')}>
                {player.position}
              </Badge>
              <span className="text-zinc-300 text-xs">OVR {player.overall}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <p className="text-emerald-400 font-bold text-xs sm:text-sm">{formatPrice(player.base_price)}</p>
          <p className="text-zinc-400 truncate text-xs">{player.playstyle || 'Nenhum estilo'}</p>
          <p className="text-zinc-400 text-xs">{player.nationality}</p>
          <p className="text-zinc-400 text-xs">{player.age ? `${player.age} anos` : 'Idade não informada'}</p>
          <p className="text-zinc-400 text-xs">{player.height ? `${player.height}cm` : 'Altura não informada'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Busca de jogadores - Mobile empilhado */}
      <div className="md:hidden space-y-4">
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-400">Jogador 1</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input
              placeholder="Buscar jogador..."
              value={search1}
              onChange={(e) => setSearch1(e.target.value)}
              className="pl-10 bg-zinc-900/70 border-zinc-700 text-sm"
            />
            
            {/* Lista de resultados para mobile - Jogador 1 */}
            {filteredPlayers1.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredPlayers1.map(player => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setPlayer1(player)
                      setSearch1('')
                      setFilteredPlayers1([])
                    }}
                    className="w-full p-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{player.position}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{player.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-purple-600 text-xs">{player.position}</Badge>
                          <span className="text-zinc-400 text-xs">OVR {player.overall}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {player1 && (
            <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {player1.photo_url ? (
                    <img src={player1.photo_url} alt={player1.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{player1.position}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate leading-tight">{player1.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-purple-600 text-xs">{player1.position}</Badge>
                    <span className="text-zinc-400 text-xs">OVR {player1.overall}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPlayer1(null)}
                  className="text-zinc-400 hover:text-red-400 p-1 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-400">Jogador 2</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input
              placeholder="Buscar jogador..."
              value={search2}
              onChange={(e) => setSearch2(e.target.value)}
              className="pl-10 bg-zinc-900/70 border-zinc-700 text-sm"
            />
            
            {/* Lista de resultados para mobile - Jogador 2 */}
            {filteredPlayers2.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredPlayers2.map(player => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setPlayer2(player)
                      setSearch2('')
                      setFilteredPlayers2([])
                    }}
                    className="w-full p-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{player.position}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{player.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-600 text-xs">{player.position}</Badge>
                          <span className="text-zinc-400 text-xs">OVR {player.overall}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {player2 && (
            <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {player2.photo_url ? (
                    <img src={player2.photo_url} alt={player2.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{player2.position}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate leading-tight">{player2.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-600 text-xs">{player2.position}</Badge>
                    <span className="text-zinc-400 text-xs">OVR {player2.overall}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPlayer2(null)}
                  className="text-zinc-400 hover:text-red-400 p-1 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Busca de jogadores - Desktop */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="text-sm font-medium text-zinc-400 mb-2 block">Jogador 1</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input
              placeholder="Buscar jogador..."
              value={search1}
              onChange={(e) => setSearch1(e.target.value)}
              className="pl-10 bg-zinc-900/70 border-zinc-700"
            />
          </div>
          {player1 && (
            <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {player1.photo_url ? (
                    <img src={player1.photo_url} alt={player1.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{player1.position}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{player1.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-xs">{player1.position}</Badge>
                    <span className="text-zinc-400 text-xs">OVR {player1.overall}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPlayer1(null)}
                  className="text-zinc-400 hover:text-red-400 p-1"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {filteredPlayers1.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredPlayers1.map(player => (
                <button
                  key={player.id}
                  onClick={() => {
                    setPlayer1(player)
                    setSearch1('')
                    setFilteredPlayers1([])
                  }}
                  className="w-full p-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-700 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{player.position}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{player.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-purple-600 text-xs">{player.position}</Badge>
                        <span className="text-zinc-400 text-xs">OVR {player.overall}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-sm font-medium text-zinc-400 mb-2 block">Jogador 2</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input
              placeholder="Buscar jogador..."
              value={search2}
              onChange={(e) => setSearch2(e.target.value)}
              className="pl-10 bg-zinc-900/70 border-zinc-700"
            />
          </div>
          {player2 && (
            <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {player2.photo_url ? (
                    <img src={player2.photo_url} alt={player2.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{player2.position}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{player2.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-xs">{player2.position}</Badge>
                    <span className="text-zinc-400 text-xs">OVR {player2.overall}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPlayer2(null)}
                  className="text-zinc-400 hover:text-red-400 p-1"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {filteredPlayers2.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredPlayers2.map(player => (
                <button
                  key={player.id}
                  onClick={() => {
                    setPlayer2(player)
                    setSearch2('')
                    setFilteredPlayers2([])
                  }}
                  className="w-full p-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-700 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{player.position}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{player.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-blue-600 text-xs">{player.position}</Badge>
                        <span className="text-zinc-400 text-xs">OVR {player.overall}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {(player1 || player2) && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-700 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-700">
            <button
              className={cn(
                "flex-1 py-2 sm:py-3 px-3 sm:px-4 text-center font-medium transition-all text-sm sm:text-base",
                activeTab === 'comparacao'
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
              onClick={() => setActiveTab('comparacao')}
            >
              Comparação Principal
            </button>
            <button
              className={cn(
                "flex-1 py-2 sm:py-3 px-3 sm:px-4 text-center font-medium transition-all text-sm sm:text-base",
                activeTab === 'extras'
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
              onClick={() => setActiveTab('extras')}
            >
              Comparações Extras
            </button>
          </div>

          <div className="relative">
            {/* Layout Mobile - Empilhado */}
            <div className="md:hidden">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Informações dos jogadores lado a lado no mobile */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <PlayerMobileInfo player={player1} side="left" />
                  <PlayerMobileInfo player={player2} side="right" />
                </div>

                {/* Comparação de atributos */}
                <div className="max-h-[50vh] overflow-y-auto p-2 sm:p-3 border border-zinc-700 rounded-lg">
                  {activeTab === 'comparacao' ? renderMainAttributes() : renderExtraAttributes()}
                </div>
              </div>
            </div>

            {/* Layout Desktop e Tablet (768px+) */}
            <div className="hidden md:block">
              {/* Para telas 768px-1024px, ajustamos o layout */}
              <div className="lg:hidden">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <PlayerHeader player={player1} side="left" />
                  </div>
                  <div className="col-span-1">
                    <PlayerHeader player={player2} side="right" />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-6 items-start">
                    <div className="text-center space-y-4">
                      {player1 && (
                        <>
                          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden ring-4 ring-purple-500/50">
                            {player1.photo_url ? (
                              <img src={player1.photo_url} alt={player1.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <span className="text-base font-black text-white">{player1.position}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-emerald-400 font-bold text-base">
                              {formatPrice(player1.base_price)}
                            </p>
                            <p className="text-zinc-400 text-xs mt-1 truncate">{player1.playstyle || 'Nenhum estilo'}</p>
                            <p className="text-zinc-400 text-xs">{player1.nationality}</p>
                            <p className="text-zinc-400 text-xs">{player1.age ? `${player1.age} anos` : 'Idade não informada'}</p>
                            <p className="text-zinc-400 text-xs">{player1.height ? `${player1.height}cm` : 'Altura não informada'}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="text-center space-y-4">
                      {player2 && (
                        <>
                          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden ring-4 ring-blue-500/50">
                            {player2.photo_url ? (
                              <img src={player2.photo_url} alt={player2.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                <span className="text-base font-black text-white">{player2.position}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-emerald-400 font-bold text-base">
                              {formatPrice(player2.base_price)}
                            </p>
                            <p className="text-zinc-400 text-xs mt-1 truncate">{player2.playstyle || 'Nenhum estilo'}</p>
                            <p className="text-zinc-400 text-xs">{player2.nationality}</p>
                            <p className="text-zinc-400 text-xs">{player2.age ? `${player2.age} anos` : 'Idade não informada'}</p>
                            <p className="text-zinc-400 text-xs">{player2.height ? `${player2.height}cm` : 'Altura não informada'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Comparação centralizada para tablet */}
                  <div className="mt-6">
                    <div className="max-h-[40vh] overflow-y-auto p-4 border border-zinc-700 rounded-lg">
                      {activeTab === 'comparacao' ? renderMainAttributes() : renderExtraAttributes()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Desktop completo (≥ 1024px) */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-1">
                    <PlayerHeader player={player1} side="left" />
                  </div>
                  <div className="col-span-1">
                    {/* Espaço central vazio */}
                  </div>
                  <div className="col-span-1">
                    <PlayerHeader player={player2} side="right" />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6">
                  <div className="grid grid-cols-3 gap-8 items-start">
                    <div className="text-center space-y-4">
                      {player1 && (
                        <>
                          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden ring-4 ring-purple-500/50">
                            {player1.photo_url ? (
                              <img src={player1.photo_url} alt={player1.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <span className="text-lg font-black text-white">{player1.position}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-emerald-400 font-bold text-lg">
                              {formatPrice(player1.base_price)}
                            </p>
                            <p className="text-zinc-400 text-sm mt-1">{player1.playstyle || 'Nenhum estilo'}</p>
                            <p className="text-zinc-400 text-sm">{player1.nationality}</p>
                            <p className="text-zinc-400 text-sm">{player1.age ? `${player1.age} anos` : 'Idade não informada'}</p>
                            <p className="text-zinc-400 text-sm">{player1.height ? `${player1.height}cm` : 'Altura não informada'}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      {activeTab === 'comparacao' ? renderMainAttributes() : renderExtraAttributes()}
                    </div>

                    <div className="text-center space-y-4">
                      {player2 && (
                        <>
                          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden ring-4 ring-blue-500/50">
                            {player2.photo_url ? (
                              <img src={player2.photo_url} alt={player2.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                <span className="text-lg font-black text-white">{player2.position}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-emerald-400 font-bold text-lg">
                              {formatPrice(player2.base_price)}
                            </p>
                            <p className="text-zinc-400 text-sm mt-1">{player2.playstyle || 'Nenhum estilo'}</p>
                            <p className="text-zinc-400 text-sm">{player2.nationality}</p>
                            <p className="text-zinc-400 text-sm">{player2.age ? `${player2.age} anos` : 'Idade não informada'}</p>
                            <p className="text-zinc-400 text-sm">{player2.height ? `${player2.height}cm` : 'Altura não informada'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(!player1 && !player2) && (
        <div className="text-center py-8 sm:py-12 bg-zinc-900/30 rounded-xl border border-zinc-700">
          <GitCompare className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-zinc-400 mb-1 sm:mb-2">Selecione dois jogadores</h3>
          <p className="text-zinc-500 text-sm sm:text-base">Escolha dois jogadores na database para comparar seus atributos</p>
          {preSelectedPlayerId && (
            <div className="mt-3 sm:mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700/50">
              <p className="text-xs sm:text-sm text-purple-300">
                ✨ Dica: Um jogador foi pré-selecionado para você no slot 1! 
                Basta buscar outro jogador para comparar.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}