// src/app/dashboard/mensagens/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, ArrowLeft, Users, Search, MoreVertical, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import FloatingChatButton from '@/components/FloatingChatButton'

interface Profile {
  id: string
  full_name: string | null
  coach_name: string | null
  email: string | null
  team_id: string | null
  teams: {
    id: string
    name: string
    logo_url: string | null
  } | null
}

interface PrivateMessage {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  created_at: string
  read: boolean
}

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  other_user: Profile
  unread_count?: number
  last_message?: PrivateMessage
}

export default function MensagensPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [coaches, setCoaches] = useState<Profile[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedCoach, setSelectedCoach] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const messagesEndRef = useState<HTMLDivElement>(null)

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  // Carregar dados
  useEffect(() => {
    if (user) {
      loadCoaches()
      loadConversations()
    }
  }, [user])

  // Carregar mensagens quando selecionar um treinador
  useEffect(() => {
    if (selectedCoach && user) {
      loadMessages(selectedCoach.id)
    }
  }, [selectedCoach, user])

  // Scroll automático
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          coach_name,
          email,
          team_id,
          teams (id, name, logo_url)
        `)
        .neq('id', user.id)
        .order('coach_name')

      if (error) throw error
      setCoaches(data || [])
    } catch (error) {
      console.error('Erro ao carregar treinadores:', error)
    }
  }

  const loadConversations = async () => {
    try {
      const { data: convsData, error: convsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (convsError) throw convsError

      const conversationsWithUsers = await Promise.all(
        (convsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
          
          const { data: userData } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              coach_name,
              email,
              team_id,
              teams (id, name, logo_url)
            `)
            .eq('id', otherUserId)
            .single()

          const { data: lastMessage } = await supabase
            .from('private_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const { count: unreadCount } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', user.id)

          return {
            ...conv,
            other_user: userData,
            unread_count: unreadCount || 0,
            last_message: lastMessage
          }
        })
      )

      setConversations(conversationsWithUsers)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    }
  }

  const loadMessages = async (otherUserId: string) => {
    try {
      const conversationId = await findOrCreateConversation(otherUserId)
      setActiveConversation(conversationId)

      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Marcar mensagens como lidas
      await supabase
        .from('private_messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)

      loadConversations() // Atualizar contagem

      // Configurar subscription
      setupMessageSubscription(conversationId)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const findOrCreateConversation = async (otherUserId: string): Promise<string> => {
    const { data: existingConvs, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (error) throw error

    const existingConv = existingConvs?.find(conv => 
      (conv.user1_id === user.id && conv.user2_id === otherUserId) ||
      (conv.user1_id === otherUserId && conv.user2_id === user.id)
    )

    if (existingConv) return existingConv.id

    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user.id,
        user2_id: otherUserId
      })
      .select()
      .single()

    if (createError) throw createError
    return newConv.id
  }

  const setupMessageSubscription = (conversationId: string) => {
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as PrivateMessage])
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCoach || !activeConversation) return

    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: activeConversation,
          sender_id: user.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation)

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins} min`
    if (diffHours < 24) return `${diffHours} h`
    
    return date.toLocaleDateString('pt-BR')
  }

  const filteredCoaches = coaches.filter(coach =>
    coach.coach_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDisplayName = (profile: Profile) => {
    return profile.coach_name || profile.full_name || profile.email?.split('@')[0] || 'Treinador'
  }

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return 'Iniciar conversa'
    
    const message = conversation.last_message.message
    return message.length > 30 ? message.substring(0, 30) + '...' : message
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando mensagens...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mensagens</h1>
                <p className="text-gray-500 dark:text-zinc-400">
                  {conversations.length} conversas • {coaches.length} treinadores online
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          
          {/* Lista de Conversas */}
          <Card className="lg:col-span-1 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar treinadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="p-2">
                {/* Conversas */}
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedCoach(conversation.other_user)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-zinc-800",
                      selectedCoach?.id === conversation.other_user.id && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <div className="relative">
                      {conversation.other_user.teams?.logo_url ? (
                        <Image 
                          src={conversation.other_user.teams.logo_url}
                          alt={conversation.other_user.teams.name}
                          width={48}
                          height={48}
                          className="rounded-full border-2 border-gray-200 dark:border-zinc-600"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900 dark:text-white font-semibold text-sm">
                          {getDisplayName(conversation.other_user)}
                        </p>
                        {conversation.last_message && (
                          <span className="text-xs text-gray-500 dark:text-zinc-400">
                            {formatMessageTime(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600 dark:text-zinc-300 text-sm truncate">
                          {getLastMessagePreview(conversation)}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-500 dark:text-zinc-400 text-xs">
                        {conversation.other_user.teams?.name || 'Sem time'}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Todos os Treinadores */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400 px-3 py-2">
                    Todos os Treinadores
                  </p>
                  {filteredCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      onClick={() => setSelectedCoach(coach)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-zinc-800 mb-1",
                        selectedCoach?.id === coach.id && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <div className="relative">
                        {coach.teams?.logo_url ? (
                          <Image 
                            src={coach.teams.logo_url}
                            alt={coach.teams.name}
                            width={48}
                            height={48}
                            className="rounded-full border-2 border-gray-200 dark:border-zinc-600"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-semibold text-sm">
                          {getDisplayName(coach)}
                        </p>
                        <p className="text-gray-500 dark:text-zinc-400 text-xs">
                          {coach.teams?.name || 'Sem time'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Card>

          {/* Área do Chat */}
          <Card className="lg:col-span-3 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full flex flex-col">
            {selectedCoach ? (
              <>
                {/* Header do Chat */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-zinc-800">
                  <div className="relative">
                    {selectedCoach.teams?.logo_url ? (
                      <Image 
                        src={selectedCoach.teams.logo_url}
                        alt={selectedCoach.teams.name}
                        width={44}
                        height={44}
                        className="rounded-full border-2 border-gray-200 dark:border-zinc-600"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-bold text-lg">
                      {getDisplayName(selectedCoach)}
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      {selectedCoach.teams?.name || 'Sem time'} • Online
                    </p>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
                  </Button>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col max-w-[70%]",
                          message.sender_id === user.id
                            ? "ml-auto" 
                            : "mr-auto"
                        )}
                      >
                        <div className={cn(
                          "p-4 rounded-2xl",
                          message.sender_id === user.id
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-md"
                        )}>
                          <p className="text-sm leading-relaxed break-words">
                            {message.message}
                          </p>
                          <div className={cn(
                            "flex items-center gap-1 mt-2 text-xs",
                            message.sender_id === user.id 
                              ? "text-blue-100 justify-end" 
                              : "text-gray-500 dark:text-zinc-400"
                          )}>
                            <Clock className="w-3 h-3" />
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !newMessage.trim()}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 transition-all duration-200 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-zinc-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Selecione uma conversa</p>
                  <p className="text-sm">Escolha um treinador para iniciar uma conversa</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}