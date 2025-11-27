// components/PrivateChat.tsx - VERSÃO CORRIGIDA
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

// ... (as interfaces permanecem as mesmas)

export default function PrivateChat({ currentUser, currentTeam }: PrivateChatProps) {
  // ... (os states permanecem os mesmos)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ... (outros useEffects permanecem)

  // Efeito específico para scroll automático
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ... (outras funções permanecem)

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
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] flex flex-col">
          <Card className="flex flex-col flex-1 bg-zinc-900 border-zinc-700 shadow-2xl overflow-hidden">
            {/* Lista de Treinadores */}
            <div className={cn(
              "flex flex-col w-full md:w-1/3 border-r border-zinc-700 transition-all duration-300 flex-shrink-0",
              selectedCoach ? "hidden md:flex" : "flex"
            )}>
              <div className="p-4 border-b border-zinc-700 flex-shrink-0">
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
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors mb-1",
                        selectedCoach?.id === conversation.other_user.id && "bg-zinc-800"
                      )}
                    >
                      {conversation.other_user.teams?.logo_url ? (
                        <Image 
                          src={conversation.other_user.teams.logo_url}
                          alt={conversation.other_user.teams.name}
                          width={32}
                          height={32}
                          className="rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
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
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  ))}

                  {/* Todos os treinadores */}
                  {filteredCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      onClick={() => setSelectedCoach(coach)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors mb-1",
                        selectedCoach?.id === coach.id && "bg-zinc-800"
                      )}
                    >
                      {coach.teams?.logo_url ? (
                        <Image 
                          src={coach.teams.logo_url}
                          alt={coach.teams.name}
                          width={32}
                          height={32}
                          className="rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
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
              "flex flex-col flex-1 transition-all duration-300 min-h-0",
              selectedCoach ? "flex" : "hidden md:flex"
            )}>
              {selectedCoach ? (
                <>
                  {/* Header do Chat */}
                  <div className="flex items-center gap-3 p-4 border-b border-zinc-700 bg-zinc-800/50 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCoach(null)}
                      className="md:hidden text-zinc-400 hover:text-white flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {selectedCoach.teams?.logo_url && (
                      <Image 
                        src={selectedCoach.teams.logo_url}
                        alt={selectedCoach.teams.name}
                        width={32}
                        height={32}
                        className="rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {getDisplayName(selectedCoach)}
                      </p>
                      <p className="text-zinc-400 text-sm truncate">
                        {selectedCoach.teams?.name || 'Sem time'}
                      </p>
                    </div>
                  </div>

                  {/* Área de Mensagens */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full p-4">
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
                        {/* Elemento invisível para scroll automático */}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-zinc-700 flex-shrink-0">
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
                        className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
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