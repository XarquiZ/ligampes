'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Frown, Target, Zap, RotateCcw, TrendingUp } from 'lucide-react'
import { FinishedAuctionResult } from '@/app/dashboard/leilao/page'

interface ConsolationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: FinishedAuctionResult | null
}

export function ConsolationModal({ open, onOpenChange, result }: ConsolationModalProps) {
  if (!result) return null

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    return `R$ ${value.toLocaleString('pt-BR')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-900/90 to-indigo-900/90 backdrop-blur-lg border-blue-500/30 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <DialogHeader>
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="relative">
                <Frown className="w-20 h-20 text-blue-400 mb-4" />
                <Target className="w-10 h-10 text-blue-300 absolute -top-2 -right-2" />
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-black text-center text-blue-300">
                MAIS SORTE NA PRÓXIMA!
              </DialogTitle>
              <DialogDescription className="text-lg text-blue-200/80 text-center mt-2">
                Outro time levou o jogador
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 mb-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">{result.playerName}</h3>
                <p className="text-blue-300 text-lg mb-4">Foi arrematado por:</p>
                
                <div className="flex flex-col items-center justify-center gap-3 mb-6">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 w-full">
                    <p className="text-sm text-blue-300">Time Vencedor</p>
                    <p className="text-xl font-bold text-white">{result.winningTeamName}</p>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 w-full">
                    <p className="text-sm text-yellow-300">Valor Final</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(result.winningAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-white">Seu saldo reservado foi liberado automaticamente</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-white">Continue participando! Novas oportunidades virão</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg shadow-blue-500/25"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Voltar ao Leilão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}