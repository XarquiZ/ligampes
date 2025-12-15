// src/components/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

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
}

const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    color: 'text-blue-400'
  },
  { 
    name: 'Saldo', 
    href: '/dashboard/saldo', 
    icon: DollarSign, 
    color: 'text-green-400' 
  },
  { 
    name: 'Meu Elenco', 
    href: '/dashboard/elenco', 
    icon: Shirt, 
    color: 'text-blue-400' 
  },
  { 
    name: 'Jogadores', 
    href: '/dashboard/jogadores', 
    icon: Users, 
    color: 'text-pink-400' 
  },
  { 
    name: 'Transferências', 
    href: '/dashboard/transferencias', 
    icon: ArrowLeftRight, 
    color: 'text-purple-400' 
  },
  { 
    name: 'Leilão', 
    href: '/dashboard/leilao', 
    icon: Calendar, 
    color: 'text-red-400' 
  },
  { 
    name: 'Tabela', 
    href: '/dashboard/tabela', 
    icon: Trophy, 
    color: 'text-yellow-400' 
  },
]

export default function Sidebar({ user, profile, team }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null) // Inicia como null

  // Efeito para carregar o estado salvo do localStorage
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebar-collapsed')
      if (savedState !== null) {
        // Carrega o estado salvo
        setIsCollapsed(JSON.parse(savedState))
      } else {
        // Se não houver estado salvo, inicia como true (fechado)
        setIsCollapsed(true)
      }
    }
  }, [])

  // Efeito para salvar o estado no localStorage quando mudar
  useEffect(() => {
    if (isCollapsed !== null && typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
      console.log('Sidebar state saved:', isCollapsed) // Para debug
    }
  }, [isCollapsed])

  const isAdmin = user?.email === 'wellinton.sbatista@gmail.com'
  const displayName = profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico'

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleLogoClick = () => {
    router.push('/dashboard')
    setIsMobileOpen(false)
  }

  // Mostra loading enquanto carrega o estado
  if (isCollapsed === null) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-lg text-white"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Sidebar skeleton */}
        <div className="fixed lg:sticky top-0 left-0 h-screen bg-zinc-900 border-r border-white/10 w-16 z-40 animate-pulse" />
      </>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-lg text-white"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen bg-zinc-900 border-r border-white/10 
        transform transition-all duration-300 ease-in-out z-40
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 border-b border-white/10 relative">
            <div 
              className={`flex items-center gap-3 mb-3 cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
              onClick={handleLogoClick}
            >
              {team?.logo_url ? (
                <Image 
                  src={team.logo_url} 
                  alt={team.name} 
                  width={isCollapsed ? 32 : 48} 
                  height={isCollapsed ? 32 : 48} 
                  className="rounded-full border-2 border-purple-500 object-cover hover:border-purple-400 transition-colors" 
                />
              ) : (
                <Avatar className={`${isCollapsed ? 'h-8 w-8' : 'h-12 w-12'} cursor-pointer`}>
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
              <h1 className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-xl font-black text-transparent cursor-pointer" onClick={handleLogoClick}>
                LIGA MPES
              </h1>
            )}

            {/* Toggle Button */}
            <button
              onClick={toggleCollapse}
              className={`absolute -right-3 top-6 bg-zinc-800 border border-white/10 rounded-full p-1 text-white hover:bg-zinc-700 transition-colors ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (pathname.startsWith(item.href) && item.href !== '/dashboard')
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center rounded-lg transition-all duration-200 group
                    ${isActive 
                      ? 'bg-white/10 text-white shadow-md' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }
                    ${isCollapsed ? 'justify-center p-2' : 'p-3 gap-3'}
                  `}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className={`${isCollapsed ? 'h-5 w-5' : 'h-5 w-5'} ${item.color}`} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm flex-1">{item.name}</span>
                      <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${
                        isActive ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`} />
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
              className={`w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 ${
                isCollapsed ? 'justify-center p-2' : 'justify-start p-3'
              }`}
              title={isCollapsed ? 'Sair' : ''}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2 text-sm">Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsed Sidebar Overlay para acionar expand */}
      {isCollapsed && (
        <div 
          className="hidden lg:block fixed left-0 top-0 h-screen w-16 z-30 cursor-pointer"
          onClick={() => setIsCollapsed(false)}
        />
      )}
    </>
  )
}