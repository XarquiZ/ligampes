export interface Player {
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
  total_goals?: number
  total_assists?: number
  total_yellow_cards?: number
  total_red_cards?: number
  total_matches?: number
  average_rating?: number
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
  is_favorite?: boolean
}

export interface Team { 
  id: string; 
  name: string; 
  logo_url: string | null 
}

// Atualizado com informações de formação
export interface Formation {
  id: string
  name: string
  positions: string[] // Usando siglas do PES 21
  description?: string
  defenseLine?: number
  midfieldLine?: number
  attackLine?: number
}

export interface FieldSlot {
  id: string
  position: string
  x: number
  y: number
  player: Player | null
}

export interface TransferData {
  playerId: string
  playerName: string
  fromTeamId: string
  toTeamId: string
  value: number
  type: 'sell' | 'exchange'
  exchangePlayers?: string[]
  exchangeValue?: number
}

export interface TransferModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: TransferData) => void
  teams: Team[]
}

export interface DismissModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (playerId: string, playerName: string, overall: number) => void
}

// Atualizado para aceitar null
export interface PlayerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlayer: (player: Player | null) => void
  teamPlayers: Player[]
  allPlayers: Player[]
  position: string
  playerType?: 'team' | 'target'
  isReserveSlot?: boolean  // Adicione esta linha
}

// ATUALIZADO: Adicionar preSelectedPlayerId
export interface ComparisonSectionProps {
  players: Player[]
  onSharePlayer?: (player: Player) => void
  preSelectedPlayerId?: string | null
}

export interface PlannerSectionProps {
  teamPlayers: Player[]
  allPlayers: Player[]
}

export interface SectionSwitchProps {
  activeSection: 'elenco' | 'favoritos' | 'comparacao' | 'planejador'
  onSectionChange: (section: 'elenco' | 'favoritos' | 'comparacao' | 'planejador') => void
}

export interface PlayerCardProps {
  player: Player
  showProposeButton?: boolean
  activeSection: 'elenco' | 'favoritos' | 'comparacao' | 'planejador'
  onSellClick?: (player: Player) => void
  onDismissClick?: (player: Player) => void
  onShareClick?: (player: Player) => void
  onRemoveFavorite?: (player: Player) => void
  onCardClick: (player: Player) => void
}

export interface PlayerListItemProps {
  player: Player
  isOpen: boolean
  activeSection: 'elenco' | 'favoritos' | 'comparacao' | 'planejador'
  onToggle: () => void
  onSellClick?: (player: Player) => void
  onDismissClick?: (player: Player) => void
  onShareClick?: (player: Player) => void
  onRemoveFavorite?: (player: Player) => void
  onCardClick: (player: Player) => void
}

export interface LevelBarsProps {
  value?: number | null
  max?: number
  size?: 'sm' | 'md'
}

export interface CustomCheckboxProps {
  checked: boolean
  onChange: () => void
  id: string
  label: string
}

export interface StatItemProps {
  icon: React.ReactNode
  value: string | number
  label: string
}

// Interface para formações salvas
export interface SavedFormation {
  id: number
  name: string
  formation: Formation
  slots: {
    id: string
    position: string
    player: {
      id: string
      name: string
      overall: number
      position: string
      photo_url?: string | null
      club: string
    } | null
  }[]
  timestamp: string
  stats: {
    avgOverall: number
    avgAge: number
    totalValue: number
    playerCount: number
    defenseAvg: number
    midfieldAvg: number
    attackAvg: number
  }
}

export interface SavedFormationsModalProps {
  isOpen: boolean
  onClose: () => void
  savedFormations: SavedFormation[]
  onLoadFormation: (formation: SavedFormation) => void
  onDeleteFormation: (id: number) => void
}

// Constantes atualizadas para PES 21
export const POSITIONS = ['GO','ZC','LE','LD','VOL','MLG','MAT','MLE','MLD','PTE','PTD','SA','CA']

// Mapeamento detalhado das posições do PES 21
export const POSITION_MAP = {
  'GO': { name: 'Goleiro', role: 'Goleiro', line: 1 },
  'LD': { name: 'Lateral Direito', role: 'Defesa', line: 2 },
  'LE': { name: 'Lateral Esquerdo', role: 'Defesa', line: 2 },
  'ZC': { name: 'Zagueiro', role: 'Defesa', line: 2 },
  'VOL': { name: 'Volante', role: 'Meio-Campo', line: 3 },
  'MLE': { name: 'Meia Esquerda', role: 'Meio-Campo', line: 3 },
  'MLD': { name: 'Meia Direita', role: 'Meio-Campo', line: 3 },
  'MLG': { name: 'Meia Central', role: 'Meio-Campo', line: 3 },
  'MAT': { name: 'Meia Atacante', role: 'Meio-Campo', line: 4 },
  'SA': { name: 'Segundo Atacante', role: 'Ataque', line: 4 },
  'CA': { name: 'Centroavante', role: 'Ataque', line: 4 },
  'PTD': { name: 'Ponta Direita', role: 'Ataque', line: 4 },
  'PTE': { name: 'Ponta Esquerda', role: 'Ataque', line: 4 },
} as const

export const PLAYSTYLES = ['Artilheiro', 'Armador criativo', 'Atacante surpresa', 'Clássica nº 10', 'Especialista em cruz.', 'Goleiro defensivo', 'Goleiro ofensivo', 'Homem de área', 'Jog. de infiltração', 'Jog. de Lado de Campo', 'Lateral móvel', 'Meia versátil', 'Nenhum', 'Orquestrador', 'Pivô', 'Ponta velocista', 'Primeiro volante', 'Provocador', 'Puxa marcação', 'Volantão', 'Zagueiro defensivo', 'Zagueiro ofensivo']

// Formações com siglas do PES 21
export const DEFAULT_FORMATIONS: Formation[] = [
  { 
    id: '4-3-3', 
    name: '4-3-3', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'VOL', 'MLG', 'MLG', 'PTD', 'CA', 'PTE'],
    description: 'Formação ofensiva com três atacantes',
    defenseLine: 4,
    midfieldLine: 3,
    attackLine: 3
  },
  { 
    id: '4-2-3-1', 
    name: '4-2-3-1', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'VOL', 'VOL', 'MLD', 'MLG', 'MLE', 'CA'],
    description: 'Formação equilibrada com meia-armador',
    defenseLine: 4,
    midfieldLine: 5,
    attackLine: 1
  },
  { 
    id: '4-4-2', 
    name: '4-4-2', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'MLD', 'VOL', 'VOL', 'MLE', 'CA', 'CA'],
    description: 'Formação clássica com dois atacantes',
    defenseLine: 4,
    midfieldLine: 4,
    attackLine: 2
  },
  { 
    id: '4-1-4-1', 
    name: '4-1-4-1', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'VOL', 'MLD', 'MLG', 'MLG', 'MLE', 'CA'],
    description: 'Formação defensiva com volante único',
    defenseLine: 4,
    midfieldLine: 5,
    attackLine: 1
  },
  { 
    id: '3-5-2', 
    name: '3-5-2', 
    positions: ['GO', 'ZC', 'ZC', 'ZC', 'MLD', 'VOL', 'MLG', 'MLG', 'MLE', 'CA', 'CA'],
    description: 'Formação ofensiva com laterais avançados',
    defenseLine: 3,
    midfieldLine: 5,
    attackLine: 2
  },
  { 
    id: '3-4-3', 
    name: '3-4-3', 
    positions: ['GO', 'ZC', 'ZC', 'ZC', 'MLD', 'VOL', 'VOL', 'MLE', 'PTD', 'CA', 'PTE'],
    description: 'Formação muito ofensiva',
    defenseLine: 3,
    midfieldLine: 4,
    attackLine: 3
  },
  { 
    id: '5-3-2', 
    name: '5-3-2', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'ZC', 'LE', 'VOL', 'MLG', 'MLG', 'CA', 'CA'],
    description: 'Formação defensiva com três zagueiros',
    defenseLine: 5,
    midfieldLine: 3,
    attackLine: 2
  },
  { 
    id: '4-2-4', 
    name: '4-2-4', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'VOL', 'VOL', 'PTD', 'CA', 'CA', 'PTE'],
    description: 'Formação extremamente ofensiva',
    defenseLine: 4,
    midfieldLine: 2,
    attackLine: 4
  },
  { 
    id: '4-3-1-2', 
    name: '4-3-1-2', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'VOL', 'MLG', 'MLG', 'MAT', 'CA', 'CA'],
    description: 'Formação com meia-atacante',
    defenseLine: 4,
    midfieldLine: 4,
    attackLine: 2
  },
  { 
    id: '3-4-2-1', 
    name: '3-4-2-1', 
    positions: ['GO', 'ZC', 'ZC', 'ZC', 'MLD', 'VOL', 'VOL', 'MLE', 'SA', 'SA', 'CA'],
    description: 'Formação com dois segundos atacantes',
    defenseLine: 3,
    midfieldLine: 4,
    attackLine: 3
  },
  { 
    id: '4-3-2-1', 
    name: '4-3-2-1 (Árvore de Natal)', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'VOL', 'MLG', 'MLG', 'SA', 'SA', 'CA'],
    description: 'Formação ofensiva em formato de árvore',
    defenseLine: 4,
    midfieldLine: 3,
    attackLine: 3
  },
  { 
    id: '4-5-1', 
    name: '4-5-1', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'MLD', 'VOL', 'MLG', 'VOL', 'MLE', 'CA'],
    description: 'Formação defensiva com meio-campo forte',
    defenseLine: 4,
    midfieldLine: 5,
    attackLine: 1
  },
  { 
    id: '4-1-2-3', 
    name: '4-1-2-3', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'LE', 'VOL', 'MLG', 'MLG', 'PTD', 'CA', 'PTE'],
    description: 'Formação com volante único e dois meias',
    defenseLine: 4,
    midfieldLine: 3,
    attackLine: 3
  },
  { 
    id: '3-3-3-1', 
    name: '3-3-3-1', 
    positions: ['GO', 'ZC', 'ZC', 'ZC', 'VOL', 'MLG', 'VOL', 'MLD', 'MLG', 'MLE', 'CA'],
    description: 'Formação moderna com linhas definidas',
    defenseLine: 3,
    midfieldLine: 6,
    attackLine: 1
  },
  { 
    id: '5-4-1', 
    name: '5-4-1', 
    positions: ['GO', 'LD', 'ZC', 'ZC', 'ZC', 'LE', 'MLD', 'VOL', 'MLG', 'MLE', 'CA'],
    description: 'Formação extremamente defensiva',
    defenseLine: 5,
    midfieldLine: 4,
    attackLine: 1
  }
]