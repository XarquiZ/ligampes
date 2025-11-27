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
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-40 flex items-center justify-center"
      aria-label="Abrir chat"
    >
      <MessageCircle size={24} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}