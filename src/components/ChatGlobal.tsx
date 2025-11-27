// components/ChatGlobal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageCircle, X, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Interfaces atualizadas
interface Team {
  id: string
  name: string
  logo_url?: string
}

interface Profile {
  id: string
  full_name: string | null
  coach_name: string | null
  email: string | null
  team_id: string | null
  teams: Team | null
}

interface ChatMessage {
  id: string
  user_id: string
  team_id: string
  message: string
  created_at: string
  profiles: Profile | null
}

interface ChatGlobalProps {
    team: {
      id: string
      name: string
      logo_url?: string
    } | null  // Adicione | null aqui
    user: {
      id: string
      email: string
    } | null  // Adicione | null aqui
  }

export default function ChatGlobal({ team, user }: ChatGlobalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Carregar mensagens iniciais
  useEffect(() => {
    if (isOpen) {
      loadInitialMessages()
    }
  }, [isOpen])

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!isOpen) return

    const subscription = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          try {
            // Buscar informações completas do usuário
            const { data: userData, error } = await supabase
              .from('profiles')
              .select(`
                id,
                full_name,
                coach_name,
                email,
                team_id,
                teams (
                  id,
                  name,
                  logo_url
                )
              `)
              .eq('id', payload.new.user_id)
              .single()

            if (error) {
              console.error('Erro ao buscar perfil:', error)
              return
            }

            const completeMessage: ChatMessage = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              team_id: payload.new.team_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              profiles: userData
            }

            setMessages(prev => [completeMessage, ...prev])
            scrollToBottom()
          } catch (error) {
            console.error('Erro ao processar nova mensagem:', error)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isOpen])

  const loadInitialMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          team_id,
          message,
          created_at,
          profiles (
            id,
            full_name,
            coach_name,
            email,
            team_id,
            teams (
              id,
              name,
              logo_url
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Garantir que os dados tenham o formato correto
      const formattedMessages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        team_id: msg.team_id,
        message: msg.message,
        created_at: msg.created_at,
        profiles: msg.profiles
      }))
      
      setMessages(formattedMessages)
      scrollToBottom()
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
    }, 100)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !team) return

    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          team_id: team.id,
          message: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
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

  const getUserDisplayName = (message: ChatMessage) => {
    if (!message.profiles) return 'Usuário'
    
    return message.profiles.coach_name || 
           message.profiles.full_name || 
           message.profiles.email?.split('@')[0] || 
           'Usuário'
  }

  const getTeamName = (message: ChatMessage) => {
    return message.profiles?.teams?.name || 'Sem time'
  }

  const getTeamLogo = (message: ChatMessage) => {
    return message.profiles?.teams?.logo_url
  }

  const isUserMessage = (message: ChatMessage) => {
    return message.user_id === user?.id
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
        {!isOpen && messages.length > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 text-xs">
            {messages.length}
          </Badge>
        )}
      </div>

      {/* Modal do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-96 flex flex-col">
          <Card className="flex flex-col h-full bg-zinc-900 border-zinc-700 shadow-2xl">
            {/* Header do Chat */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800/50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">Chat Global</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Users className="w-3 h-3" />
                    <span>{onlineUsers.size} online</span>
                  </div>
                </div>
              </div>
              
              {team && (
                <div className="flex items-center gap-2">
                  {team.logo_url && (
                    <Image 
                      src={team.logo_url} 
                      alt={team.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  )}
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {team.name}
                  </Badge>
                </div>
              )}
            </div>

            {/* Área de Mensagens */}
            <ScrollArea 
              ref={scrollAreaRef}
              className="flex-1 p-4 space-y-3"
            >
              <div className="space-y-3">
                {[...messages].reverse().map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col p-3 rounded-lg max-w-[85%]",
                      isUserMessage(message)
                        ? "bg-blue-600/20 border border-blue-500/30 ml-auto"
                        : "bg-zinc-800/50 border border-zinc-700/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {/* Logo do time */}
                        {getTeamLogo(message) && (
                          <Image 
                            src={getTeamLogo(message)!}
                            alt={getTeamName(message)}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                        )}
                        
                        <span className={cn(
                          "text-sm font-medium",
                          isUserMessage(message)
                            ? "text-blue-400" 
                            : "text-green-400"
                        )}>
                          {getUserDisplayName(message)}
                        </span>
                        
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            isUserMessage(message)
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-zinc-700/50 text-zinc-300 border-zinc-600/50"
                          )}
                        >
                          {getTeamName(message)}
                        </Badge>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-white text-sm break-words">
                      {message.message}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input para nova mensagem */}
            <div className="p-4 border-t border-zinc-700 bg-zinc-800/30">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || !user}
                  className="flex-1 bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-400"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !newMessage.trim() || !user}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {!user && (
                <p className="text-xs text-yellow-400 mt-2 text-center">
                  Faça login para participar do chat
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}