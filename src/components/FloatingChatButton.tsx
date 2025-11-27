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
      className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 z-40 flex items-center justify-center group hover:scale-105 hover:shadow-purple-600/40 border border-white/10 backdrop-blur-xl"
      aria-label="Abrir chat"
    >
      <MessageCircle size={20} className="sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs flex items-center justify-center font-bold shadow-lg border border-zinc-900">
          {unreadCount}
        </span>
      )}
    </button>
  );
}