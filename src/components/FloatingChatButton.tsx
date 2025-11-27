// src/components/FloatingChatButton.tsx
'use client';

import { MessageCircle } from 'lucide-react';

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
}

export default function FloatingChatButton({
  currentUser,
  currentTeam,
  unreadCount,
  onOpenChat
}: FloatingChatButtonProps) {
  return (
    <button
      onClick={onOpenChat}
      className="fixed bottom-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-xl shadow-2xl transition-all duration-300 z-40 flex items-center justify-center group hover:scale-105 hover:shadow-purple-600/40 border border-white/10 backdrop-blur-xl"
      aria-label="Abrir chat"
    >
      <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold shadow-lg border border-zinc-900 animate-pulse">
          {unreadCount}
        </span>
      )}
    </button>
  );
}