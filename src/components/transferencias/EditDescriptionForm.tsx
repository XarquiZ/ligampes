'use client'

import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save, XCircle } from 'lucide-react'
import { MarketPlayer } from './types'

interface EditDescriptionFormProps {
  listing: MarketPlayer
  editDescriptionText: string
  setEditDescriptionText: (text: string) => void
  onUpdateDescription: (listingId: string) => void
  onCancelEdit: () => void
}

export default function EditDescriptionForm({
  listing,
  editDescriptionText,
  setEditDescriptionText,
  onUpdateDescription,
  onCancelEdit
}: EditDescriptionFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      onUpdateDescription(listing.id)
    }
    if (e.key === 'Escape') {
      onCancelEdit()
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={editDescriptionText}
        onChange={(e) => setEditDescriptionText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite a descrição para este jogador..."
        className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          onClick={() => onUpdateDescription(listing.id)}
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-1" />
          Salvar
        </Button>
        <Button
          onClick={onCancelEdit}
          variant="outline"
          size="sm"
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
      </div>
      <p className="text-xs text-zinc-400">
        Dica: Use <kbd className="px-1 bg-zinc-700 rounded">Ctrl+Enter</kbd> para salvar
      </p>
    </div>
  )
}