export interface UserProfile {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

export interface Team {
  id: string
  name: string
  logo_url: string | null
  balance: number
}

export interface MarketPlayer {
  id: string
  player_id: string
  player_name: string
  team_id: string
  team_name: string
  team_logo: string | null
  price: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  sale_type: 'fixed_price' | 'negotiable' // NOVO CAMPO
  player?: {
    id: string
    name: string
    position: string
    overall: number
    photo_url: string | null
    base_price: number
    team_id: string | null
  }
}

export interface Player {
  id: string
  name: string
  position: string
  overall: number
  photo_url: string | null
  base_price: number
  team_id: string | null
}

export interface Transfer {
  id: string
  player_id: string
  player_name: string
  from_team_id: string
  to_team_id: string | null
  value: number
  status: 'pending' | 'approved' | 'rejected'
  approved_by_seller: boolean
  approved_by_buyer: boolean
  approved_by_admin: boolean
  processed_by_admin?: boolean
  created_at: string
  transfer_type: string
  is_exchange: boolean
  exchange_players: string[]
  exchange_value: number
  from_team: Team
  to_team: Team
  player: {
    id: string
    name: string
    photo_url: string | null
    position: string
  }
  transfer_players?: string[]
  player_names?: string[]
  player_values?: number[]
}

// Interface para criar anúncio
export interface CreateMarketListing {
  player_id: string
  player_name: string
  team_id: string
  price: number
  description?: string | null
  sale_type: 'fixed_price' | 'negotiable' // NOVO
}

// Funções utilitárias
export const formatBalance = (value: number): string => {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
}

export const isAuction = (transferType: string) => {
  return transferType === 'auction'
}