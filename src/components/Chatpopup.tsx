'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
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
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentTeam: Team;
}

export default function ChatPopup({ 
  isOpen, 
  onClose, 
  currentUser, 
  currentTeam 
}: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Olá ${currentUser.name}! Bem-vindo ao ${currentTeam.name}. Como posso ajudar?`,
      sender: 'other',
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      senderId: currentUser.id,
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simular resposta automática após 1 segundo
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Obrigado pela sua mensagem! Em breve nossa equipe responderá.',
        sender: 'other',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Suporte {currentTeam.name}</h3>
          <p className="text-blue-100 text-sm">Online</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-blue-200 transition-colors"
          aria-label="Fechar chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message) => (
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
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-200 bg-white"
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
    </div>
  );
}