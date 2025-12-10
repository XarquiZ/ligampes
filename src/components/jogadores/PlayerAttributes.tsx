import { Player } from '@/types/player'

interface PlayerAttributesProps {
  player: Player
}

const ATTR_CONFIG = [
  { k: 'offensive_talent', l: 'Tal. Ofensivo' },
  { k: 'ball_control', l: 'Controle de bola' },
  { k: 'dribbling', l: 'Drible' },
  { k: 'tight_possession', l: 'Condução Firme' },
  { k: 'low_pass', l: 'Passe rasteiro' },
  { k: 'lofted_pass', l: 'Passe Alto' },
  { k: 'finishing', l: 'Finalização' },
  { k: 'heading', l: 'Cabeceio' },
  { k: 'place_kicking', l: 'Chute colocado' },
  { k: 'curl', l: 'Curva' },
  { k: 'speed', l: 'Velocidade' },
  { k: 'acceleration', l: 'Aceleração' },
  { k: 'kicking_power', l: 'Força do chute' },
  { k: 'jump', l: 'Impulsão' },
  { k: 'physical_contact', l: 'Contato Físico' },
  { k: 'balance', l: 'Equilíbrio' },
  { k: 'stamina', l: 'Resistência' },
  { k: 'defensive_awareness', l: 'Talento defensivo' },
  { k: 'ball_winning', l: 'Desarme' },
  { k: 'aggression', l: 'Agressividade' },
  { k: 'gk_awareness', l: 'Talento de GO' },
  { k: 'gk_catching', l: 'Firmeza de GO' },
  { k: 'gk_clearing', l: 'Afast. de bola de GO' },
  { k: 'gk_reflexes', l: 'Reflexos de GO' },
  { k: 'gk_reach', l: 'Alcance de GO' },
]

export function PlayerAttributes({ player }: PlayerAttributesProps) {
  const getAttrColorHex = (value: number) => {
    if (value >= 95) return '#4FC3F7'
    if (value >= 85) return '#00FF00'
    if (value >= 75) return '#FFFF00'
    return '#E53935'
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 lg:gap-x-6 gap-y-3 lg:gap-y-4 text-xs">
      {ATTR_CONFIG.map(({ k, l }) => {
        const value = player[k as keyof Player] as number | null
        const display = (value ?? 40)
        const color = getAttrColorHex(display)
        return (
          <div key={k} className="text-center">
            <p className="text-zinc-500 font-medium text-xs">{l}</p>
            <p className="text-lg lg:text-xl font-black" style={{ color }}>{display}</p>
          </div>
        )
      })}
    </div>
  )
}