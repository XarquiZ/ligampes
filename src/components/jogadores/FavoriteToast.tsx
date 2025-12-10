import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteToastProps {
  show: boolean
  message: string
}

export function FavoriteToast({ show, message }: FavoriteToastProps) {
  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center gap-3">
        <Star className={cn(
          "w-5 h-5",
          message.includes('adicionado') ? "fill-yellow-400 text-yellow-400" : "text-white"
        )} />
        <div>
          <p className="font-bold text-sm">{message}</p>
          <p className="text-purple-200 text-xs mt-1">
            {message.includes('adicionado') 
              ? 'Agora ele aparece na aba "Favoritos" do seu elenco!' 
              : 'Ele foi removido da sua lista de favoritos.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}