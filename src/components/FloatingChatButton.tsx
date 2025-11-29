// src/components/FloatingChatButton.tsx
'use client';

import { MessageCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
}

interface FloatingChatButtonProps {
  currentUser: User;
  currentTeam: Team;
  unreadCount: number;
  onOpenChat: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function FloatingChatButton({
  currentUser,
  currentTeam,
  unreadCount,
  onOpenChat,
  onUnreadCountChange
}: FloatingChatButtonProps) {
  const [internalUnreadCount, setInternalUnreadCount] = useState(unreadCount);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sincronizar com a prop apenas uma vez após inicialização
  useEffect(() => {
    if (!isInitialized && unreadCount >= 0) {
      console.log('🔄 Inicializando FloatingChatButton com unreadCount:', unreadCount);
      setInternalUnreadCount(unreadCount);
      setIsInitialized(true);
    }
  }, [unreadCount, isInitialized]);

  // Atualizar apenas quando a prop mudar significativamente
  useEffect(() => {
    if (isInitialized && unreadCount !== internalUnreadCount) {
      console.log('🔄 Atualizando unreadCount da prop:', unreadCount);
      setInternalUnreadCount(unreadCount);
    }
  }, [unreadCount, internalUnreadCount, isInitialized]);

  // Listener de eventos melhorado
  useEffect(() => {
    const handleUnreadCountUpdated = (event: CustomEvent) => {
      const { totalUnread } = event.detail || {};
      if (typeof totalUnread === 'number' && totalUnread >= 0) {
        console.log('📩 Evento recebido - totalUnread:', totalUnread);
        
        // Atualizar estado interno
        setInternalUnreadCount(totalUnread);
        
        // Notificar componente pai se a função existe
        if (onUnreadCountChange && typeof onUnreadCountChange === 'function') {
          console.log('📤 Notificando componente pai sobre mudança:', totalUnread);
          onUnreadCountChange(totalUnread);
        }
      }
    };

    // Adicionar listener com opção passive para melhor performance
    window.addEventListener('chatUnreadCountUpdated', handleUnreadCountUpdated as EventListener, { passive: true });
    
    console.log('🎯 FloatingChatButton - Listener de eventos registrado');

    return () => {
      window.removeEventListener('chatUnreadCountUpdated', handleUnreadCountUpdated as EventListener);
      console.log('🧹 FloatingChatButton - Listener de eventos removido');
    };
  }, [onUnreadCountChange]);

  // Listener para eventos de foco de conversa
  useEffect(() => {
    const handleFocusConversation = (event: CustomEvent) => {
      console.log('🎯 FloatingChatButton - Evento focusConversation recebido');
      // Quando uma conversa é focada externamente, abrir o chat
      onOpenChat();
    };

    window.addEventListener('focusConversation', handleFocusConversation as EventListener, { passive: true });

    return () => {
      window.removeEventListener('focusConversation', handleFocusConversation as EventListener);
    };
  }, [onOpenChat]);

  // Função para abrir chat com melhor tratamento
  const handleOpenChat = useCallback(() => {
    console.log('💬 Abrindo chat - unreadCount atual:', internalUnreadCount);
    
    // Disparar evento para indicar que o chat está sendo aberto
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chatOpening', {
        detail: { unreadCount: internalUnreadCount }
      }));
    }
    
    // Chamar a função do componente pai
    onOpenChat();
  }, [internalUnreadCount, onOpenChat]);

  // Efeito para debug - remover em produção
  useEffect(() => {
    console.log('🔔 FloatingChatButton - Estado atual:', {
      internalUnreadCount,
      propUnreadCount: unreadCount,
      isInitialized,
      currentUserId: currentUser?.id
    });
  }, [internalUnreadCount, unreadCount, isInitialized, currentUser]);

  return (
    <button
      onClick={handleOpenChat}
      className="fixed bottom-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-xl shadow-2xl transition-all duration-300 z-40 flex items-center justify-center group hover:scale-105 hover:shadow-purple-600/40 border border-white/10 backdrop-blur-xl"
      aria-label="Abrir chat"
      title={`Chat - ${internalUnreadCount} mensagens não lidas`}
    >
      <MessageCircle 
        size={20} 
        className={`group-hover:scale-110 transition-transform ${
          internalUnreadCount > 0 ? 'animate-pulse' : ''
        }`} 
      />
      
      {/* Badge de notificação melhorada */}
      {internalUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[20px] h-5 text-xs flex items-center justify-center font-bold shadow-lg border border-zinc-900 animate-bounce">
          {internalUnreadCount > 9 ? '9+' : internalUnreadCount}
        </span>
      )}
      
      {/* Efeito de pulso suave quando há notificações */}
      {internalUnreadCount > 0 && (
        <span className="absolute inset-0 bg-red-500/20 rounded-xl animate-ping opacity-75" />
      )}
    </button>
  );
}