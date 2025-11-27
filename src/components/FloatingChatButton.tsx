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
      className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-5 rounded-2xl shadow-2xl transition-all duration-300 z-40 flex items-center justify-center group hover:scale-110 hover:shadow-purple-600/40 border border-white/10 backdrop-blur-xl"
      aria-label="Abrir chat"
    >
      <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold shadow-lg border-2 border-zinc-900">
          {unreadCount}
        </span>
      )}
    </button>
  );
}