'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileText, X, Check } from 'lucide-react'

interface DescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  initialText: string
  onSave: (text: string) => void
  playerName: string
}

export default function DescriptionModal({
  isOpen,
  onClose,
  initialText,
  onSave,
  playerName
}: DescriptionModalProps) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
      setText(initialText)
    }
  }, [isOpen, initialText])

  const handleSave = () => {
    onSave(text.trim())
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Descrição para {playerName}</h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mb-4">
          <p className="text-zinc-400 text-sm mb-2">
            Escreva uma descrição para o jogador (opcional)
          </p>
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Preciso de grana para reforçar o time, jogador não se adaptou ao sistema..."
            className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[120px]"
            rows={4}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="text-white border-zinc-600 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Aplicar Descrição
          </Button>
        </div>
        
        <div className="mt-3 text-xs text-zinc-500">
          Dica: Pressione <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Ctrl+Enter</kbd> para salvar
        </div>
      </div>
    </div>
  )
}