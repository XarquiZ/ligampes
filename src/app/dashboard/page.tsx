// src/app/dashboard/page.tsx ← DASHBOARD COM 3 ESTÁGIOS: NORMAL → EXPANDIDO → PÁGINA COMPLETA
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
  const [loading, setLoading] = useState(true)
  const [expandedTile, setExpandedTile] = useState<string | null>(null) // ← controla qual tile tá expandido

  useEffect(() => {
    console.log('🏠 Dashboard Page Mounted')
    
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('👤 Dashboard - Session:', session)
      
      if (!session) {
        console.log('❌ No session, redirecting to login...')
        router.push('/login')
        return
      }

      console.log('✅ User authenticated:', session.user.email)
      setUser(session.user)

      let { data: profile } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', session.user.id)
        .single()

      console.log('📊 Profile data:', profile)

      if (!profile) {
        console.log('🆕 Creating new profile...')
        const isAdmin = session.user.email === 'wellinton.sbatista@gmail.com'
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata.full_name || session.user.email,
            role: isAdmin ? 'admin' : 'coach'
          })
          .select('*, teams(*)')
          .single()
        profile = newProfile
        console.log('✅ New profile created:', profile)
      }

      setTeam(profile?.teams || null)
      setLoading(false)
      console.log('✅ Dashboard loaded successfully')
    }
    load()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">Carregando seu império...</div>
      </div>
    )
  }

  const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'

  const tiles = [
    {
      title: 'SALDO',
      icon: DollarSign,
      color: 'green',
      value: formatBalance(team?.balance || 0),
      subtitle: 'disponível para gastar',
      expanded: 'Últimas 3 transações aqui (em breve)',
      link: '/dashboard/saldo'
    },
    {
      title: 'MEU ELENCO',
      icon: Shirt,
      color: 'blue',
      value: '0/25',
      subtitle: 'meus jogadores',
      expanded: 'Top 5 jogadores mais valiosos do seu time',
      link: '/dashboard/elenco'
    },
    {
      title: 'CLASSIFICAÇÃO',
      icon: Trophy,
      color: 'yellow',
      value: '—',
      subtitle: 'posição atual',
      expanded: 'Top 3 times + sua posição destacada',
      link: '/dashboard/classificacao'
    },
    {
      title: 'LEILÃO',
      icon: Calendar,
      color: 'red',
      value: 'EM BREVE',
      subtitle: 'próximo evento',
      expanded: 'Contagem regressiva + último arremate',
      link: '/dashboard/leilao'
    },
    {
      title: 'TRANSFERÊNCIAS',
      icon: ArrowLeftRight,
      color: 'purple',
      value: 'Mercado',
      subtitle: 'negociações ativas',
      expanded: 'Últimas 2 negociações pendentes',
      link: '/dashboard/transferencias'
    },
    {
      title: 'JOGADORES',
      icon: Users,
      color: 'pink',
      value: 'Pool',
      subtitle: 'todos os atletas',
      expanded: 'Jogadores mais valiosos do campeonato',
      link: '/dashboard/jogadores'
    },
  ]

  return (
    <>
      {/* HEADER (igual antes) */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-3xl font-black text-transparent">
            LIGA MPES
          </h1>

          <div className="flex items-center gap-5">
            <div className="hidden text-right md:block">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Dono do jogo</p>
              <p className="text-lg font-bold text-white flex items-center gap-2">
                {user?.user_metadata.full_name || user?.email}
                {isAdmin && <Crown className="h-5 w-5 text-yellow-500" />}
              </p>
            </div>

            {team?.logo_url ? (
              <Image src={team.logo_url} alt={team.name} width={64} height={64} className="rounded-full border-4 border-purple-600/50 shadow-xl object-cover" />
            ) : (
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-2xl font-bold">
                  {user?.user_metadata.full_name?.[0] || user?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <Button variant="ghost" size="sm" onClick={async () => { 
              console.log('🚪 Logging out...')
              await supabase.auth.signOut(); 
              router.push('/login') 
            }} className="text-red-400 hover:text-red-300">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-8">
        <div className="mx-auto max-w-7xl space-y-12">

          {/* PERFIL (igual antes) */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            {team?.logo_url ? (
              <Image src={team.logo_url} alt={team.name} width={160} height={160} className="rounded-3xl border-8 border-purple-600/30 shadow-2xl object-cover" />
            ) : (
              <Avatar className="h-40 w-40 border-8 border-purple-600/30">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-7xl font-black">
                  {user?.user_metadata.full_name?.[0] || user?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="text-center md:text-left">
              <h2 className="text-5xl font-black text-white">{user?.user_metadata.full_name || user?.email}</h2>
              <p className="mt-3 text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {team?.name || 'Sem time'}
              </p>
              {isAdmin && (
                <p className="mt-3 text-lg font-medium text-yellow-500 flex items-center justify-center md:justify-start gap-2">
                  <Crown className="h-6 w-6" /> ADMINISTRADOR SUPREMO <Crown className="h-6 w-6" />
                </p>
              )}
            </div>
          </div>

          {/* 6 TILES COM 3 ESTÁGIOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tiles.map((tile) => (
              <Card
                key={tile.title}
                className={`
                  group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl 
                  transition-all duration-700 cursor-pointer
                  ${expandedTile === tile.title 
                    ? 'row-span-2 lg:col-span-2 scale-105 shadow-3xl' 
                    : 'hover:scale-105 hover:shadow-purple-600/40'
                  }
                `}
                onClick={() => setExpandedTile(expandedTile === tile.title ? null : tile.title)}
              >
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

                <CardContent className="relative z-10 space-y-6">
                  {/* ESTÁGIO 1 & 2 */}
                  <div className="transition-all duration-700">
                    <p className={`font-black text-white ${expandedTile === tile.title ? 'text-6xl' : 'text-5xl'}`}>
                      {tile.value}
                    </p>
                    <p className={`font-medium text-${tile.color}-400 ${expandedTile === tile.title ? 'text-2xl mt-4' : 'text-lg'}`}>
                      {tile.subtitle}
                    </p>
                  </div>

                  {/* ESTÁGIO 2: EXPANDIDO */}
                  {expandedTile === tile.title && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
                      <p className="text-lg text-zinc-300 leading-relaxed">
                        {tile.expanded}
                      </p>
                      <div className="mt-6 p-6 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-center text-zinc-400 italic">Em breve: dados reais aqui</p>
                      </div>
                    </div>
                  )}

                  {/* ESTÁGIO 3: BOTÃO VER COMPLETO */}
                  <Link href={tile.link} onClick={(e) => e.stopPropagation()} className="block">
                    <Button className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/20 hover:to-white/30 border border-white/20 text-white font-bold text-lg py-6">
                      Ver {tile.title.toLowerCase()} completo
                      <ArrowRight className="ml-3 h-6 w-6" />
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