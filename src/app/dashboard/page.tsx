// src/app/dashboard/page.tsx → VERSÃO COM LOGS PARA DEBUG
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DollarSign, Shirt, Trophy, Calendar, LogOut, Crown, ArrowRight, ArrowLeftRight, Users, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

let hasInitialized = false

console.log('DashboardPage renderizando...')

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
  const [expandedTile, setExpandedTile] = useState<string | null>(null)

  useEffect(() => {
    if (hasInitialized) {
      console.log('Dashboard useEffect pulado (já inicializado)')
      return
    }
    hasInitialized = true
    console.log('Dashboard useEffect rodando pela primeira vez')

    const loadUserAndData = async () => {
      console.log('loadUserAndData iniciado')
      // getUser() é o mais confiável com persistSession: false
      const { data: { user }, error } = await supabase.auth.getUser()

      console.log('getUser result:', { user: user ? user.email : 'null', error: error?.message })

      if (error || !user) {
        console.log('Sem usuário → indo pro login')
        router.replace('/login')
        return
      }

      console.log('Logado como:', user.email)
      setUser(user)

      // Busca ou cria profile
      console.log('Buscando profile...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', user.id)
        .single()

      console.log('Profile query result:', { profileData: profileData ? 'encontrado' : 'null', profileError: profileError?.message })

      if (profileError?.code === 'PGRST116' || !profileData) {
        console.log('Profile não existe → criando novo')
        const isAdmin = user.email === 'wellinton.sbatista@gmail.com'
        const defaultCoachName = user.user_metadata.full_name || user.email?.split('@')[0] || 'Técnico'

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata.full_name || user.email,
            coach_name: defaultCoachName,
            role: isAdmin ? 'admin' : 'coach',
          })
          .select('*, teams(*)')
          .single()

        console.log('Profile insert result:', { newProfile: newProfile ? 'criado' : 'falha', insertError: insertError?.message })

        if (insertError) {
          console.error('Erro ao criar profile:', insertError)
          alert('Erro ao criar seu perfil. Tente novamente.')
          router.replace('/login')
          return
        }

        setProfile(newProfile)
        setTeam(newProfile?.teams || null)
      } else {
        console.log('Profile encontrado → carregando dados')
        setProfile(profileData)
        setTeam(profileData?.teams || null)
      }

      console.log('Dashboard carregado com sucesso')
      setLoading(false)
    }

    loadUserAndData().catch(err => {
      console.error('Erro fatal no loadUserAndData:', err)
      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
  console.log('Logout iniciado — limpando tudo')
  await supabase.auth.signOut({ scope: 'global' })

  // LIMPEZA TOTAL ABSOLUTA
  document.cookie.split(";").forEach(c => {
    const name = c.trim().split('=')[0]
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  })

  // Remove qualquer coisa que tenha ficado no localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      localStorage.removeItem(key)
    }
  })

  router.replace('/login')
  router.refresh()
}

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">Carregando seu império...</div>
      </div>
    )
  }

  const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'
  const displayName = profile?.coach_name || user?.user_metadata.full_name || user?.email || 'Técnico'

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
                {displayName}
                {isAdmin && <Crown className="h-5 w-5 text-yellow-500" />}
              </p>
            </div>

            {team?.logo_url ? (
              <Image src={team.logo_url} alt={team.name} width={64} height={64} className="rounded-full border-4 border-purple-600/50 shadow-xl object-cover" />
            ) : (
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-2xl font-bold">
                  {displayName[0].toUpperCase()}
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
                  {displayName[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="text-center md:text-left">
              <h2 className="text-5xl font-black text-white">{displayName}</h2>
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
              <Card
                key={tile.title}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-700 cursor-pointer ${
                  expandedTile === tile.title
                    ? 'row-span-2 lg:col-span-2 scale-105 shadow-3xl z-10'
                    : 'hover:scale-105 hover:shadow-purple-600/40'
                }`}
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
                  <div className="transition-all duration-700">
                    <p className={`font-black text-white ${expandedTile === tile.title ? 'text-6xl' : 'text-5xl'}`}>
                      {tile.value}
                    </p>
                    <p className={`font-medium text-${tile.color}-400 ${expandedTile === tile.title ? 'text-2xl mt-4' : 'text-lg'}`}>
                      {tile.subtitle}
                    </p>
                  </div>

                  {expandedTile === tile.title && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                        <p className="text-zinc-400 italic">Em breve: dados reais aqui</p>
                      </div>
                    </div>
                  )}

                  <Link href={tile.link} onClick={(e) => e.stopPropagation()} className="block mt-6">
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