// src/components/Sidebar.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import {
  DollarSign,
  Shirt,
  Calendar,
  LogOut,
  Crown,
  ArrowLeftRight,
  Users,
  ChevronRight,
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Trophy,
  ScrollText,
  Inbox
} from 'lucide-react'
import InboxModal from './inbox/InboxModal'
import { useInbox } from '@/hooks/useInbox'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
    }
  }
  profile: {
    coach_name?: string
    role?: string
  } | null
  team: {
    id: string
    name: string
    logo_url?: string
  } | null
  organizationId?: string
}

export default function Sidebar({ user, profile, team, organizationId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const site = params?.site as string // Get the dynamic site param

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null)

  // Inbox State
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const { announcements, unreadCount, markAsRead, votePoll } = useInbox(user, team, organizationId)

  // Dynamic Navigation Items based on site
  const navigationItems = useMemo(() => {
    const baseUrl = `/${site}/dashboard`
    return [
      {
        name: 'Inbox',
        href: '#inbox', // Special case
        icon: Inbox,
        color: 'text-orange-400'
      },
      {
        name: 'Dashboard',
        href: baseUrl,
        icon: Home,
        color: 'text-blue-400'
      },
      {
        name: 'Saldo',
        href: `${baseUrl}/saldo`,
        icon: DollarSign,
        color: 'text-green-400'
      },
      {
        name: 'Meu Elenco',
        href: `${baseUrl}/elenco`,
        icon: Shirt,
        color: 'text-blue-400'
      },
      {
        name: 'Jogadores',
        href: `${baseUrl}/jogadores`,
        icon: Users,
        color: 'text-pink-400'
      },
      {
        name: 'Transferências',
        href: `${baseUrl}/transferencias`,
        icon: ArrowLeftRight,
        color: 'text-purple-400'
      },
      {
        name: 'Leilão',
        href: `${baseUrl}/leilao`,
        icon: Calendar,
        color: 'text-red-400'
      },
      {
        name: 'Tabela',
        href: `${baseUrl}/tabela`,
        icon: Trophy,
        color: 'text-yellow-400'
      },
      {
        name: 'Informações',
        href: `${baseUrl}/informacoes`,
        icon: ScrollText,
        color: 'text-indigo-400'
      },
    ]
  }, [site])

  // Efeito para carregar o estado salvo do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebar-collapsed')
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState))
      } else {
        // Padrão: expandido em desktop, colapsado em mobile
        setIsCollapsed(window.innerWidth < 1024 ? true : false)
      }
    }
  }, [])

  // Efeito para salvar o estado no localStorage quando mudar
  useEffect(() => {
    if (isCollapsed !== null && typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed])

  // Ajustar estado baseado no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // Em mobile, sempre começa colapsado
        if (!isMobileOpen) {
          setIsCollapsed(true)
        }
      } else {
        // Em desktop, mantém o estado salvo
        const savedState = localStorage.getItem('sidebar-collapsed')
        if (savedState !== null) {
          setIsCollapsed(JSON.parse(savedState))
        }
      }
    }

    handleResize() // Executar no mount
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobileOpen])

  const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'
  const displayName = profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico'

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Hard redirect to ensure clean state and avoid middleware/cache issues
      window.location.href = `/${site}/login`
    } catch (error) {
      console.error('Erro no logout:', error)
      // Fallback
      router.push(`/${site}/login`)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen)
    // Quando abrir menu mobile, expande o sidebar
    if (!isMobileOpen && window.innerWidth < 1024) {
      setIsCollapsed(false)
    }
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    // No mobile, quando colapsar, fecha o menu
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false)
    }
  }

  const handleLogoClick = () => {
    router.push(`/${site}/dashboard`)
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false)
    }
  }

  // Mostra loading enquanto carrega o estado
  if (isCollapsed === null) {
    return (
      <>
        {/* Sidebar skeleton */}
        <div className="fixed top-0 left-0 h-screen bg-zinc-900 border-r border-white/10 w-16 z-40 animate-pulse" />
      </>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800/90 backdrop-blur-sm rounded-lg border border-zinc-700 text-white safe-top safe-left"
        aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => {
            setIsMobileOpen(false)
            if (window.innerWidth < 1024) {
              setIsCollapsed(true)
            }
          }}
        />
      )}

      {/* Sidebar - SEMPRE FIXO À ESQUERDA */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen bg-zinc-900 border-r border-white/10 z-40",
          "transform transition-all duration-300 ease-in-out",
          // Estado mobile
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Estado desktop - sempre visível
          "lg:translate-x-0",
          // Largura baseada no estado
          isCollapsed ? "w-16" : "w-64"
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: '100dvh'
        }}
      >
        <div className="flex flex-col h-full relative">
          {/* Header */}
          <div className="p-3 border-b border-white/10">
            <div
              className={cn(
                "flex items-center gap-3 mb-3 cursor-pointer",
                isCollapsed ? "justify-center" : ""
              )}
              onClick={handleLogoClick}
            >
              {team?.logo_url ? (
                <div className={cn(
                  "relative rounded-full border-2 border-purple-500 overflow-hidden hover:border-purple-400 transition-colors",
                  isCollapsed ? "w-8 h-8" : "w-12 h-12"
                )}>
                  <Image
                    src={team.logo_url}
                    alt={team.name}
                    fill
                    className="object-cover"
                    sizes={isCollapsed ? "32px" : "48px"}
                  />
                </div>
              ) : (
                <Avatar className={cn(
                  "cursor-pointer border-2 border-purple-500 hover:border-purple-400 transition-colors",
                  isCollapsed ? "h-8 w-8" : "h-12 w-12"
                )}>
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 font-bold hover:from-purple-500 hover:to-pink-500 transition-colors">
                    {displayName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate hover:text-purple-300 transition-colors">
                    {displayName}
                    {isAdmin && <Crown className="h-3 w-3 text-yellow-500 inline ml-1" />}
                  </h2>
                  <p className="text-xs text-zinc-400 truncate">
                    {team?.name || 'Sem time'}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <h1
                className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-xl font-black text-transparent cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleLogoClick}
              >
                LIGA MPES
              </h1>
            )}
          </div>

          {/* Botão de expansão/colapsar - MOLDURA MENOR, SETA MESMO TAMANHO */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "absolute z-50",
              "bg-zinc-800/90 border border-white/10 rounded-full",
              "text-white hover:bg-zinc-700/90 hover:border-zinc-500",
              "transition-all duration-200",
              "shadow-md hover:shadow-lg",
              "flex items-center justify-center",
              // Posicionamento
              "top-10",
              "right-0 translate-x-1/2",
              // Tamanho da MOLDURA menor (era w-6 h-6, agora w-5 h-5)
              "w-5 h-5",
              // Padding interno para a seta
              "p-0.5",
              // Esconde em mobile quando sidebar fechado
              isMobileOpen ? "opacity-100" : "lg:opacity-100 opacity-0",
              // Garante que fique acima de tudo
              "z-[60]"
            )}
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
            )}
          </button>

          {/* Navigation com um pouco mais de espaço no topo */}
          <nav className="flex-1 p-2 pt-3 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (pathname.startsWith(item.href) && item.href !== '/dashboard')

              return (
                <Link
                  key={item.name + item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (item.name === 'Inbox') {
                      e.preventDefault()
                      setIsInboxOpen(true)
                    }
                    if (window.innerWidth < 1024) {
                      setIsMobileOpen(false)
                      setIsCollapsed(true)
                    }
                  }}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200 group relative",
                    "hover:bg-white/5 hover:text-white",
                    isActive
                      ? 'bg-white/10 text-white shadow-md'
                      : 'text-zinc-400',
                    isCollapsed ? 'justify-center p-2' : 'p-3 gap-3'
                  )}
                  title={isCollapsed ? item.name : ''}
                >
                  <div className="relative">
                    <Icon className={cn(
                      "flex-shrink-0",
                      isCollapsed ? 'h-5 w-5' : 'h-5 w-5',
                      item.color
                    )} />
                    {item.name === 'Inbox' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm flex-1 truncate">{item.name}</span>
                      <ChevronRight className={cn(
                        "h-3 w-3 flex-shrink-0 transition-transform duration-200",
                        isActive
                          ? 'translate-x-0 opacity-100'
                          : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      )} />
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-2 border-t border-white/10">
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className={cn(
                "w-full text-red-400 hover:text-red-300 hover:bg-red-400/10",
                "transition-colors duration-200",
                isCollapsed ? 'justify-center p-2' : 'justify-start p-3 gap-2'
              )}
              title={isCollapsed ? 'Sair' : ''}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm truncate">Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer para conteúdo principal */}
      <div
        className={cn(
          "hidden lg:block transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      />

      {/* Inbox Modal */}
      {/* Inbox Modal - Force Read Logic */}
      <InboxModal
        isOpen={isInboxOpen || announcements.some(a => a.priority && !a.read)}
        onClose={() => setIsInboxOpen(false)}
        announcements={announcements}
        onMarkAsRead={markAsRead}
        onVote={votePoll}
        preventClose={announcements.some(a => a.priority && !a.read)}
      />
    </>
  )
}