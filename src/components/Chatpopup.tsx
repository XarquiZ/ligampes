// components/ChatPopup.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, X, Users, MessageCircle, Search, Crown } from 'lucide-react'
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

interface ChatPopupProps {
  isOpen: boolean
  onClose: () => void
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

export default function ChatPopup({ isOpen, onClose, currentUser, currentTeam }: ChatPopupProps) {
  const [coaches, setCoaches] = useState<Profile[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedCoach, setSelectedCoach] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'conversas' | 'treinadores'>('conversas')
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
      // Buscar conversas de forma mais simples
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

          // Buscar última mensagem de forma mais simples
          const { data: lastMessageData } = await supabase
            .from('private_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const lastMessage = lastMessageData?.[0]

          // Buscar contagem de não lidas
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

      // Buscar mensagens de forma mais simples
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Marcar como lidas
      await supabase
        .from('private_messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id)

      loadConversations()
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const findOrCreateConversation = async (otherUserId: string): Promise<string> => {
    // Buscar de forma mais simples
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

    // Criar nova
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
    
    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins} min`
    
    return date.toLocaleDateString('pt-BR')
  }

  const filteredCoaches = coaches.filter(coach =>
    coach.coach_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.coach_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDisplayName = (profile: Profile) => {
    return profile.coach_name || profile.full_name || profile.email?.split('@')[0] || 'Treinador'
  }

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return 'Iniciar conversa'
    
    const message = conversation.last_message.message
    return message.length > 25 ? message.substring(0, 25) + '...' : message
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] h-[90vh] max-w-6xl">
        <Card className="w-full h-full bg-gradient-to-br from-zinc-900 via-purple-900/20 to-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900/80 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-purple-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Mensagens</h2>
                  <p className="text-sm text-zinc-400">
                    {activeTab === 'conversas' ? `${conversations.length} conversas` : `${coaches.length} treinadores`}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex h-[calc(100%-80px)]">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/10 bg-zinc-900/50 backdrop-blur-sm">
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="p-4">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1">
                  <TabsTrigger 
                    value="conversas" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                  >
                    Conversas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="treinadores"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                  >
                    Treinadores
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="conversas" className="mt-4 space-y-2">
                  <ScrollArea className="h-[500px]">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedCoach(conversation.other_user)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                          selectedCoach?.id === conversation.other_user?.id 
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30" 
                            : "hover:bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="relative">
                          {conversation.other_user?.teams?.logo_url ? (
                            <Image 
                              src={conversation.other_user.teams.logo_url}
                              alt={conversation.other_user.teams.name}
                              width={44}
                              height={44}
                              className="rounded-full border-2 border-purple-500/50"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-2 border-purple-500/50">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-semibold text-sm truncate">
                              {getDisplayName(conversation.other_user!)}
                            </p>
                            {conversation.last_message && (
                              <span className="text-xs text-zinc-400">
                                {formatMessageTime(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-zinc-300 text-sm truncate">
                              {getLastMessagePreview(conversation)}
                            </p>
                            {conversation.unread_count > 0 && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-zinc-400 text-xs truncate">
                            {conversation.other_user?.teams?.name || 'Sem time'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="treinadores" className="mt-4 space-y-2">
                  <ScrollArea className="h-[500px]">
                    {filteredCoaches.map((coach) => (
                      <div
                        key={coach.id}
                        onClick={() => setSelectedCoach(coach)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                          selectedCoach?.id === coach.id 
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30" 
                            : "hover:bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="relative">
                          {coach.teams?.logo_url ? (
                            <Image 
                              src={coach.teams.logo_url}
                              alt={coach.teams.name}
                              width={44}
                              height={44}
                              className="rounded-full border-2 border-purple-500/50"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-2 border-purple-500/50">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">
                            {getDisplayName(coach)}
                          </p>
                          <p className="text-zinc-300 text-sm">
                            {coach.teams?.name || 'Sem time'}
                          </p>
                          <p className="text-green-400 text-xs font-medium">
                            • Online
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Área do Chat */}
            <div className="flex-1 flex flex-col">
              {selectedCoach ? (
                <>
                  {/* Header do Chat */}
                  <div className="flex items-center gap-3 p-6 border-b border-white/10 bg-zinc-900/80 backdrop-blur-xl">
                    <div className="relative">
                      {selectedCoach.teams?.logo_url ? (
                        <Image 
                          src={selectedCoach.teams.logo_url}
                          alt={selectedCoach.teams.name}
                          width={52}
                          height={52}
                          className="rounded-full border-2 border-purple-500/50"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-2 border-purple-500/50">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xl">
                        {getDisplayName(selectedCoach)}
                      </p>
                      <p className="text-purple-400 text-sm font-medium">
                        {selectedCoach.teams?.name || 'Sem time'} • Online
                      </p>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex flex-col max-w-[70%]",
                            message.sender_id === currentUser.id
                              ? "ml-auto" 
                              : "mr-auto"
                          )}
                        >
                          <div className={cn(
                            "p-4 rounded-2xl backdrop-blur-sm border",
                            message.sender_id === currentUser.id
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400/30 rounded-br-md"
                              : "bg-white/5 text-white border-white/10 rounded-bl-md"
                          )}>
                            <p className="text-sm leading-relaxed break-words">
                              {message.message}
                            </p>
                            <div className={cn(
                              "flex items-center gap-1 mt-2 text-xs",
                              message.sender_id === currentUser.id 
                                ? "text-purple-100 justify-end" 
                                : "text-zinc-400"
                            )}>
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-6 border-t border-white/10 bg-zinc-900/80 backdrop-blur-xl">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-zinc-400 focus:border-purple-500/50"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={isLoading || !newMessage.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 transition-all duration-200 disabled:opacity-50"
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
                    <p className="text-lg font-semibold mb-2">Selecione uma conversa</p>
                    <p className="text-sm">Escolha um treinador para iniciar uma conversa</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}