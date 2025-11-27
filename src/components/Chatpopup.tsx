// src/components/Chatpopup.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Search, User, Crown, Paperclip, ChevronDown } from 'lucide-react';
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
  type?: 'text' | 'player';
  playerData?: PlayerData;
}

interface PlayerData {
  id: string;
  name: string;
  overall: number;
  position: string;
  photo_url?: string;
  team_id?: string;
  team_name?: string;
  team_logo?: string;
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
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
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
            id,
            name,
            logo_url
          )
        `)
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Erro ao carregar perfis:', profilesError);
        return;
      }

      // Carrega contagem de mensagens não lidas para cada conversa
      const conversationsWithUnread = await Promise.all(
        conversationsData.map(async (conv) => {
          const { count } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', currentUser.id);

          return {
            ...conv,
            unread_count: count || 0
          };
        })
      );

      // Formata as conversas
      const formattedConversations: Conversation[] = conversationsWithUnread.map(conv => {
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
          unread_count: conv.unread_count
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
            id,
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

  // Carregar mensagens de uma conversa - CORRIGIDO para marcar como lidas
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

      // CORREÇÃO: Marcar TODAS as mensagens não lidas como lidas
      const unreadMessages = messagesData?.filter(msg => 
        !msg.read && msg.sender_id !== currentUser.id
      );

      if (unreadMessages && unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        
        await supabase
          .from('private_messages')
          .update({ read: true })
          .in('id', messageIds);

        // Atualizar contagem de não lidas após marcar como lidas
        await loadConversations();
      }

      const formattedMessages: Message[] = messagesData.map(msg => {
        let messageData: Message = {
          id: msg.id,
          text: msg.message,
          sender: msg.sender_id === currentUser.id ? 'user' : 'other',
          timestamp: new Date(msg.created_at),
          senderId: msg.sender_id,
          conversationId: msg.conversation_id,
          type: 'text'
        };

        // Se a mensagem contém dados de jogador
        if (msg.player_data) {
          messageData = {
            ...messageData,
            type: 'player',
            playerData: msg.player_data,
            text: `Jogador: ${msg.player_data.name}`
          };
        }

        return messageData;
      });

      setMessages(formattedMessages);
      
    } catch (error) {
      console.error('Erro ao processar mensagens:', error);
    }
  };

  // Carregar times disponíveis para seleção de jogadores
  const loadAvailableTeams = async () => {
    if (!selectedConversation) return;

    const teams: Team[] = [];
    
    // Time do usuário atual
    if (currentTeam.id) {
      teams.push(currentTeam);
    }

    // Time do outro usuário
    const otherUser = getOtherUser(selectedConversation);
    
    // Buscar o time do outro usuário
    const { data: otherUserTeam } = await supabase
      .from('profiles')
      .select('teams(id, name, logo_url)')
      .eq('id', otherUser.id)
      .single();

    if (otherUserTeam?.teams) {
      teams.push({
        id: otherUserTeam.teams.id,
        name: otherUserTeam.teams.name,
        logo_url: otherUserTeam.teams.logo_url
      });
    }

    setAvailableTeams(teams);
    if (teams.length > 0) {
      setSelectedTeam(teams[0].id);
    }
  };

  // Carregar jogadores do time selecionado - CORRIGIDO
  const loadPlayers = async (teamId: string) => {
    try {
      const { data: playersData, error } = await supabase
        .from('players')
        .select('id, name, overall, position, photo_url, team_id, teams!inner(id, name, logo_url)')
        .eq('team_id', teamId)
        .order('overall', { ascending: false });

      if (error) {
        console.error('Erro ao carregar jogadores:', error);
        return;
      }

      const formattedPlayers: PlayerData[] = playersData.map(player => ({
        id: player.id,
        name: player.name,
        overall: player.overall,
        position: player.position,
        photo_url: player.photo_url,
        team_id: player.team_id,
        team_name: player.teams.name,
        team_logo: player.teams.logo_url
      }));

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Erro ao processar jogadores:', error);
    }
  };

  // Abrir seletor de jogadores
  const openPlayerSelector = async () => {
    if (!selectedConversation) return;
    
    setShowPlayerSelector(true);
    await loadAvailableTeams();
  };

  // Selecionar time e carregar jogadores
  useEffect(() => {
    if (selectedTeam && showPlayerSelector) {
      loadPlayers(selectedTeam);
    }
  }, [selectedTeam, showPlayerSelector]);

  // Filtrar jogadores pela busca
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  // Compartilhar jogador no chat - CORRIGIDO
  const sharePlayer = async () => {
    if (!selectedPlayer || !selectedConversation) return;

    try {
      // Enviar mensagem com dados do jogador
      const { error: messageError } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          message: `Jogador: ${selectedPlayer.name}`,
          player_data: selectedPlayer
        });

      if (messageError) {
        console.error('Erro ao enviar jogador:', messageError);
        return;
      }

      // Atualizar última mensagem na conversa
      await supabase
        .from('conversations')
        .update({
          last_message: `Compartilhou: ${selectedPlayer.name}`,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      // Recarregar mensagens e conversas
      await loadMessages(selectedConversation.id);
      await loadConversations();
      
      // Fechar seletor e limpar seleções
      setShowPlayerSelector(false);
      setSelectedPlayer(null);
      setPlayerSearch('');
    } catch (error) {
      console.error('Erro ao processar compartilhamento:', error);
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

  // Função para navegar entre abas mesmo com conversa aberta
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Função para navegar para o jogador
  const navigateToPlayer = (playerId: string) => {
    // Aqui você pode implementar a navegação para a página do jogador
    // Por exemplo, usando window.location ou seu router
    console.log('Navegar para jogador:', playerId);
    // window.location.href = `/dashboard/jogadores#player-${playerId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[320px] h-[450px] bg-zinc-900 rounded-xl shadow-2xl border border-white/10 flex flex-col z-50 backdrop-blur-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-t-xl flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm truncate">CHAT</h3>
          <p className="text-purple-200 text-xs font-medium truncate">
            {selectedConversation ? `Conversando com ${getOtherUser(selectedConversation).name}` : `${currentTeam.name}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-purple-200 transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0 ml-2"
          aria-label="Fechar chat"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs - Sempre visíveis */}
      <div className="flex border-b border-white/10 bg-zinc-800/50">
        <button
          onClick={() => handleTabClick('conversations')}
          className={`flex-1 py-2 px-3 text-xs font-bold transition-all ${
            activeTab === 'conversations'
              ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          CONVERSAS
        </button>
        <button
          onClick={() => handleTabClick('coaches')}
          className={`flex-1 py-2 px-3 text-xs font-bold transition-all ${
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
        {selectedConversation && activeTab === 'conversations' ? (
          // Área de mensagens (quando em conversas E com conversa selecionada)
          <>
            {/* Header da conversa */}
            <div className="p-2 border-b border-white/10 bg-zinc-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all flex-shrink-0"
                >
                  ←
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getOtherUser(selectedConversation).team_logo ? (
                    <img 
                      src={getOtherUser(selectedConversation).team_logo} 
                      alt={getOtherUser(selectedConversation).team_name}
                      className="w-6 h-6 rounded-full object-cover border border-purple-500/50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1 truncate">
                      {getOtherUser(selectedConversation).name}
                      {getOtherUser(selectedConversation).role === 'admin' && (
                        <Crown size={10} className="text-yellow-500 flex-shrink-0" />
                      )}
                    </span>
                    {getOtherUser(selectedConversation).team_name && (
                      <span className="text-purple-400 text-xs truncate block">
                        {getOtherUser(selectedConversation).team_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gradient-to-b from-zinc-900 to-zinc-800">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-6">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MessageCircle size={16} className="text-gray-600" />
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
                    {message.type === 'player' && message.playerData ? (
                      // Mensagem de jogador compartilhado
                      <div
                        className="max-w-[85%] rounded-lg p-3 backdrop-blur-xl bg-white/10 border border-white/10 cursor-pointer hover:bg-white/20 transition-all"
                        onClick={() => navigateToPlayer(message.playerData!.id)}
                      >
                        <div className="flex items-center gap-3">
                          {message.playerData.photo_url ? (
                            <img 
                              src={message.playerData.photo_url} 
                              alt={message.playerData.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/50"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{message.playerData.position}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{message.playerData.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                                OVR {message.playerData.overall}
                              </span>
                              <span className="text-purple-400 text-xs">{message.playerData.position}</span>
                            </div>
                            {message.playerData.team_name && (
                              <p className="text-gray-400 text-xs mt-1 truncate">{message.playerData.team_name}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-right">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    ) : (
                      // Mensagem de texto normal
                      <div
                        className={`max-w-[85%] rounded-lg p-2 backdrop-blur-xl ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-lg'
                            : 'bg-white/10 text-white rounded-bl-none border border-white/10'
                        }`}
                      >
                        <p className="text-xs font-medium break-words">{message.text}</p>
                        <p
                          className={`text-[10px] mt-1 font-medium ${
                            message.sender === 'user'
                              ? 'text-purple-200'
                              : 'text-gray-400'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <form
              onSubmit={handleSendMessage}
              className="p-2 border-t border-white/10 bg-zinc-800/50 shrink-0"
            >
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={openPlayerSelector}
                  className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition-all duration-300 flex-shrink-0"
                  title="Compartilhar jogador"
                >
                  <Paperclip size={14} />
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 backdrop-blur-xl"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white p-1 rounded-lg transition-all duration-300 shadow-lg disabled:shadow-none flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </>
        ) : (
          // Lista de conversas ou treinadores (quando NÃO está em uma conversa OU está na aba de treinadores)
          <>
            {activeTab === 'coaches' && (
              <div className="p-2 border-b border-white/10 bg-zinc-800/50 shrink-0">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar treinadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 backdrop-blur-xl"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="text-gray-500 text-xs font-medium">Carregando...</div>
                </div>
              ) : activeTab === 'conversations' ? (
                conversations.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MessageCircle size={16} className="text-gray-600" />
                    </div>
                    <p className="font-medium text-xs">Nenhuma conversa iniciada</p>
                    <p className="text-[10px] mt-1">Vá para "Treinadores" para começar</p>
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
                        className="w-full p-2 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-left group relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center overflow-hidden border border-purple-500/50 group-hover:border-purple-400 transition-all flex-shrink-0">
                              {otherUser.team_logo ? (
                                <img 
                                  src={otherUser.team_logo} 
                                  alt={otherUser.team_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={12} className="text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white text-xs flex items-center gap-1 truncate">
                                {otherUser.name}
                                {otherUser.role === 'admin' && (
                                  <Crown size={10} className="text-yellow-500 flex-shrink-0" />
                                )}
                              </p>
                              <p className="text-purple-400 text-xs font-medium truncate">
                                {otherUser.team_name}
                              </p>
                              <p className="text-gray-400 text-[10px] mt-0.5 truncate">
                                {conversation.last_message || 'Nenhuma mensagem'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Indicador de mensagens não lidas - MELHORADO */}
                          {conversation.unread_count > 0 && (
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
                              <span className="bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold shadow-lg">
                                {conversation.unread_count}
                              </span>
                              <span className="bg-red-500/20 text-red-300 text-[8px] px-1 rounded">
                                NOVA
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                // Tab de Treinadores
                filteredCoaches.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                      <User size={16} className="text-gray-600" />
                    </div>
                    <p className="font-medium text-xs">Nenhum treinador encontrado</p>
                    <p className="text-[10px] mt-1">Tente ajustar sua busca</p>
                  </div>
                ) : (
                  filteredCoaches.map((coach) => (
                    <button
                      key={coach.id}
                      onClick={() => startNewConversation(coach)}
                      className="w-full p-2 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center overflow-hidden border border-green-500/50 group-hover:border-green-400 transition-all flex-shrink-0">
                          {coach.team_logo ? (
                            <img 
                              src={coach.team_logo} 
                              alt={coach.team_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={12} className="text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs flex items-center gap-1 truncate">
                            {coach.name}
                            {coach.role === 'admin' && (
                              <Crown size={10} className="text-yellow-500 flex-shrink-0" />
                            )}
                          </p>
                          <p className="text-green-400 text-xs font-medium truncate">
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

      {/* Modal de seleção de jogadores - CORRIGIDO cor do texto */}
      {showPlayerSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl border border-white/10 w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
              <h3 className="font-bold text-sm">Compartilhar Jogador</h3>
              <p className="text-purple-200 text-xs">Selecione um jogador para compartilhar</p>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-4">
              {/* Seletor de time - CORRIGIDO cor do texto */}
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1 block">Selecionar Time</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {availableTeams.map(team => (
                    <option key={team.id} value={team.id} className="bg-zinc-900 text-white">
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Busca de jogadores */}
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar jogador..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-zinc-400"
                />
              </div>

              {/* Lista de jogadores */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredPlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`w-full p-3 rounded-lg border transition-all ${
                      selectedPlayer?.id === player.id
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {player.photo_url ? (
                        <img 
                          src={player.photo_url} 
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover border border-purple-500/50"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{player.position}</span>
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-bold text-white text-sm truncate">{player.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                            OVR {player.overall}
                          </span>
                          <span className="text-purple-400 text-xs">{player.position}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowPlayerSelector(false);
                    setSelectedPlayer(null);
                    setPlayerSearch('');
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-all text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={sharePlayer}
                  disabled={!selectedPlayer}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-2 rounded-lg transition-all text-xs font-medium disabled:cursor-not-allowed"
                >
                  Compartilhar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}