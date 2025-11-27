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
}

interface Team {
  id: string;
  name: string;
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

  // Carregar conversas do usuário - CORRIGIDO
  const loadConversations = async () => {
    try {
      // Primeiro carrega as conversas
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        return;
      }

      if (!conversationsData?.length) {
        setConversations([]);
        return;
      }

      // Carrega os perfis separadamente
      const userIds = conversationsData.flatMap(conv => [conv.user1_id, conv.user2_id]);
      const uniqueUserIds = [...new Set(userIds)];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, coach_name, email, role')
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Erro ao carregar perfis:', profilesError);
        return;
      }

      // Formata as conversas
      const formattedConversations: Conversation[] = conversationsData.map(conv => {
        const user1 = profilesData.find(p => p.id === conv.user1_id);
        const user2 = profilesData.find(p => p.id === conv.user2_id);

        return {
          id: conv.id,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          user1: {
            id: conv.user1_id,
            name: user1?.coach_name || user1?.email || 'Usuário',
            email: user1?.email || '',
            role: user1?.role
          },
          user2: {
            id: conv.user2_id,
            name: user2?.coach_name || user2?.email || 'Usuário',
            email: user2?.email || '',
            role: user2?.role
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

  // Carregar todos os treinadores
  const loadCoaches = async () => {
    const { data: coachesData, error } = await supabase
      .from('profiles')
      .select('id, coach_name, email, role')
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
      role: coach.role
    }));

    setCoaches(formattedCoaches);
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string) => {
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
  };

  // Iniciar nova conversa - CORRIGIDO
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
          role: currentUser.role
        },
        user2: {
          id: coach.id,
          name: coach.name,
          email: coach.email,
          role: coach.role
        },
        last_message: 'Conversa iniciada',
        last_message_at: newConversation.last_message_at,
        unread_count: 0
      };

      setSelectedConversation(formattedConversation);
      setMessages([]);
      setActiveTab('conversations');
      await loadConversations(); // Recarregar lista de conversas
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
      const { error } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          message: messageText
        });

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        return;
      }

      // Atualizar última mensagem na conversa
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

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
    coach.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Chat - {currentTeam.name}</h3>
          <p className="text-blue-100 text-sm">
            {selectedConversation ? `Conversando com ${getOtherUser(selectedConversation).name}` : 'Selecione uma conversa'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-blue-200 transition-colors"
          aria-label="Fechar chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'conversations'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Conversas
        </button>
        <button
          onClick={() => setActiveTab('coaches')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'coaches'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Treinadores
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedConversation ? (
          // Área de mensagens
          <>
            {/* Header da conversa */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ←
                </button>
                <User size={16} className="text-gray-600" />
                <span className="font-medium text-sm">
                  {getOtherUser(selectedConversation).name}
                  {getOtherUser(selectedConversation).role === 'admin' && (
                    <Crown size={12} className="inline ml-1 text-yellow-500" />
                  )}
                </span>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  Nenhuma mensagem ainda. Inicie a conversa!
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
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user'
                            ? 'text-blue-200'
                            : 'text-gray-500'
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
              className="p-3 border-t border-gray-200 bg-white shrink-0"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          // Lista de conversas ou treinadores
          <>
            {activeTab === 'coaches' && (
              <div className="p-3 border-b border-gray-200 shrink-0">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar treinadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500 text-sm">Carregando...</div>
                </div>
              ) : activeTab === 'conversations' ? (
                conversations.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    Nenhuma conversa iniciada
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation.id);
                      }}
                      className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 flex items-center gap-1">
                              {getOtherUser(conversation).name}
                              {getOtherUser(conversation).role === 'admin' && (
                                <Crown size={12} className="text-yellow-500" />
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {conversation.last_message || 'Nenhuma mensagem'}
                            </p>
                          </div>
                        </div>
                        {conversation.unread_count > 0 && (
                          <span className="bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )
              ) : (
                // Tab de Treinadores
                filteredCoaches.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    Nenhum treinador encontrado
                  </div>
                ) : (
                  filteredCoaches.map((coach) => (
                    <button
                      key={coach.id}
                      onClick={() => startNewConversation(coach)}
                      className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 flex items-center gap-1">
                            {coach.name}
                            {coach.role === 'admin' && (
                              <Crown size={12} className="text-yellow-500" />
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{coach.email}</p>
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