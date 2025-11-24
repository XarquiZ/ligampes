'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CadastrarJogadorForm } from '@/components/CadastrarJogadorForm'
import { PlusCircle, Loader2, AlertCircle, Search, Filter, X, ChevronDown, Pencil, Grid3X3, List, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // detalhes adicionais
  weak_foot_usage?: number | null
  weak_foot_accuracy?: number | null
  form?: number | null
  inspiring_ball_carry?: number | null
  inspiring_low_pass?: number | null
  inspiring_lofted_pass?: number | null
}

interface Team {
  id: string
  name: string
  logo_url: string | null
}

export default function ListaJogadores() {
  const supabase = createClient()
  const [jogadores, setJogadores] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCadastroOpen, setIsCadastroOpen] = useState(false)
  const [isEdicaoOpen, setIsEdicaoOpen] = useState(false)
  const [jogadorEditando, setJogadorEditando] = useState<Player | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // NOVO: controle global de quais jogadores estão abertos na lista
  const [openedPlayers, setOpenedPlayers] = useState<string[]>([])

  const togglePlayer = (playerId: string) => {
    setOpenedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const [searchName, setSearchName] = useState('')
  const [filterPosition, setFilterPosition] = useState('Todas')
  const [filterFoot, setFilterFoot] = useState('Todos')
  const [filterTeam, setFilterTeam] = useState('Todos')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const [attrFilters, setAttrFilters] = useState<Record<string, number | null>>({
    offensive_talent: null, ball_control: null, dribbling: null, tight_possession: null,
    low_pass: null, lofted_pass: null, finishing: null, heading: null, place_kicking: null,
    curl: null, speed: null, acceleration: null, kicking_power: null, jump: null,
    physical_contact: null, balance: null, stamina: null, defensive_awareness: null,
    ball_winning: null, aggression: null, gk_awareness: null, gk_catching: null,
    gk_clearing: null, gk_reflexes: null, gk_reach: null,
  })

  const POSITIONS = ['Todas', 'GO', 'ZC', 'LE', 'LD', 'VOL', 'MLG', 'MAT', 'SA', 'PTE', 'PTD', 'CA']
  const FOOT_OPTIONS = ['Todos', 'Direito', 'Esquerdo', 'Ambos']

  const SKILLS_OPTIONS = [
    'Pedalada simples', 'Toque duplo', 'Elástico', '360 graus', 'Chapéu', 'Corte de calcanhar',
    'Puxada de letra', 'Finta de letra', 'Controle de domínio', 'Cabeçada', 'Chute de longe',
    'Controle da cavadinha', 'Precisão à distância', 'Chute com o peito do pé', 'Folha seca',
    'Chute ascendente', 'Finalização acrobática', 'Toque de calcanhar', 'Chute de primeira',
    'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Cruzamento preciso',
    'Curva para fora', 'De letra', 'Passe sem olhar', 'Passe aéreo baixo', 'Reposição baixa do GO',
    'Reposição alta do GO', 'Arremesso lateral longo', 'Arremesso longo do GO', 'Pegador de pênaltis',
    'Malícia', 'Marcação individual', 'Volta para marcar', 'Interceptação', 'Afastamento acrobático',
    'Liderança', 'Super substituto', 'Espírito guerreiro',
  ]

  const ATTRIBUTE_GROUPS = [
    { name: 'Ataque & Técnica', attributes: ['offensive_talent', 'ball_control', 'dribbling', 'tight_possession', 'finishing', 'heading', 'place_kicking', 'curl'] },
    { name: 'Passes', attributes: ['low_pass', 'lofted_pass'] },
    { name: 'Físico', attributes: ['speed', 'acceleration', 'kicking_power', 'jump', 'physical_contact', 'balance', 'stamina'] },
    { name: 'Defesa', attributes: ['defensive_awareness', 'ball_winning', 'aggression'] },
    { name: 'Goleiro', attributes: ['gk_awareness', 'gk_catching', 'gk_clearing', 'gk_reflexes', 'gk_reach'] },
  ]

  // === Helpers: cores dos atributos conforme mapa do usuário ===
  const getAttrColorHex = (value: number) => {
    // mapping provided by user:
    // 0-74 vermelho
    // 75-84 laranja
    // 85-94 verde claro
    // 95-99 azul claro
    if (value >= 95) return '#4FC3F7' // azul claro
    if (value >= 85) return '#8BC34A' // verde claro
    if (value >= 75) return '#FB8C00' // laranja
    return '#E53935' // vermelho
  }

  // Componente de Barrinhas (LevelBars) para usar em pé fraco / forma
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

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setUserRole(data?.role || null)
      }
    }
    checkAdmin()
  }, [supabase])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: teamsData }, { data: playersData }] = await Promise.all([
        supabase.from('teams').select('id, name, logo_url').order('name'),
        supabase.from('players').select('*'),
      ])

      const teamMap = Object.fromEntries((teamsData || []).map(t => [t.id, t]))
      setTeams(teamsData || [])

      const mapped = (playersData || []).map(p => ({
        ...p,
        club: p.team_id ? teamMap[p.team_id]?.name || 'Sem Time' : 'Sem Time',
        logo_url: p.team_id ? teamMap[p.team_id]?.logo_url : null,
        preferred_foot: p.preferred_foot || 'Nenhum',
        skills: p.skills || [],
        playstyle: p.playstyle || null,
        alternative_positions: p.alternative_positions || [],
        nationality: p.nationality || 'Desconhecida',
      }))

      setJogadores(mapped)
    } catch (e: any) {
      setFetchError(e.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSuccess = () => {
    setIsCadastroOpen(false)
    setIsEdicaoOpen(false)
    setJogadorEditando(null)
    fetchData()
  }

  const openEditPlayer = (player: Player) => {
    setJogadorEditando(player)
    setIsEdicaoOpen(true)
  }

  const filteredPlayers = useMemo(() => {
    return jogadores.filter(j => {
      const name = j.name.toLowerCase().includes(searchName.toLowerCase())
      const pos = filterPosition === 'Todas' || j.position === filterPosition
      const foot = filterFoot === 'Todos' || j.preferred_foot === filterFoot
      const team = filterTeam === 'Todos' || (filterTeam === 'Sem Time' ? !j.team_id : j.team_id === filterTeam)
      const skills = selectedSkills.length === 0 || selectedSkills.every(s => j.skills?.includes(s))
      const attrs = Object.entries(attrFilters).every(([k, min]) => min === null || (j[k as keyof Player] as number ?? 0) >= min)
      return name && pos && foot && team && skills && attrs
    })
  }, [jogadores, searchName, filterPosition, filterFoot, filterTeam, selectedSkills, attrFilters])

  const activeAdvancedFilters = [
    filterFoot !== 'Todos',
    filterTeam !== 'Todos',
    selectedSkills.length > 0,
    Object.values(attrFilters).some(v => v !== null)
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setSearchName('')
    setFilterPosition('Todas')
    setFilterFoot('Todos')
    setFilterTeam('Todos')
    setSelectedSkills([])
    setAttrFilters(Object.fromEntries(Object.keys(attrFilters).map(k => [k, null])))
  }

  const renderClubLogo = (url: string | null, name: string) =>
    url ? (
      <img
        src={url}
        alt={name}
        className="w-8 h-8 object-contain rounded-full ring-2 ring-zinc-700"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    ) : null

  // label map (updated names requested)
  const ATTR_LABELS: Record<string, string> = {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
              LIGA MPES
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">Base de Jogadores • {jogadores.length} jogadores disponíveis</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle de Visualização */}
            <div className="flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn("rounded-lg", viewMode === 'grid' && "bg-purple-600")}
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn("rounded-lg", viewMode === 'list' && "bg-purple-600")}
              >
                <List className="w-5 h-5" />
              </Button>
            </div>

            {/* Filtros Avançados */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="bg-zinc-900/50 backdrop-blur border-zinc-700 hover:border-purple-500 hover:bg-zinc-800/70 text-white relative">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtros
                  {activeAdvancedFilters > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                      {activeAdvancedFilters}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-md bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 flex flex-col">
                <SheetHeader className="p-6 border-b border-zinc-800">
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                    Filtros Avançados
                  </SheetTitle>
                  <SheetDescription className="text-zinc-400">
                    Refine sua busca por pé preferido, time, habilidades e atributos.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div>
                    <label className="text-sm font-semibold text-zinc-300 mb-2 block">Pé Preferido</label>
                    <Select value={filterFoot} onValueChange={setFilterFoot}>
                      <SelectTrigger className="bg-zinc-900/70 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{FOOT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-zinc-300 mb-2 block">Time</label>
                    <Select value={filterTeam} onValueChange={setFilterTeam}>
                      <SelectTrigger className="bg-zinc-900/70 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos os times</SelectItem>
                        <SelectItem value="Sem Time">Sem time</SelectItem>
                        {teams.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-3">
                              {t.logo_url && <img src={t.logo_url} alt="" className="w-6 h-6 rounded" />}
                              <span>{t.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-lg font-bold text-white hover:text-purple-400">
                      Habilidades ({selectedSkills.length})
                      <ChevronDown className="w-5 h-5 transition-transform data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_OPTIONS.map(skill => (
                          <Badge
                            key={skill}
                            variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                            className={cn("cursor-pointer text-xs", selectedSkills.includes(skill) ? "bg-purple-600" : "bg-zinc-800 text-zinc-300")}
                            onClick={() => setSelectedSkills(p => p.includes(skill) ? p.filter(s => s !== skill) : [...p, skill])}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {ATTRIBUTE_GROUPS.map(group => (
                    <Collapsible key={group.name}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-lg font-bold text-white hover:text-purple-400">
                        {group.name}
                        <ChevronDown className="w-5 h-5 transition-transform data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-6 pt-4">
                        {group.attributes.map(key => {
                          const labels: Record<string, string> = {
                            offensive_talent: 'Tal. Ofensivo', ball_control: 'Controle de bola', dribbling: 'Drible',
                            tight_possession: 'Condução Firme', low_pass: 'Passe rasteiro', lofted_pass: 'Passe Alto',
                            finishing: 'Finalização', heading: 'Cabeceio', place_kicking: 'Chute colocado', curl: 'Curva',
                            speed: 'Velocidade', acceleration: 'Aceleração', kicking_power: 'Força do chute',
                            jump: 'Impulsão', physical_contact: 'Contato Físico', balance: 'Equilíbrio', stamina: 'Resistência',
                            defensive_awareness: 'Talento defensivo', ball_winning: 'Ganho de Bola', aggression: 'Agressividade',
                            gk_awareness: 'Talento de GO', gk_catching: 'Firmeza de GO', gk_clearing: 'Afast. de bola de GO', gk_reflexes: 'Reflexos de GO', gk_reach: 'Alcance de GO',
                          }
                          return (
                            <div key={key} className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-400 font-medium">{labels[key]}</span>
                                <span className="font-bold text-purple-400">{attrFilters[key] ?? '-'}</span>
                              </div>
                              <Slider
                                min={50} max={99} step={1}
                                value={[attrFilters[key] ?? 50]}
                                onValueChange={([v]) => setAttrFilters(p => ({ ...p, [key]: v === 50 ? null : v }))}
                              />
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {userRole === 'admin' && (
              <Sheet open={isCadastroOpen} onOpenChange={setIsCadastroOpen}>
                <SheetTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-lg px-8">
                    <PlusCircle className="w-6 h-6 mr-3" />
                    Novo Jogador
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl p-0 overflow-y-auto bg-zinc-950 border-l border-zinc-800">
                  <SheetHeader className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-6 py-5">
                    <SheetTitle className="text-2xl font-bold text-white">Cadastrar Novo Jogador</SheetTitle>
                    <SheetDescription className="text-zinc-400">
                      Preencha os dados do jogador. Nome e posição são obrigatórios.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="p-6">
                    <CadastrarJogadorForm onPlayerAdded={handleSuccess} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>

        {/* Busca + Filtros Básicos */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <Input
              placeholder="Procurar jogador..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="pl-12 h-14 bg-zinc-900/70 border-zinc-700 text-white placeholder:text-zinc-500 text-lg rounded-xl"
            />
          </div>

          <Select value={filterPosition} onValueChange={setFilterPosition}>
            <SelectTrigger className="w-full lg:w-64 h-14 bg-zinc-900/70 border-zinc-700 text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map(p => (
                <SelectItem key={p} value={p}>{p === 'Todas' ? 'Todas as posições' : p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="lg" onClick={clearAllFilters} className="h-14 px-6 bg-zinc-900/70 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500 text-white">
            <X className="w-5 h-5 mr-2" />
            Resetar Filtros
          </Button>
        </div>

        <div className="text-center mb-12">
          <p className="text-xl text-zinc-400">
            Encontrados <span className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{filteredPlayers.length}</span> jogadores
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-32">
            <Loader2 className="w-20 h-20 animate-spin text-purple-400" />
          </div>
        )}

        {fetchError && (
          <div className="text-center py-20">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <p className="text-2xl text-red-400">{fetchError}</p>
          </div>
        )}

{/* GRID VIEW (corrigida e atualizada com foto menor, nome fora da imagem, OVR destacado e valor abaixo da posição) */}
{viewMode === 'grid' && !loading && filteredPlayers.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
    {filteredPlayers.map(j => (
      <div
        key={j.id}
        className="group relative bg-zinc-900/90 rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/70 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer"
      >
        {/* Botão admin */}
        {userRole === 'admin' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              openEditPlayer(j)
            }}
            className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800/90 hover:bg-purple-600 p-2.5 rounded-full backdrop-blur"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}

        {/* FOTO MENOR + OVR DESTACADO SEM NOME EM CIMA */}
        <div className="relative h-52 bg-zinc-800">
          {j.photo_url ? (
            <img
              src={j.photo_url}
              alt={j.name}
              className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
              <span className="text-6xl font-black text-zinc-500 opacity-70">{j.position}</span>
            </div>
          )}

          {/* OVR estilo PES */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-3 py-1.5 rounded-lg border border-zinc-700 flex flex-col items-center">
            <span className="text-3xl font-black text-yellow-400">{j.overall}</span>
            <span className="text-[10px] text-zinc-300 -mt-1">OVR</span>
          </div>
        </div>

        {/* ÁREA DE INFORMAÇÕES FORA DA FOTO */}
        <div className="p-4 space-y-3">

          {/* Nome */}
          <h3 className="font-bold text-lg text-center leading-tight line-clamp-2">{j.name}</h3>

          {/* Posição */}
          <div className="flex justify-center">
            <Badge className="bg-purple-600 text-white text-xs font-bold px-4 py-1.5">{j.position}</Badge>
          </div>

          {/* Estilo de jogo */}
          <p className="text-xs text-zinc-400 text-center">{j.playstyle || 'Nenhum'}</p>

          {/* Clube */}
          <div className="flex items-center justify-center gap-2.5 mt-1">
            {j.logo_url ? (
              <img
                src={j.logo_url}
                alt={j.club}
                className="w-7 h-7 object-contain rounded-full ring-2 ring-zinc-700"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-7 h-7 bg-zinc-700 rounded-full" />
            )}

            <p className="text-sm text-zinc-300 truncate max-w-[150px] text-center">{j.club}</p>
          </div>

          {/* Valor abaixo da posição */}
          <p className="text-center text-xl font-black text-emerald-400 mt-2">
            R$ {Number(j.base_price).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    ))}
  </div>
)}


        {/* LIST VIEW CORRIGIDA E ENRIQUECIDA */}
        {viewMode === 'list' && !loading && filteredPlayers.length > 0 && (
          <div className="space-y-6">
            {filteredPlayers.map(j => {
              const isOpen = openedPlayers.includes(j.id)

              return (
                <div
                  key={j.id}
                  className="bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden transition-all hover:border-purple-500/70 hover:shadow-xl hover:shadow-purple-600/20"
                >
                  {/* Linha principal */}
                  <div
                    className="p-6 flex items-center gap-8 cursor-pointer select-none"
                    onClick={() => togglePlayer(j.id)}
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-purple-500/50 flex-shrink-0">
                      {j.photo_url ? (
                        <img src={j.photo_url} alt={j.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                          <span className="text-3xl font-black text-white">{j.position}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-sm">
                      <div>
                        <p className="text-zinc-500">Nome</p>
                        <p className="font-bold text-lg">{j.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Posição</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-purple-600">{j.position}</Badge>
                          {j.alternative_positions?.map(p => (
                            <Badge key={p} className="bg-red-600/20 text-red-300 border-red-600/40 text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-zinc-500">Clube</p>
                        <div className="flex items-center gap-2">
                          {renderClubLogo(j.logo_url, j.club)}
                          <span>{j.club}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-zinc-500">Overall</p>
                        <p className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">{j.overall}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Preço</p>
                        <p className="text-2xl font-bold text-emerald-400">R$ {Number(j.base_price).toLocaleString('pt-BR')}</p>
                      </div>

                      <div className="flex items-center justify-end gap-4">
                        {userRole === 'admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditPlayer(j)
                            }}
                          >
                            <Pencil className="w-5 h-5" />
                          </Button>
                        )}

                        <ChevronDown
                          className={cn(
                            "w-6 h-6 text-zinc-400 transition-transform duration-300",
                            isOpen && "rotate-180 text-purple-400"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {isOpen && (
                    <div className="border-t border-zinc-800 bg-zinc-900/50 px-6 py-6">
                      <div className="space-y-6">
                        {/* Linha 1: básicos */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                          <div><span className="text-zinc-500">Idade:</span> <strong>{j.age ?? '-'}</strong></div>
                          <div><span className="text-zinc-500">Nacionalidade:</span> <strong>{j.nationality}</strong></div>
                          <div><span className="text-zinc-500">Pé:</span> <strong>{j.preferred_foot}</strong></div>
                          <div><span className="text-zinc-500">Estilo de Jogo:</span> <strong>{j.playstyle || 'Nenhum'}</strong></div>
                        </div>

                        {/* Posições alternativas (título + tags em vermelho) */}
                        <div>
                          <p className="text-zinc-500 font-medium mb-2">Posições Alternativas:</p>
                          <div className="flex gap-2 flex-wrap">
                            {j.alternative_positions && j.alternative_positions.length > 0 ? (
                              j.alternative_positions.map(p => (
                                <Badge key={p} className="bg-red-600/20 text-red-300 border-red-600/40 text-xs">{p}</Badge>
                              ))
                            ) : (
                              <span className="text-zinc-500">Nenhuma</span>
                            )}
                          </div>
                        </div>

                        {/* Pé fraco e Frequência (com barrinhas) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm items-center">
                          <div>
                            <p className="text-zinc-500">Pé Fraco (Uso)</p>
                            <div className="flex items-center gap-3">
                              <LevelBars value={j.weak_foot_usage ?? 0} max={3} size="sm" />
                              <span className="font-bold">{j.weak_foot_usage ?? '-'}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-zinc-500">Pé Fraco (Precisão)</p>
                            <div className="flex items-center gap-3">
                              <LevelBars value={j.weak_foot_accuracy ?? 0} max={3} size="sm" />
                              <span className="font-bold">{j.weak_foot_accuracy ?? '-'}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-zinc-500">Forma Física</p>
                            <div className="flex items-center gap-3">
                              <LevelBars value={j.form ?? 0} max={8} size="md" />
                              <span className="font-bold">{j.form ?? '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Inspirador (mostrando 0-2 estrelas para cada categoria) */}
                        <div>
                          <p className="text-zinc-500 font-medium mb-2">Inspirador</p>
                          <div className="flex items-center gap-6">
                            <div className="text-sm">
                              <div className="text-zinc-400">Carregando</div>
                              <div className="flex gap-1 mt-1">
                                {Array.from({ length: 2 }).map((_, idx) => {
                                  const filled = (j.inspiring_ball_carry ?? 0) > idx
                                  return <Star key={idx} className={cn("w-4 h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                                })}
                              </div>
                            </div>

                            <div className="text-sm">
                              <div className="text-zinc-400">Passe Rasteiro</div>
                              <div className="flex gap-1 mt-1">
                                {Array.from({ length: 2 }).map((_, idx) => {
                                  const filled = (j.inspiring_low_pass ?? 0) > idx
                                  return <Star key={idx} className={cn("w-4 h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                                })}
                              </div>
                            </div>

                            <div className="text-sm">
                              <div className="text-zinc-400">Passe Alto</div>
                              <div className="flex gap-1 mt-1">
                                {Array.from({ length: 2 }).map((_, idx) => {
                                  const filled = (j.inspiring_lofted_pass ?? 0) > idx
                                  return <Star key={idx} className={cn("w-4 h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
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

                        {/* Atributos - sempre mostramos (placeholder 40 quando null) e aplicamos cor por valor */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-x-6 gap-y-4 text-xs">
                          {[
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
                          ].map(({ k, l }) => {
                            const value = j[k as keyof Player] as number | null
                            // sempre mostramos: se não existir, mostramos placeholder 40
                            const display = (value ?? 40)
                            const color = getAttrColorHex(display)
                            return (
                              <div key={k} className="text-center">
                                <p className="text-zinc-500 font-medium">{l}</p>
                                <p className="text-xl font-black" style={{ color }}>{display}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Sheet de Edição */}
        <Sheet open={isEdicaoOpen} onOpenChange={setIsEdicaoOpen}>
          <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl p-0 overflow-y-auto bg-zinc-950 border-l border-zinc-800">
            <SheetHeader className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-6 py-5">
              <SheetTitle className="text-2xl font-bold text-white">Editar Jogador</SheetTitle>
              <SheetDescription className="text-zinc-400">
                Atualize os dados do jogador e clique em salvar.
              </SheetDescription>
            </SheetHeader>
            <div className="p-6">
              {jogadorEditando && (
                <CadastrarJogadorForm playerToEdit={jogadorEditando} onPlayerAdded={handleSuccess} />
              )}
            </div>
          </SheetContent>
        </Sheet>

        {!loading && filteredPlayers.length === 0 && (
          <div className="text-center py-32">
            <div className="max-w-md mx-auto bg-zinc-900/80 rounded-3xl p-16 border border-zinc-800">
              <h3 className="text-4xl font-bold text-white mb-4">Nenhum jogador encontrado</h3>
              <p className="text-zinc-400 text-lg">Tente ajustar os filtros.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
