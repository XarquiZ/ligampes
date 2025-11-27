// src/components/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  DollarSign, 
  Shirt, 
  Trophy, 
  Calendar, 
  LogOut, 
  Crown, 
  ArrowLeftRight, 
  Users, 
  ChevronRight,
  Home,
  Menu,
  X
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
    name: 'Leilão', 
    href: '/dashboard/leilao', 
    icon: Calendar, 
    color: 'text-red-400' 
  },
  { 
    name: 'Transferências', 
    href: '/dashboard/transferencias', 
    icon: ArrowLeftRight, 
    color: 'text-purple-400' 
  },
]

export default function Sidebar({ user, profile, team }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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
        fixed lg:sticky top-0 left-0 h-screen w-80 bg-zinc-900 border-r border-white/10 
        transform transition-transform duration-300 ease-in-out z-40
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-4 mb-6">
              {team?.logo_url ? (
                <Image 
                  src={team.logo_url} 
                  alt={team.name} 
                  width={60} 
                  height={60} 
                  className="rounded-full border-2 border-purple-500 object-cover" 
                />
              ) : (
                <Avatar className="h-15 w-15">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-lg font-bold">
                    {displayName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">
                  {displayName}
                  {isAdmin && <Crown className="h-4 w-4 text-yellow-500 inline ml-1" />}
                </h2>
                <p className="text-sm text-zinc-400 truncate">
                  {team?.name || 'Sem time'}
                </p>
              </div>
            </div>

            <h1 className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-2xl font-black text-transparent">
              LIGA MPES
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-white/10 text-white shadow-lg' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`h-6 w-6 ${item.color}`} />
                  <span className="font-semibold flex-1">{item.name}</span>
                  <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                    isActive ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  }`} />
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}