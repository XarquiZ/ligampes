// src/components/Chatpopup.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Search, User, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  team_logo?: string;
  team_name?: string;
}

interface Team {
  id: string;
  name: string;
  logo_url?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderId?: string;
  conversationId?: string;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  user1: User;
  user2: User;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentTeam: Team;
}

type TabType = 'conversations' | 'coaches';

export default function ChatPopup({ 
  isOpen, 
  onClose, 
  currentUser, 
  currentTeam 
}: ChatPopupProps) {
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar conversas e treinadores
  useEffect(() => {
    if (!isOpen || !currentUser.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadConversations(),
          loadCoaches()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados do chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, currentUser.id]);

  // Carregar conversas do usuário
  const loadConversations = async () => {
    try {
      console.log('Carregando conversas para usuário:', currentUser.id);
      
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        return;
      }

      console.log('Conversas carregadas:', conversationsData);

      if (!conversationsData?.length) {
        setConversations([]);
        return;
      }

      // Carrega os perfis com informações do time
      const userIds = conversationsData.flatMap(conv => [conv.user1_id, conv.user2_id]);
      const uniqueUserIds = [...new Set(userIds)];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, 
          coach_name, 
          email, 
          role,
          teams (
            name,
            logo_url
          )
        `)
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Erro ao carregar perfis:', profilesError);
        return;
      }

      // Formata as conversas
      const formattedConversations: Conversation[] = conversationsData.map(conv => {
        const user1Profile = profilesData.find(p => p.id === conv.user1_id);
        const user2Profile = profilesData.find(p => p.id === conv.user2_id);

        return {
          id: conv.id,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          user1: {
            id: conv.user1_id,
            name: user1Profile?.coach_name || user1Profile?.email || 'Usuário',
            email: user1Profile?.email || '',
            role: user1Profile?.role,
            team_name: user1Profile?.teams?.name,
            team_logo: user1Profile?.teams?.logo_url
          },
          user2: {
            id: conv.user2_id,
            name: user2Profile?.coach_name || user2Profile?.email || 'Usuário',
            email: user2Profile?.email || '',
            role: user2Profile?.role,
            team_name: user2Profile?.teams?.name,
            team_logo: user2Profile?.teams?.logo_url
          },
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: conv.unread_count || 0
        };
      });

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Erro ao processar conversas:', error);
    }
  };

  // Carregar todos os treinadores com informações do time
  const loadCoaches = async () => {
    try {
      const { data: coachesData, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          coach_name, 
          email, 
          role,
          teams (
            name,
            logo_url
          )
        `)
        .neq('id', currentUser.id)
        .order('coach_name');

      if (error) {
        console.error('Erro ao carregar treinadores:', error);
        return;
      }

      const formattedCoaches: User[] = coachesData.map(coach => ({
        id: coach.id,
        name: coach.coach_name || coach.email,
        email: coach.email,
        role: coach.role,
        team_name: coach.teams?.name,
        team_logo: coach.teams?.logo_url
      }));

      setCoaches(formattedCoaches);
    } catch (error) {
      console.error('Erro ao processar treinadores:', error);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        return;
      }

      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        text: msg.message,
        sender: msg.sender_id === currentUser.id ? 'user' : 'other',
        timestamp: new Date(msg.created_at),
        senderId: msg.sender_id,
        conversationId: msg.conversation_id
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao processar mensagens:', error);
    }
  };

  // Iniciar nova conversa
  const startNewConversation = async (coach: User) => {
    // Verificar se já existe conversa
    const existingConversation = conversations.find(conv => 
      (conv.user1.id === coach.id && conv.user2.id === currentUser.id) ||
      (conv.user2.id === coach.id && conv.user1.id === currentUser.id)
    );

    if (existingConversation) {
      setSelectedConversation(existingConversation);
      await loadMessages(existingConversation.id);
      setActiveTab('conversations');
      return;
    }

    try {
      // Criar nova conversa
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: currentUser.id,
          user2_id: coach.id,
          last_message: 'Conversa iniciada',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar conversa:', error);
        return;
      }

      // Criar objeto de conversa formatado
      const formattedConversation: Conversation = {
        id: newConversation.id,
        user1_id: newConversation.user1_id,
        user2_id: newConversation.user2_id,
        user1: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          team_name: currentTeam.name,
          team_logo: currentTeam.logo_url
        },
        user2: {
          id: coach.id,
          name: coach.name,
          email: coach.email,
          role: coach.role,
          team_name: coach.team_name,
          team_logo: coach.team_logo
        },
        last_message: 'Conversa iniciada',
        last_message_at: newConversation.last_message_at,
        unread_count: 0
      };

      setSelectedConversation(formattedConversation);
      setMessages([]);
      setActiveTab('conversations');
      await loadConversations();
    } catch (error) {
      console.error('Erro ao processar nova conversa:', error);
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage.trim();

    try {
      // Enviar mensagem via Supabase
      const { error: messageError } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          message: messageText
        });

      if (messageError) {
        console.error('Erro ao enviar mensagem:', messageError);
        return;
      }

      // Atualizar última mensagem na conversa
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      if (updateError) {
        console.error('Erro ao atualizar conversa:', updateError);
        return;
      }

      // Recarregar mensagens e conversas
      await loadMessages(selectedConversation.id);
      await loadConversations();
      
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao processar envio de mensagem:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.user1.id === currentUser.id ? conversation.user2 : conversation.user1;
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.team_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-zinc-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col z-50 backdrop-blur-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
        <div>
          <h3 className="font-black text-lg">CHAT - {currentTeam.name}</h3>
          <p className="text-purple-200 text-sm font-medium">
            {selectedConversation ? `Conversando com ${getOtherUser(selectedConversation).name}` : 'Selecione uma conversa'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-purple-200 transition-colors p-1 rounded-full hover:bg-white/10"
          aria-label="Fechar chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-zinc-800/50">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex-1 py-4 px-6 text-sm font-bold transition-all ${
            activeTab === 'conversations'
              ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          CONVERSAS
        </button>
        <button
          onClick={() => setActiveTab('coaches')}
          className={`flex-1 py-4 px-6 text-sm font-bold transition-all ${
            activeTab === 'coaches'
              ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          TREINADORES
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-zinc-900 to-zinc-800">
        {selectedConversation ? (
          // Área de mensagens
          <>
            {/* Header da conversa */}
            <div className="p-4 border-b border-white/10 bg-zinc-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
                >
                  ←
                </button>
                <div className="flex items-center gap-3">
                  {getOtherUser(selectedConversation).team_logo ? (
                    <img 
                      src={getOtherUser(selectedConversation).team_logo} 
                      alt={getOtherUser(selectedConversation).team_name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-500/50"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-white text-sm flex items-center gap-1">
                      {getOtherUser(selectedConversation).name}
                      {getOtherUser(selectedConversation).role === 'admin' && (
                        <Crown size={14} className="text-yellow-500" />
                      )}
                    </span>
                    {getOtherUser(selectedConversation).team_name && (
                      <span className="text-xs text-purple-400 font-medium">
                        {getOtherUser(selectedConversation).team_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-zinc-900 to-zinc-800">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={24} className="text-gray-600" />
                  </div>
                  <p className="font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">Inicie a conversa!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 backdrop-blur-xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-lg'
                          : 'bg-white/10 text-white rounded-bl-none border border-white/10'
                      }`}
                    >
                      <p className="text-sm font-medium">{message.text}</p>
                      <p
                        className={`text-xs mt-2 font-medium ${
                          message.sender === 'user'
                            ? 'text-purple-200'
                            : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-white/10 bg-zinc-800/50 shrink-0"
            >
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 backdrop-blur-xl"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white p-3 rounded-xl transition-all duration-300 shadow-lg disabled:shadow-none"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          // Lista de conversas ou treinadores
          <>
            {activeTab === 'coaches' && (
              <div className="p-4 border-b border-white/10 bg-zinc-800/50 shrink-0">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar treinadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 backdrop-blur-xl"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500 text-sm font-medium">Carregando...</div>
                </div>
              ) : activeTab === 'conversations' ? (
                conversations.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle size={24} className="text-gray-600" />
                    </div>
                    <p className="font-medium">Nenhuma conversa iniciada</p>
                    <p className="text-xs mt-1">Vá para "Treinadores" para começar</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherUser = getOtherUser(conversation);
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          loadMessages(conversation.id);
                        }}
                        className="w-full p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-purple-500/50 group-hover:border-purple-400 transition-all">
                              {otherUser.team_logo ? (
                                <img 
                                  src={otherUser.team_logo} 
                                  alt={otherUser.team_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={18} className="text-white" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-white text-sm flex items-center gap-2">
                                {otherUser.name}
                                {otherUser.role === 'admin' && (
                                  <Crown size={12} className="text-yellow-500" />
                                )}
                              </p>
                              <p className="text-purple-400 text-xs font-medium">
                                {otherUser.team_name}
                              </p>
                              <p className="text-gray-400 text-xs mt-1 truncate max-w-[200px]">
                                {conversation.last_message || 'Nenhuma mensagem'}
                              </p>
                            </div>
                          </div>
                          {conversation.unread_count > 0 && (
                            <span className="bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold shadow-lg">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                // Tab de Treinadores
                filteredCoaches.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User size={24} className="text-gray-600" />
                    </div>
                    <p className="font-medium">Nenhum treinador encontrado</p>
                    <p className="text-xs mt-1">Tente ajustar sua busca</p>
                  </div>
                ) : (
                  filteredCoaches.map((coach) => (
                    <button
                      key={coach.id}
                      onClick={() => startNewConversation(coach)}
                      className="w-full p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-green-500/50 group-hover:border-green-400 transition-all">
                          {coach.team_logo ? (
                            <img 
                              src={coach.team_logo} 
                              alt={coach.team_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={18} className="text-white" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white text-sm flex items-center gap-2">
                            {coach.name}
                            {coach.role === 'admin' && (
                              <Crown size={12} className="text-yellow-500" />
                            )}
                          </p>
                          <p className="text-green-400 text-xs font-medium">
                            {coach.team_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}