// components/FloatingChatButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FloatingChatButtonProps {
  currentUser: {
    id: string
    email: string
  }
}

export default function FloatingChatButton({ currentUser }: FloatingChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (currentUser?.id) {
      loadUnreadCount()
      // Configurar subscription para atualizar em tempo real
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
    }
  }, [currentUser])

  const loadUnreadCount = async () => {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)

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
        .neq('sender_id', currentUser.id)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Erro ao carregar contagem de mensagens:', error)
    }
  }

  const handleOpenMessages = () => {
    router.push('/dashboard/mensagens')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleOpenMessages}
        className="rounded-full w-14 h-14 shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 bg-green-500 hover:bg-green-600 border-green-400 shadow-green-500/25"
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