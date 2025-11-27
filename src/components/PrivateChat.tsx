// components/PrivateChat.tsx - DESIGN MODERNO E CORRIGIDO
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageCircle, X, Users, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
}

interface PrivateChatProps {
  currentUser: {
    id: string
    email: string
  }
  currentTeam: {
    id: string
    name: string
    logo_url?: string
  }
}

export default function PrivateChat({ currentUser, currentTeam }: PrivateChatProps) {
  const [coaches, setCoaches] = useState<Profile[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedCoach, setSelectedCoach] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeConversation, setActiveConversation] = useState<string | null>(null)

  // Carregar dados quando abrir
  useEffect(() => {
    if (isOpen) {
      loadCoaches()
      loadConversations()
    }
  }, [isOpen])

  // Carregar mensagens quando selecionar um treinador
  useEffect(() => {
    if (selectedCoach && isOpen) {
      loadMessages(selectedCoach.id)
    }
  }, [selectedCoach, isOpen])

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
        .neq('id', currentUser.id)
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
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false })

      if (convsError) throw convsError

      const conversationsWithUsers = await Promise.all(
        (convsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id
          
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

          // Buscar contagem de mensagens não lidas
          const { count: unreadCount } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', currentUser.id)

          return {
            ...conv,
            other_user: userData,
            unread_count: unreadCount || 0
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
        .neq('sender_id', currentUser.id)

      // Recarregar conversas para atualizar contagem
      loadConversations()

      // Configurar subscription
      setupMessageSubscription(conversationId)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const findOrCreateConversation = async (otherUserId: string): Promise<string> => {
    // Buscar conversa existente
    const { data: existingConvs, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)

    if (error) throw error

    const existingConv = existingConvs?.find(conv => 
      (conv.user1_id === currentUser.id && conv.user2_id === otherUserId) ||
      (conv.user1_id === otherUserId && conv.user2_id === currentUser.id)
    )

    if (existingConv) return existingConv.id

    // Criar nova conversa
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: currentUser.id,
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
          loadConversations() // Atualizar contagem de não lidas
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
          sender_id: currentUser.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      
      // Atualizar updated_at da conversa
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const filteredCoaches = coaches.filter(coach =>
    coach.coach_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDisplayName = (profile: Profile) => {
    return profile.coach_name || profile.full_name || profile.email?.split('@')[0] || 'Treinador'
  }

  // Agrupar mensagens por data
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, PrivateMessage[]>)

  return (
    <>
      {/* Botão flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-full w-14 h-14 shadow-2xl transition-all duration-300 transform hover:scale-110",
            isOpen 
              ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25" 
              : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-blue-500/25"
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6" />
              {conversations.some(conv => conv.unread_count > 0) && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center">
                  {conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0)}
                </Badge>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Modal do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] flex">
          <Card className="flex flex-1 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border-zinc-700 shadow-2xl overflow-hidden">
            {/* Lista de Treinadores */}
            <div className={cn(
              "flex flex-col w-full md:w-80 border-r border-zinc-700 transition-all duration-300 bg-zinc-900/50 backdrop-blur-sm",
              selectedCoach ? "hidden md:flex" : "flex"
            )}>
              {/* Header */}
              <div className="p-4 border-b border-zinc-700 bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    Mensagens
                  </h3>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {coaches.length} treinadores
                  </Badge>
                </div>
                <div className="mt-3 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Buscar treinador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Lista */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {/* Conversas recentes */}
                  {conversations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider px-3 py-2">
                        Conversas Recentes
                      </p>
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedCoach(conversation.other_user)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group hover:bg-zinc-800/50 border border-transparent hover:border-zinc-600",
                            selectedCoach?.id === conversation.other_user.id && "bg-blue-500/10 border-blue-500/20"
                          )}
                        >
                          <div className="relative">
                            {conversation.other_user.teams?.logo_url ? (
                              <Image 
                                src={conversation.other_user.teams.logo_url}
                                alt={conversation.other_user.teams.name}
                                width={44}
                                height={44}
                                className="rounded-full border-2 border-zinc-600 group-hover:border-zinc-400 transition-colors"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center border-2 border-zinc-600 group-hover:border-zinc-400 transition-colors">
                                <Users className="w-5 h-5 text-zinc-400" />
                              </div>
                            )}
                            {conversation.unread_count > 0 && (
                              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 text-xs min-w-[20px] h-[20px] flex items-center justify-center border-2 border-zinc-900">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-white font-semibold text-sm truncate">
                                {getDisplayName(conversation.other_user)}
                              </p>
                              <Clock className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                            </div>
                            <p className="text-zinc-400 text-xs truncate">
                              {conversation.other_user.teams?.name || 'Sem time'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Todos os treinadores */}
                  <div>
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider px-3 py-2">
                      Todos os Treinadores
                    </p>
                    {filteredCoaches.map((coach) => (
                      <div
                        key={coach.id}
                        onClick={() => setSelectedCoach(coach)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group hover:bg-zinc-800/50 border border-transparent hover:border-zinc-600 mb-1",
                          selectedCoach?.id === coach.id && "bg-blue-500/10 border-blue-500/20"
                        )}
                      >
                        {coach.teams?.logo_url ? (
                          <Image 
                            src={coach.teams.logo_url}
                            alt={coach.teams.name}
                            width={44}
                            height={44}
                            className="rounded-full border-2 border-zinc-600 group-hover:border-zinc-400 transition-colors"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center border-2 border-zinc-600 group-hover:border-zinc-400 transition-colors">
                            <Users className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {getDisplayName(coach)}
                          </p>
                          <p className="text-zinc-400 text-xs truncate">
                            {coach.teams?.name || 'Sem time'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Área de Chat */}
            <div className={cn(
              "flex flex-col flex-1 transition-all duration-300 bg-gradient-to-b from-zinc-900 to-zinc-800",
              selectedCoach ? "flex" : "hidden md:flex"
            )}>
              {selectedCoach ? (
                <>
                  {/* Header do Chat */}
                  <div className="flex items-center gap-3 p-4 border-b border-zinc-700 bg-zinc-800/50 backdrop-blur-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCoach(null)}
                      className="md:hidden text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      {selectedCoach.teams?.logo_url ? (
                        <Image 
                          src={selectedCoach.teams.logo_url}
                          alt={selectedCoach.teams.name}
                          width={44}
                          height={44}
                          className="rounded-full border-2 border-blue-500/30"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-blue-500/30">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-lg">
                        {getDisplayName(selectedCoach)}
                      </p>
                      <p className="text-blue-400 text-sm font-medium">
                        {selectedCoach.teams?.name || 'Sem time'}
                      </p>
                    </div>
                  </div>

                  {/* Área de Mensagens */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                          {/* Divider com data */}
                          <div className="flex items-center justify-center my-6">
                            <div className="bg-zinc-700/50 px-3 py-1 rounded-full">
                              <span className="text-xs text-zinc-400 font-medium">{date}</span>
                            </div>
                          </div>
                          
                          {/* Mensagens do dia */}
                          {dateMessages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex flex-col max-w-[85%] transition-all duration-200",
                                message.sender_id === currentUser.id
                                  ? "ml-auto" 
                                  : "mr-auto"
                              )}
                            >
                              <div className={cn(
                                "p-3 rounded-2xl shadow-lg border backdrop-blur-sm",
                                message.sender_id === currentUser.id
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400/30 rounded-br-md"
                                  : "bg-zinc-800/80 text-white border-zinc-600/30 rounded-bl-md"
                              )}>
                                <p className="text-sm leading-relaxed break-words">
                                  {message.message}
                                </p>
                                <div className={cn(
                                  "flex items-center gap-1 mt-2 text-xs",
                                  message.sender_id === currentUser.id 
                                    ? "text-blue-100/70 justify-end" 
                                    : "text-zinc-400"
                                )}>
                                  <Clock className="w-3 h-3" />
                                  {formatTime(message.created_at)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-zinc-700 bg-zinc-800/30 backdrop-blur-sm">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1 bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-blue-500/50 transition-colors"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={isLoading || !newMessage.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        size="sm"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-zinc-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">Selecione um treinador</p>
                    <p className="text-sm">Escolha um treinador para iniciar uma conversa</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}