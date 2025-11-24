// src/components/Header.tsx
'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'

export default function Header({ user }: { user: any }) {
  return (
    <header className="border-b border-white/10 backdrop-blur bg-zinc-950/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Campeonato dos Crias 2025
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-zinc-400">Logado como</p>
            <p className="font-semibold">{user?.user_metadata.full_name || user?.email}</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
              {user?.user_metadata.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => supabase.auth.signOut()}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}