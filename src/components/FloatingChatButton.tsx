// components/FloatingChatButton.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'

interface FloatingChatButtonProps {
  currentUser: {
    id: string
    email: string
  }
  currentTeam: {
    id: string
    name: string
    logo_url?: string
  }
  unreadCount: number
  onOpenChat: () => void
}

export default function FloatingChatButton({ currentUser, currentTeam, unreadCount, onOpenChat }: FloatingChatButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={onOpenChat}
        className="rounded-full w-14 h-14 shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-purple-400 shadow-purple-500/25"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
            {unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}