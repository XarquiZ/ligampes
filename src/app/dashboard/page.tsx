// src/app/dashboard/page.tsx - VERSÃO CORRIGIDA
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DollarSign, Shirt, Calendar, Crown, ArrowRight, ArrowLeftRight, Users, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'
import Sidebar from '@/components/Sidebar'

// Definir tipos para user e team
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  balance?: number;
}

function formatBalance(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [expandedTile, setExpandedTile] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  // Carrega dados profile/team
  useEffect(() => {
    if (authLoading || !user) return

    const loadUserData = async () => {
      try {
        console.log('[Dashboard] Carregando dados do usuário...')
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.log('[Dashboard] Criando novo profile...')

          const isAdmin = user.email === 'wellinton.sbatista@gmail.com'
          const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Técnico'

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.email,
              coach_name: defaultName,
              role: isAdmin ? 'admin' : 'coach',
            })
            .select('*, teams(*)')
            .single()

          if (createError) {
            console.error('[Dashboard] Erro ao criar profile:', createError)
          } else {
            setProfile(newProfile)
            setTeam(newProfile?.teams || null)
          }
        } else {
          setProfile(profileData)
          setTeam(profileData?.teams || null)
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao carregar dados:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadUserData()
  }, [authLoading, user])

  // Carregar contagem de mensagens não lidas
  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCount = async () => {
      try {
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        if (!conversations?.length) {
          setUnreadCount(0)
          return
        }

        const conversationIds = conversations.map(conv => conv.id)
        
        const { count } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('read', false)
          .neq('sender_id', user.id)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Erro ao carregar contagem de mensagens:', error)
      }
    }

    loadUnreadCount()

    // Subscription para atualizar em tempo real
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages'
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando seu império...
        </div>
      </div>
    )
  }

  const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'
  const displayName = profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico'

  // Criar objeto user compatível com os componentes de chat
  const chatUser = {
    id: user?.id || '',
    name: displayName,
    email: user?.email || ''
  }

  // Criar objeto team compatível com os componentes de chat
  const chatTeam = {
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }

  const tiles = [
    { 
      title: 'SALDO', 
      icon: DollarSign, 
      color: 'green', 
      value: formatBalance(team?.balance || 0), 
      subtitle: 'disponível para gastar', 
      link: '/dashboard/saldo',
      buttonText: 'Ver saldo'
    },
    { 
      title: 'MEU ELENCO', 
      icon: Shirt, 
      color: 'blue', 
      value: '0/25', 
      subtitle: 'meus jogadores', 
      link: '/dashboard/elenco',
      buttonText: 'Ver elenco'
    },
    { 
      title: 'JOGADORES', 
      icon: Users, 
      color: 'pink', 
      value: 'Pool', 
      subtitle: 'todos os atletas', 
      link: '/dashboard/jogadores',
      buttonText: 'Ver jogadores'
    },
    { 
      title: 'LEILÃO', 
      icon: Calendar, 
      color: 'red', 
      value: 'EM BREVE', 
      subtitle: 'próximo evento', 
      link: '/dashboard/leilao',
      buttonText: 'Ver leilão'
    },
    { 
      title: 'TRANSFERÊNCIAS', 
      icon: ArrowLeftRight, 
      color: 'purple', 
      value: 'Mercado', 
      subtitle: 'negociações ativas', 
      link: '/dashboard/transferencias',
      buttonText: 'Ver mercado'
    },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar user={user!} profile={profile} team={team} />

      {/* Conteúdo Principal */}
      <div className="flex-1 transition-all duration-300 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-4 lg:p-6">
          <div className="mx-auto space-y-6 lg:space-y-8 max-w-7xl">
            {/* Header do conteúdo */}
            <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 pt-4 lg:pt-6">
              {team?.logo_url ? (
                <Image 
                  src={team.logo_url} 
                  alt={team.name} 
                  width={100} 
                  height={100} 
                  className="rounded-2xl lg:rounded-3xl border-4 lg:border-6 border-purple-600/30 shadow-xl lg:shadow-2xl object-cover" 
                />
              ) : (
                <Avatar className="h-24 w-24 lg:h-32 lg:w-32 border-4 lg:border-6 border-purple-600/30">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-3xl lg:text-5xl font-black">
                    {displayName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="text-center md:text-left">
                <h2 className="text-2xl lg:text-4xl font-black text-white">{displayName}</h2>
                <p className="mt-1 lg:mt-2 text-lg lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {team?.name || 'Sem time ainda'}
                </p>
                {isAdmin && (
                  <p className="mt-1 lg:mt-2 text-xs lg:text-sm font-medium text-yellow-500 flex items-center justify-center md:justify-start gap-1 lg:gap-2">
                    <Crown className="h-3 w-3 lg:h-4 lg:w-4" /> ADMINISTRADOR <Crown className="h-3 w-3 lg:h-4 lg:w-4" />
                  </p>
                )}
              </div>
            </div>

            {/* Grid de Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {tiles.map((tile) => (
                <Card
                  key={tile.title}
                  className={`group relative overflow-hidden rounded-xl lg:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg lg:shadow-xl transition-all duration-700 cursor-pointer ${
                    expandedTile === tile.title
                      ? 'row-span-2 lg:col-span-2 scale-105 shadow-2xl z-10'
                      : 'hover:scale-105 hover:shadow-purple-600/40'
                  }`}
                  onClick={() => setExpandedTile(expandedTile === tile.title ? null : tile.title)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <CardHeader className="pb-2 lg:pb-3 relative z-10">
                    <CardTitle className="text-base lg:text-lg font-bold text-white flex items-center justify-between">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <tile.icon className={`h-6 w-6 lg:h-8 lg:w-8 text-${tile.color}-400 drop-shadow-lg`} />
                        <span className="truncate">{tile.title}</span>
                      </div>
                      {expandedTile === tile.title ? <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="relative z-10 space-y-3 lg:space-y-4">
                    <div className="transition-all duration-700">
                      <p className={`font-black text-white break-words ${expandedTile === tile.title ? 'text-2xl lg:text-4xl' : 'text-xl lg:text-3xl'}`}>
                        {tile.value}
                      </p>
                      <p className={`font-medium text-${tile.color}-400 ${expandedTile === tile.title ? 'text-sm lg:text-base mt-2 lg:mt-3' : 'text-xs lg:text-sm'}`}>
                        {tile.subtitle}
                      </p>
                    </div>

                    {expandedTile === tile.title && (
                      <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
                        <div className="p-3 lg:p-4 bg-white/5 rounded-lg lg:rounded-xl border border-white/10 text-center">
                          <p className="text-zinc-400 italic text-xs lg:text-sm">Em breve: dados reais aqui</p>
                        </div>
                      </div>
                    )}

                    <Link href={tile.link} onClick={(e) => e.stopPropagation()} className="block mt-3 lg:mt-4">
                      <Button className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/20 hover:to-white/30 border border-white/20 text-white font-bold text-xs lg:text-sm py-2 lg:py-3 h-auto min-h-0">
                        <span className="truncate">{tile.buttonText}</span>
                        <ArrowRight className="ml-1 lg:ml-2 h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Components */}
        {user && team && (
          <>
            <FloatingChatButton 
              currentUser={chatUser}
              currentTeam={chatTeam}
              unreadCount={unreadCount}
              onOpenChat={() => setIsChatOpen(true)}
            />
            
            <ChatPopup
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              currentUser={chatUser}
              currentTeam={chatTeam}
            />
          </>
        )}
      </div>
    </div>
  )
}