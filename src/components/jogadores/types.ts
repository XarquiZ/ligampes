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
  
  export interface Team {
    id: string
    name: string
    logo_url: string | null
  }