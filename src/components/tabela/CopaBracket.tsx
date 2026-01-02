'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Trophy, ArrowRight, Shield, Check, Trash2, Edit2, Play, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
// Import the existing AdminMatchModal
import AdminMatchModal from './calendario/AdminMatchModal'

interface Team {
  id: string
  name: string
  logo_url?: string
}

interface Match {
  id: string
  date: string
  time: string
  home_team_id: string
  away_team_id?: string
  round: number
  divisao: 'A' | 'B'
  status: 'scheduled' | 'in_progress' | 'finished' | 'tbd'
  home_score?: number
  away_score?: number
  time_casa: Team | null
  time_fora: Team | null
  // Additional fields for AdminMatchModal compatibility
  video_url?: string
  stadium?: string
  possession_home?: number
  possession_away?: number
  shots_home?: number
  shots_away?: number
}

export default function CopaBracket() {
  const { organization } = useOrganization()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Edit State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // -- Data Loading & Admin Checks --
  useEffect(() => {
    if (!user || !organization?.id) return
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('organization_id', organization.id)
        .single()
      setIsAdmin(data?.role === 'admin')
    }
    checkAdmin()
  }, [user, organization?.id])

  const loadData = async () => {
    if (!organization?.id) return
    setLoading(true)
    try {
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
            *,
            time_casa:home_team_id(id, name, logo_url),
            time_fora:away_team_id(id, name, logo_url)
        `)
        .eq('organization_id', organization.id)
        .eq('competition', 'Copa')
        .order('round', { ascending: true })
        .order('created_at', { ascending: true })
      setMatches(matchesData || [])

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true })
      setTeams(teamsData || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleMatchUpdate = () => { loadData() }
    window.addEventListener('match-updated', handleMatchUpdate)
    return () => window.removeEventListener('match-updated', handleMatchUpdate)
  }, [organization?.id])

  // -- Actions --
  const handleCreateCup = async () => {
    if (!organization?.id) return
    if (selectedTeams.length < 2) return toast.error('Selecione pelo menos 2 times.')
    if (matches.length > 0 && !confirm('ATENÇÃO: Isso apagará toda a copa atual. Deseja continuar?')) return

    setGenerating(true)
    const { createCupAction } = await import('@/app/actions/bracket')
    const res = await createCupAction(selectedTeams, organization.id)
    setGenerating(false)
    if (res.success) { toast.success(res.message); loadData() }
    else toast.error(res.message)
  }

  const handleClearCup = async () => {
    if (!organization?.id) return
    if (!confirm('Tem certeza? Isso apagará TODO o histórico da copa atual permanentemente.')) return

    setGenerating(true)
    const { clearCupAction } = await import('@/app/actions/bracket')
    const res = await clearCupAction(organization.id)
    setGenerating(false)

    if (res.success) {
      toast.success(res.message)
      loadData()
      setSelectedTeams([])
    } else {
      toast.error(res.message)
    }
  }

  const handleAdvanceRound = async (currentRound: number) => {
    if (!organization?.id) return
    // Check if we really can advance
    const currentRoundMatches = matches.filter(m => m.round === currentRound)
    const allFinished = currentRoundMatches.every(m => m.status === 'finished')

    if (!allFinished) {
      if (!confirm('Atenção: Nem todos os jogos desta fase estão finalizados. Deseja tentar avançar mesmo assim? (Pode falhar se faltarem vencedores)')) return;
    } else {
      if (!confirm(`Confirmar geração da próxima fase?`)) return
    }

    setGenerating(true)
    const { advanceCupRoundAction } = await import('@/app/actions/bracket')
    const res = await advanceCupRoundAction(currentRound, organization.id)
    setGenerating(false)
    if (res.success) { toast.success(res.message); loadData() }
    else toast.error(res.message)
  }

  const handleToggleTeam = (id: string) => setSelectedTeams(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match)
    setIsEditModalOpen(true)
  }

  // Logic to build THE FULL TREE ("Skeleton")
  const r1Matches = matches.filter(m => m.round === 1)
  const estimatedTotalRounds = Math.ceil(Math.log2(r1Matches.length)) + 1
  const dbMaxRound = Math.max(...matches.map(m => m.round), 0)
  const totalRounds = Math.max(estimatedTotalRounds, dbMaxRound)

  const bracketData: Record<number, Match[]> = {}

  for (let r = 1; r <= totalRounds; r++) {
    const existing = matches.filter(m => m.round === r)
    const slotsCount = Math.ceil(r1Matches.length / Math.pow(2, r - 1))
    const slots: Match[] = []
    for (let i = 0; i < slotsCount; i++) {
      if (existing[i]) {
        slots.push(existing[i])
      } else {
        slots.push({
          id: `tbd-r${r}-i${i}`,
          date: '',
          time: '',
          home_team_id: 'tbd',
          away_team_id: 'tbd',
          round: r,
          divisao: 'A',
          status: 'tbd',
          home_score: undefined,
          away_score: undefined,
          time_casa: { id: 'tbd', name: 'A Definir' },
          time_fora: { id: 'tbd', name: 'A Definir' },
        })
      }
    }
    bracketData[r] = slots
  }

  const getRoundName = (r: number) => {
    const diff = totalRounds - r
    if (diff === 0) return 'Grande Final'
    if (diff === 1) return 'Semifinal'
    if (diff === 2) return 'Quartas de Final'
    if (diff === 3) return 'Oitavas de Final'
    return `Fase ${r}`
  }

  // --- Subcomponents ---

  const MatchNode = ({ match, align }: { match: Match, align: 'left' | 'right' | 'center' }) => {
    const isPlayed = match.status === 'finished'
    const isTBD = match.status === 'tbd'

    const winnerId = isPlayed && match.home_score !== undefined && match.away_score !== undefined
      ? (match.home_score > match.away_score ? match.home_team_id : match.away_score > match.home_score ? match.away_team_id : 'draw')
      : null

    if (isTBD) {
      return (
        <div className="w-44 md:w-56 h-20 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/50 flex items-center justify-center text-zinc-600 text-xs gap-2">
          <Shield className="w-4 h-4 opacity-20" /> A Definir
        </div>
      )
    }

    return (
      <div className={cn(
        "relative z-10 w-44 md:w-56 bg-zinc-900 border rounded-lg shadow-lg flex flex-col transition-all group hover:z-20",
        match.status === 'in_progress' ? "border-yellow-500/50 shadow-yellow-900/20" : "border-zinc-800 hover:border-zinc-700"
      )}>
        {/* Admin Edit Trigger */}
        {isAdmin && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow-md bg-zinc-800 hover:bg-yellow-500 hover:text-black border border-zinc-700"
              onClick={() => handleEditMatch(match)}
              title="Editar Resultado">
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Header / Date */}
        <div className="bg-black/40 px-3 py-1 text-[10px] text-zinc-500 flex justify-between rounded-t-lg">
          <span>#{match.id.slice(0, 4)}</span>
          <span>{match.time ? match.time.slice(0, 5) : ''}</span>
        </div>

        {/* Teams */}
        <div className="flex flex-col p-2 gap-1 text-sm font-medium">
          {/* Home */}
          <div className={cn("flex justify-between items-center rounded px-2 py-1", winnerId === match.home_team_id ? "bg-white/5 text-yellow-400 font-bold" : "text-zinc-300")}>
            <div className="flex items-center gap-2 overflow-hidden">
              {match.time_casa?.logo_url ? <img src={match.time_casa.logo_url} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 bg-zinc-800 rounded-full" />}
              <span className="truncate">{match.time_casa?.name}</span>
            </div>
            <span className="font-mono">{match.home_score ?? '-'}</span>
          </div>
          {/* Away */}
          <div className={cn("flex justify-between items-center rounded px-2 py-1", winnerId === match.away_team_id ? "bg-white/5 text-yellow-400 font-bold" : "text-zinc-300")}>
            <div className="flex items-center gap-2 overflow-hidden">
              {match.time_fora?.logo_url ? <img src={match.time_fora.logo_url} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 bg-zinc-800 rounded-full" />}
              <span className="truncate">{match.time_fora?.name || (match.away_team_id === null ? '(Bye)' : 'TBD')}</span>
            </div>
            <span className="font-mono">{match.away_score ?? '-'}</span>
          </div>
        </div>

        {/* Status Indicator */}
        {match.status === 'in_progress' && (
          <div className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
        )}
      </div>
    )
  }

  // Layout Setup
  const finalMatches = bracketData[totalRounds] || []
  const roundsBeforeFinal = Array.from({ length: totalRounds - 1 }, (_, i) => i + 1)
  const leftTreeRounds = roundsBeforeFinal.map(r => ({ round: r, matches: bracketData[r].slice(0, Math.ceil(bracketData[r].length / 2)) }))
  const rightTreeRounds = roundsBeforeFinal.map(r => ({ round: r, matches: bracketData[r].slice(Math.ceil(bracketData[r].length / 2)) }))

  // Check advancement status
  const maxRoundVisited = Math.max(...matches.map(m => m.round), 0)
  const currentRoundMatches = matches.filter(m => m.round === maxRoundVisited)
  const allCurrentFinished = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === 'finished')
  const canAdvance = maxRoundVisited < totalRounds && allCurrentFinished

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">

      {/* Admin Header */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-500 font-bold">
            <Shield className="w-5 h-5" /> <span>Painel Admin da Copa</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCreateCup} className="text-zinc-500 hover:text-white hover:bg-zinc-800">
              <RefreshCw className="w-4 h-4 mr-2" /> Resetar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearCup} className="text-red-500 hover:bg-red-950/50">
              <Trash2 className="w-4 h-4 mr-2" /> Limpar Copa
            </Button>

            {/* Contextual Advance Button */}
            {maxRoundVisited < totalRounds && (
              <Button
                size="sm"
                onClick={() => handleAdvanceRound(maxRoundVisited)}
                className={cn(
                  "font-bold transition-all shadow-lg",
                  allCurrentFinished
                    ? "bg-green-600 hover:bg-green-500 text-white animate-pulse shadow-green-900/40" // Ready to advance
                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white" // Waiting
                )}
                disabled={generating}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : (allCurrentFinished ? <Play className="w-4 h-4 mr-2 fill-current" /> : <ArrowRight className="w-4 h-4 mr-2" />)}
                {allCurrentFinished ? "Gerar Próxima Fase" : "Avançar Fase (Aguardando)"}
              </Button>
            )}
            {maxRoundVisited === totalRounds && allCurrentFinished && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-xs font-bold uppercase">
                <Trophy className="w-4 h-4" /> Copa Finalizada
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE: SELECT TEAMS */}
      {!loading && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 animate-in fade-in zoom-in duration-500">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-xl">
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Nova Copa</h2>
              <p className="text-zinc-400 max-w-md mx-auto">Selecione os times que participarão do sorteio. O sistema criará as chaves automaticamente.</p>
            </div>

            {isAdmin ? (
              <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-zinc-500" />
                      Times Disponíveis
                    </h3>
                    <span className="text-xs font-bold px-3 py-1 bg-zinc-800 rounded-full text-zinc-400">
                      {selectedTeams.length} selecionados
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700">
                    {teams.map(team => (
                      <div
                        key={team.id}
                        onClick={() => handleToggleTeam(team.id)}
                        className={cn(
                          "cursor-pointer group relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 select-none",
                          selectedTeams.includes(team.id)
                            ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                            : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                        )}
                      >
                        <div className="relative">
                          {team.logo_url ? (
                            <img src={team.logo_url} className="w-8 h-8 object-contain" />
                          ) : (
                            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
                          )}
                          {selectedTeams.includes(team.id) && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black rounded-full p-[2px]">
                              <Check className="w-2 h-2" strokeWidth={4} />
                            </div>
                          )}
                        </div>
                        <span className={cn("text-xs font-bold truncate", selectedTeams.includes(team.id) ? "text-yellow-500" : "text-zinc-400 group-hover:text-zinc-200")}>
                          {team.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end pt-4 border-t border-zinc-800">
                    <Button
                      size="lg"
                      onClick={handleCreateCup}
                      disabled={selectedTeams.length < 2 || generating}
                      className="font-bold bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-900/20"
                    >
                      {generating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trophy className="w-5 h-5 mr-2" />}
                      Sortear e Gerar Chaves
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-12 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed">
                <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">Aguardando o administrador definir os times e iniciar a copa.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BRACKET AREA */}
      {!loading && matches.length > 0 && (
        <div className="flex-1 overflow-auto p-8 flex items-center justify-start xl:justify-center">
          <div className="flex gap-12 min-w-max mx-auto">
            {/* --- LEFT TREE --- */}
            <div className="flex gap-8">
              {leftTreeRounds.map((layer, layerIdx) => (
                <div key={layer.round} className="flex flex-col justify-around relative">
                  <div className="absolute -top-10 w-full text-center font-bold text-zinc-500 uppercase tracking-widest text-xs">
                    {getRoundName(layer.round)}
                  </div>
                  {layer.matches.map((match, idx) => {
                    const isPairTop = idx % 2 === 0
                    return (
                      <div key={match.id} className="relative flex items-center py-4">
                        <MatchNode match={match} align="left" />
                        <div className={cn(
                          "absolute -right-8 w-8 border-r-2 border-zinc-700",
                          layerIdx === leftTreeRounds.length - 1 ? "h-[2px] border-r-0 border-b-2 right-[-2rem] top-1/2 w-8"
                            : isPairTop ? "h-[50%] top-[50%] border-t-2 rounded-tr-lg" : "h-[50%] bottom-[50%] border-b-2 rounded-br-lg"
                        )}></div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* --- CENTER: FINAL --- */}
            <div className="flex flex-col justify-center items-center px-4 relative">
              <div className="absolute -top-10 text-yellow-500 font-extrabold tracking-[0.2em] text-lg animate-pulse drop-shadow-glow">FINAL</div>
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
                <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] relative z-10" />
              </div>
              {finalMatches.map(m => (
                <div key={m.id} className="relative scale-110">
                  <div className="absolute top-1/2 -left-8 w-8 h-[2px] bg-zinc-700"></div>
                  <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-zinc-700"></div>
                  <MatchNode match={m} align="center" />
                </div>
              ))}
            </div>

            {/* --- RIGHT TREE --- */}
            <div className="flex gap-8 flex-row-reverse">
              {rightTreeRounds.map((layer, layerIdx) => (
                <div key={layer.round} className="flex flex-col justify-around relative">
                  <div className="absolute -top-10 w-full text-center font-bold text-zinc-500 uppercase tracking-widest text-xs">
                    {getRoundName(layer.round)}
                  </div>
                  {layer.matches.map((match, idx) => {
                    const isPairTop = idx % 2 === 0
                    return (
                      <div key={match.id} className="relative flex items-center py-4">
                        <MatchNode match={match} align="right" />
                        <div className={cn(
                          "absolute -left-8 w-8 border-l-2 border-zinc-700",
                          layerIdx === rightTreeRounds.length - 1 ? "h-[2px] border-l-0 border-b-2 left-[-2rem] top-1/2 w-8"
                            : isPairTop ? "h-[50%] top-[50%] border-t-2 rounded-tl-lg" : "h-[50%] bottom-[50%] border-b-2 rounded-bl-lg"
                        )}></div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>


      )}

      {/* Modal Editor */}
      {selectedMatch && isAdmin && (
        <AdminMatchModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          match={selectedMatch as any}
          currentUser={{ id: user?.id || '', role: 'admin' }}
        />
      )}
    </div>
  )
}