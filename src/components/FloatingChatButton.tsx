// src/components/FloatingChatButton.tsx
'use client';

import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

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

  // Sincronizar com a prop
  useEffect(() => {
    setInternalUnreadCount(unreadCount);
  }, [unreadCount]);

  // Escutar eventos de atualização
  useEffect(() => {
    const handleUnreadCountUpdated = (event: CustomEvent) => {
      const { totalUnread } = event.detail || {};
      if (typeof totalUnread === 'number') {
        console.log('Evento recebido - totalUnread:', totalUnread);
        setInternalUnreadCount(totalUnread);
        if (onUnreadCountChange) {
          onUnreadCountChange(totalUnread);
        }
      }
    };

    window.addEventListener('chatUnreadCountUpdated', handleUnreadCountUpdated as EventListener);
    
    return () => {
      window.removeEventListener('chatUnreadCountUpdated', handleUnreadCountUpdated as EventListener);
    };
  }, [onUnreadCountChange]);

  // Função para abrir chat
  const handleOpenChat = () => {
    console.log('Abrindo chat - unreadCount atual:', internalUnreadCount);
    onOpenChat();
  };

  return (
    <button
      onClick={handleOpenChat}
      className="fixed bottom-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-xl shadow-2xl transition-all duration-300 z-40 flex items-center justify-center group hover:scale-105 hover:shadow-purple-600/40 border border-white/10 backdrop-blur-xl"
      aria-label="Abrir chat"
    >
      <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
      {internalUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold shadow-lg border border-zinc-900 animate-pulse">
          {internalUnreadCount > 9 ? '9+' : internalUnreadCount}
        </span>
      )}
    </button>
  );
}