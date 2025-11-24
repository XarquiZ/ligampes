// src/app/dashboard/page.tsx → VERSÃO 100% CORRETA E FINAL
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Shirt, Trophy, Calendar, LogOut, Crown, ArrowRight, ArrowLeftRight, Users, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function formatBalance(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [coachName, setCoachName] = useState('')
  const [expandedTile, setExpandedTile] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // IMPORTANTE: NUNCA mais redireciona pro login aqui!
      // O app/page.tsx e o middleware já garantem que só chega aqui com sessão

      if (!session) {
        setLoading(false)
        return
      }

      setUser(session.user)

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!existingProfile || !existingProfile.coach_name) {
        setShowWelcome(true)
      } else {
        setProfile(existingProfile)
        setTeam(existingProfile.teams || null)
      }

      setLoading(false)
    }

    load()
  }, [])

  const handleSaveCoachName = async () => {
    if (!coachName.trim() || coachName.length < 3) {
      alert('Digite um nome com pelo menos 3 letras!')
      return
    }

    setLoading(true)

    const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata.full_name || user.email,
        coach_name: coachName.trim(),
        role: isAdmin ? 'admin' : 'coach',
      })
      .select('*, teams(*)')
      .single()

    if (error) {
      console.error('Erro ao salvar técnico:', error)
      alert('Erro ao salvar. Tente novamente.')
      setLoading(false)
      return
    }

    setProfile(newProfile)
    setTeam(newProfile.teams || null)
    setShowWelcome(false)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">Carregando seu império...</div>
      </div>
    )
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/50 to-zinc-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-purple-500/50 bg-zinc-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Trophy className="w-14 h-14 text-white" />
            </div>
            <CardTitle className="text-4xl font-black text-white">
              Bem-vindo à LIGA MPES!
            </CardTitle>
            <p className="text-xl text-zinc-300">
              Antes de dominar o campeonato, escolha o nome do seu técnico:
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="coach" className="text-lg text-white">
                Nome do Técnico
              </Label>
              <Input
                id="coach"
                placeholder="Ex: Tite, Felipão, Guardiola..."
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="text-lg h-14 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCoachName()}
              />
            </div>
            <Button
              onClick={handleSaveCoachName}
              size="lg"
              className="w-full text-lg font-bold h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Entrar no Jogo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'

  const tiles = [
    { title: 'SALDO', icon: DollarSign, color: 'green', value: formatBalance(team?.balance || 0), subtitle: 'disponível para gastar', link: '/dashboard/saldo' },
    { title: 'MEU ELENCO', icon: Shirt, color: 'blue', value: '0/25', subtitle: 'meus jogadores', link: '/dashboard/elenco' },
    { title: 'CLASSIFICAÇÃO', icon: Trophy, color: 'yellow', value: '—', subtitle: 'posição atual', link: '/dashboard/classificacao' },
    { title: 'LEILÃO', icon: Calendar, color: 'red', value: 'EM BREVE', subtitle: 'próximo evento', link: '/dashboard/leilao' },
    { title: 'TRANSFERÊNCIAS', icon: ArrowLeftRight, color: 'purple', value: 'Mercado', subtitle: 'negociações ativas', link: '/dashboard/transferencias' },
    { title: 'JOGADORES', icon: Users, color: 'pink', value: 'Pool', subtitle: 'todos os atletas', link: '/dashboard/jogadores' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-3xl font-black text-transparent">
            LIGA MPES
          </h1>
          <div className="flex items-center gap-5">
            <div className="hidden text-right md:block">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Técnico</p>
              <p className="text-lg font-bold text-white flex items-center gap-2">
                {profile?.coach_name || user?.user_metadata.full_name || user?.email}
                {isAdmin && <Crown className="h-5 w-5 text-yellow-500" />}
              </p>
            </div>
            {team?.logo_url ? (
              <Image src={team.logo_url} alt={team.name} width={64} height={64} className="rounded-full border-4 border-purple-600/50 shadow-xl object-cover" />
            ) : (
              <Avatar className="h-16 w-.was">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-2xl font-bold">
                  {profile?.coach_name?.[0] || user?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-400 hover:text-red-300">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {team?.logo_url ? (
              <Image src={team.logo_url} alt={team.name} width={160} height={160} className="rounded-3xl border-8 border-purple-600/30 shadow-2xl object-cover" />
            ) : (
              <Avatar className="h-40 w-40 border-8 border-purple-600/30">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-7xl font-black">
                  {profile?.coach_name?.[0] || user?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="text-center md:text-left">
              <h2 className="text-5xl font-black text-white">{profile?.coach_name || user?.user_metadata.full_name}</h2>
              <p className="mt-3 text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {team?.name || 'Sem time ainda'}
              </p>
              {isAdmin && (
                <p className="mt-3 text-lg font-medium text-yellow-500 flex items-center justify-center md:justify-start gap-2">
                  <Crown className="h-6 w-6" /> ADMINISTRADOR SUPREMO <Crown className="h-6 w-6" />
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tiles.map((tile) => (
              <Card key={tile.title} className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-700 cursor-pointer ${expandedTile === tile.title ? 'row-span-2 lg:col-span-2 scale-105 shadow-3xl' : 'hover:scale-105 hover:shadow-purple-600/40'}`} onClick={() => setExpandedTile(expandedTile === tile.title ? null : tile.title)}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <tile.icon className={`h-12 w-12 text-${tile.color}-400 drop-shadow-lg`} />
                      {tile.title}
                    </div>
                    {expandedTile === tile.title ? <ChevronUp className="h-8 w-8" /> : <ChevronDown className="h-8 w-8" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space reactants-y-6">
                  <div className="transition-all duration-700">
                    <p className={`font-black text-white ${expandedTile === tile.title ? 'text-6xl' : 'text-5xl'}`}>{tile.value}</p>
                    <p className={`font-medium text-${tile.color}-400 ${expandedTile === tile.title ? 'text-2xl mt-4' : 'text-lg'}`}>{tile.subtitle}</p>
                  </div>
                  <Link href={tile.link} onClick={(e) => e.stopPropagation()} className="block">
                    <Button className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/20 hover:to-white/30 border border-white/20 text-white font-bold text-lg py-6">
                      Ver {tile.title.toLowerCase()} completo <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}