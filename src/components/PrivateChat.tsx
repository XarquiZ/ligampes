// components/PrivateChat.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageCircle, X, Users, Search } from 'lucide-react'
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Carregar treinadores
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
      setupMessageSubscription(selectedCoach.id)
    }
  }, [selectedCoach, isOpen])

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
        .neq('id', currentUser.id) // Excluir o usuário atual
        .order('coach_name')

      if (error) throw error
      setCoaches(data || [])
    } catch (error) {
      console.error('Erro ao carregar treinadores:', error)
    }
  }

  const loadConversations = async () => {
    try {
      // Buscar conversas onde o usuário atual é user1 ou user2
      const { data: convsData, error: convsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false })

      if (convsError) throw convsError

      // Para cada conversa, buscar informações do outro usuário
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

          return {
            ...conv,
            other_user: userData,
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
      // Encontrar ou criar conversa
      let conversationId = await findOrCreateConversation(otherUserId)

      // Carregar mensagens
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
      scrollToBottom()
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const findOrCreateConversation = async (otherUserId: string): Promise<string> => {
    // Tentar encontrar conversa existente
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
      .single()

    if (existingConv) {
      return existingConv.id
    }

    // Criar nova conversa
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        user1_id: currentUser.id,
        user2_id: otherUserId
      })
      .select()
      .single()

    if (error) throw error
    return newConv.id
  }

  const setupMessageSubscription = (otherUserId: string) => {
    const subscription = supabase
      .channel('private_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        async (payload) => {
          // Verificar se a mensagem é para a conversa atual
          const conversationId = await findOrCreateConversation(otherUserId)
          if (payload.new.conversation_id === conversationId) {
            setMessages(prev => [...prev, payload.new as PrivateMessage])
            scrollToBottom()
            loadConversations() // Atualizar lista de conversas
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCoach) return

    setIsLoading(true)
    
    try {
      const conversationId = await findOrCreateConversation(selectedCoach.id)

      const { error } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      
      // Atualizar updated_at da conversa
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
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

  const filteredCoaches = coaches.filter(coach =>
    coach.coach_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.teams?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDisplayName = (profile: Profile) => {
    return profile.coach_name || profile.full_name || profile.email?.split('@')[0] || 'Treinador'
  }

  return (
    <>
      {/* Botão flutuante para abrir/fechar o chat */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-full w-14 h-14 shadow-lg transition-all duration-300",
            isOpen 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
        
        {/* Badge de notificação */}
        {!isOpen && conversations.some(conv => 
          conv.last_message && 
          !conv.last_message.read && 
          conv.last_message.sender_id !== currentUser.id
        ) && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 text-xs">
            {conversations.filter(conv => 
              conv.last_message && 
              !conv.last_message.read && 
              conv.last_message.sender_id !== currentUser.id
            ).length}
          </Badge>
        )}
      </div>

      {/* Modal do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] flex">
          <Card className="flex flex-1 bg-zinc-900 border-zinc-700 shadow-2xl">
            {/* Lista de Treinadores */}
            <div className={cn(
              "flex flex-col w-full md:w-1/3 border-r border-zinc-700 transition-all duration-300",
              selectedCoach ? "hidden md:flex" : "flex"
            )}>
              <div className="p-4 border-b border-zinc-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Treinadores
                </h3>
                <div className="mt-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Buscar treinador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-600 text-white text-sm"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2">
                  {/* Conversas recentes */}
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedCoach(conversation.other_user)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors",
                        selectedCoach?.id === conversation.other_user.id && "bg-zinc-800"
                      )}
                    >
                      {conversation.other_user.teams?.logo_url ? (
                        <Image 
                          src={conversation.other_user.teams.logo_url}
                          alt={conversation.other_user.teams.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                          <Users className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {getDisplayName(conversation.other_user)}
                        </p>
                        <p className="text-zinc-400 text-xs truncate">
                          {conversation.other_user.teams?.name || 'Sem time'}
                        </p>
                        {conversation.last_message && (
                          <p className="text-zinc-500 text-xs truncate mt-1">
                            {conversation.last_message.message}
                          </p>
                        )}
                      </div>
                      {conversation.last_message && 
                       !conversation.last_message.read && 
                       conversation.last_message.sender_id !== currentUser.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}

                  {/* Todos os treinadores */}
                  {filteredCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      onClick={() => setSelectedCoach(coach)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors",
                        selectedCoach?.id === coach.id && "bg-zinc-800"
                      )}
                    >
                      {coach.teams?.logo_url ? (
                        <Image 
                          src={coach.teams.logo_url}
                          alt={coach.teams.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                          <Users className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {getDisplayName(coach)}
                        </p>
                        <p className="text-zinc-400 text-xs truncate">
                          {coach.teams?.name || 'Sem time'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Área de Chat */}
            <div className={cn(
              "flex flex-col flex-1 transition-all duration-300",
              selectedCoach ? "flex" : "hidden md:flex"
            )}>
              {selectedCoach ? (
                <>
                  {/* Header do Chat */}
                  <div className="flex items-center gap-3 p-4 border-b border-zinc-700 bg-zinc-800/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCoach(null)}
                      className="md:hidden text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {selectedCoach.teams?.logo_url && (
                      <Image 
                        src={selectedCoach.teams.logo_url}
                        alt={selectedCoach.teams.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {getDisplayName(selectedCoach)}
                      </p>
                      <p className="text-zinc-400 text-sm">
                        {selectedCoach.teams?.name || 'Sem time'}
                      </p>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex flex-col p-3 rounded-lg max-w-[85%]",
                            message.sender_id === currentUser.id
                              ? "bg-blue-600/20 border border-blue-500/30 ml-auto"
                              : "bg-zinc-800/50 border border-zinc-700/50"
                          )}
                        >
                          <p className="text-white text-sm break-words">
                            {message.message}
                          </p>
                          <span className="text-xs text-zinc-500 mt-1 self-end">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-zinc-700">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1 bg-zinc-800 border-zinc-600 text-white"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={isLoading || !newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione um treinador para conversar</p>
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