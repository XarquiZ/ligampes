'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle } from 'lucide-react'
import TransferCard from './TransferCard'
import { Transfer } from './types'

interface TransferenciasViewProps {
  activeTab: 'pending' | 'completed'
  setActiveTab: (tab: 'pending' | 'completed') => void
  transfers: Transfer[]
  allTransfers: Transfer[]
  userTeamId: string | null
  isAdmin: boolean
  exchangePlayersDetails: {[key: string]: any[]}
  aprovar: (transferId: string, type: 'seller' | 'buyer' | 'admin') => void
  rejeitarTransferencia: (transferId: string) => void
  loading: boolean
}

export default function TransferenciasView({
  activeTab,
  setActiveTab,
  transfers,
  allTransfers,
  userTeamId,
  isAdmin,
  exchangePlayersDetails,
  aprovar,
  rejeitarTransferencia,
  loading
}: TransferenciasViewProps) {
  // Contadores para as abas
  const pendingCount = allTransfers.filter(t => t.status === 'pending').length
  const completedCount = allTransfers.filter(t => t.status === 'approved').length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-2xl text-white animate-pulse">Carregando negociações...</p>
      </div>
    )
  }

  return (
    <>
      {/* Seletor de Abas */}
      <div className="flex gap-4 mb-8 justify-center md:justify-start">
        <Button
          onClick={() => setActiveTab('pending')}
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          className={cn(
            "flex items-center gap-2 text-white",
            activeTab === 'pending' ? "bg-purple-600 hover:bg-purple-700" : "bg-zinc-800/50 border-zinc-600"
          )}
        >
          <Clock className="w-4 h-4" />
          Em Andamento
          <Badge variant="secondary" className="ml-2 bg-zinc-700">
            {pendingCount}
          </Badge>
        </Button>
        
        <Button
          onClick={() => setActiveTab('completed')}
          variant={activeTab === 'completed' ? 'default' : 'outline'}
          className={cn(
            "flex items-center gap-2 text-white",
            activeTab === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-zinc-800/50 border-zinc-600"
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Finalizadas
          <Badge variant="secondary" className="ml-2 bg-zinc-700">
            {completedCount}
          </Badge>
        </Button>
      </div>

      {transfers.length === 0 ? (
        <Card className="p-16 text-center bg-white/5 border-white/10">
          <p className="text-xl text-zinc-400">
            {activeTab === 'pending' 
              ? 'Nenhuma negociação pendente no momento.' 
              : 'Nenhuma transferência finalizada.'
            }
          </p>
          <p className="text-zinc-500 mt-2">
            {activeTab === 'pending' 
              ? 'O mercado está calmo... por enquanto.' 
              : 'Todas as negociações estão em andamento.'
            }
          </p>
        </Card>
      ) : (
        <div className={cn(
          "gap-4",
          activeTab === 'pending' ? "grid grid-cols-1 lg:grid-cols-2" : "grid grid-cols-1 md:grid-cols-2"
        )}>
          {transfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              activeTab={activeTab}
              userTeamId={userTeamId}
              isAdmin={isAdmin}
              exchangePlayersDetails={exchangePlayersDetails}
              aprovar={aprovar}
              rejeitarTransferencia={rejeitarTransferencia}
            />
          ))}
        </div>
      )}
    </>
  )
}