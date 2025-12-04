'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Award, PartyPopper, Trophy, Star, CheckCircle, Sparkles } from 'lucide-react'
import { FinishedAuctionResult } from '@/app/dashboard/leilao/page'

interface WinnerCelebrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: FinishedAuctionResult | null
}

export function WinnerCelebrationModal({ open, onOpenChange, result }: WinnerCelebrationModalProps) {
  if (!result) return null

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    return `R$ ${value.toLocaleString('pt-BR')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-yellow-900/90 to-orange-900/90 backdrop-blur-lg border-yellow-500/30 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <DialogHeader>
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="relative">
                <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
                <Star className="w-10 h-10 text-yellow-300 absolute -top-2 -right-2 animate-ping" />
              </div>
              <DialogTitle className="text-3xl md:text-4xl font-black text-center text-yellow-300">
                PARABÉNS!
              </DialogTitle>
              <DialogDescription className="text-lg text-yellow-200/80 text-center mt-2">
                Você venceu o leilão!
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 mb-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">{result.playerName}</h3>
                <p className="text-yellow-300 text-lg mb-4">Agora é do seu time!</p>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-yellow-300">Valor do Lance</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(result.winningAmount)}</p>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <p className="text-sm text-green-300">Status</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-1">
                      <CheckCircle className="w-6 h-6" />
                      Adquirido
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <PartyPopper className="w-5 h-5 text-yellow-400" />
                <span className="text-white">O jogador será adicionado ao seu elenco automaticamente</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-white">O valor será debitado do seu saldo reservado</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg shadow-yellow-500/25"
            >
              <PartyPopper className="w-5 h-5 mr-2" />
              Continuar no Leilão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}