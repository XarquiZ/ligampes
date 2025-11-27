// components/PrivateChat.tsx - DESIGN ESTILO FACEBOOK/WHATSAPP
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageCircle, X, Users, Search, ArrowLeft, MoreVertical } from 'lucide-react'
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
  last_message?: PrivateMessage
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
  const [view, setView] = useState<'list' | 'chat'>('list') // 'list' ou 'chat'

  // Carregar dados quando abrir
  useEffect(() => {
    if (isOpen) {
      loadCoaches()
      loadConversations()
      setView('list')
      setSelectedCoach(null)
    }
  }, [isOpen])

  // Quando fechar, resetar tudo
  useEffect(() => {
    if (!isOpen) {
      setSelectedCoach(null)
      setView('list')
      setMessages([])
    }
  }, [isOpen])

  // Carregar mensagens quando selecionar um treinador
  useEffect(() => {
    if (selectedCoach && isOpen) {
      setView('chat')
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

          // Buscar última mensagem
          const { data: lastMessage } = await supabase
            .from('private_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
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

  const handleBackToList = () => {
    setView('list')
    setSelectedCoach(null)
    setMessages([])
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

  return (
    <>
      {/* Botão flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-full w-14 h-14 shadow-2xl transition-all duration-300 transform hover:scale-110 border-2",
            isOpen 
              ? "bg-red-500 hover:bg-red-600 border-red-400 shadow-red-500/25" 
              : "bg-green-500 hover:bg-green-600 border-green-400 shadow-green-500/25"
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6" />
              {conversations.some(conv => conv.unread_count > 0) && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
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
          <Card className="flex flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-2xl overflow-hidden">
            
            {/* LISTA DE CONVERSAS (View = 'list') */}
            {view === 'list' && (
              <div className="flex flex-col w-full h-full">
                {/* Header da Lista */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      Mensagens
                    </h3>
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {coaches.length} online
                    </Badge>
                  </div>
                  
                  {/* Barra de Pesquisa */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar treinadores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-50 dark:bg-zinc-700 border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                {/* Lista de Conversas */}
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {/* Conversas Recentes */}
                    {conversations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400 px-3 py-2">
                          Conversas
                        </p>
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            onClick={() => setSelectedCoach(conversation.other_user)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50",
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
                      </div>
                    )}

                    {/* Todos os Treinadores */}
                    <div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400 px-3 py-2">
                        Todos os Treinadores
                      </p>
                      {filteredCoaches.map((coach) => (
                        <div
                          key={coach.id}
                          onClick={() => setSelectedCoach(coach)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50 mb-1",
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
              </div>
            )}

            {/* CHAT INDIVIDUAL (View = 'chat') */}
            {view === 'chat' && selectedCoach && (
              <div className="flex flex-col w-full h-full">
                {/* Header do Chat */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
                  </Button>
                  
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
                  
                  <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700">
                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
                  </Button>
                </div>

                {/* Área de Mensagens */}
                <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-zinc-800/30">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          message.sender_id === currentUser.id
                            ? "ml-auto" 
                            : "mr-auto"
                        )}
                      >
                        <div className={cn(
                          "p-3 rounded-2xl",
                          message.sender_id === currentUser.id
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-zinc-600"
                        )}>
                          <p className="text-sm leading-relaxed break-words">
                            {message.message}
                          </p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            message.sender_id === currentUser.id 
                              ? "text-blue-100 justify-end" 
                              : "text-gray-500 dark:text-zinc-400"
                          )}>
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input de Mensagem */}
                <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1 bg-gray-50 dark:bg-zinc-700 border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !newMessage.trim()}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 transition-all duration-200 disabled:opacity-50"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}