'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle, ChevronDown } from 'lucide-react'
import TransferCard from './TransferCard'
import { Transfer } from './types'
import { useState } from 'react'

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
  selectedTeamFilter?: string | null
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
  loading,
  selectedTeamFilter
}: TransferenciasViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Contadores para as abas
  const pendingCount = allTransfers.filter(t => t.status === 'pending').length
  const completedCount = allTransfers.filter(t => t.status === 'approved').length
  
  const tabConfig = {
    pending: {
      label: 'Em Andamento',
      icon: Clock,
      color: 'purple-600',
      shadow: 'shadow-purple-600/20',
      description: 'Negociações pendentes de aprovação',
      count: pendingCount
    },
    completed: {
      label: 'Finalizadas',
      icon: CheckCircle,
      color: 'green-600',
      shadow: 'shadow-green-600/20',
      description: 'Transferências já concluídas',
      count: completedCount
    }
  }
  
  const ActiveIcon = tabConfig[activeTab].icon
  const activeConfig = tabConfig[activeTab]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-2xl text-white animate-pulse">Carregando negociações...</p>
      </div>
    )
  }

  return (
    <>
      {/* Seletor de Abas - Responsivo */}
      <div className="relative w-full sm:w-fit mb-8">
        {/* Mobile Dropdown (below 768px) - SEM DESCRIÇÃO */}
        <div className="sm:hidden">
          <Button
            variant="default"
            size="lg"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-full justify-between rounded-xl bg-zinc-900/70 border border-zinc-700',
              `bg-${activeConfig.color}`,
              activeConfig.shadow
            )}
          >
            <div className="flex items-center">
              <ActiveIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{activeConfig.label}</span>
                  <Badge variant="secondary" className="ml-1 bg-zinc-800 text-white text-xs">
                    {activeConfig.count}
                  </Badge>
                </div>
              </div>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 transition-transform',
              isOpen && 'transform rotate-180'
            )} />
          </Button>
          
          {isOpen && (
            <>
              {/* Backdrop overlay */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown menu - SEM DESCRIÇÃO */}
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg overflow-hidden">
                {Object.entries(tabConfig).map(([key, config]) => {
                  if (key === activeTab) return null
                  
                  const Icon = config.icon
                  return (
                    <Button
                      key={key}
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        setActiveTab(key as 'pending' | 'completed')
                        setIsOpen(false)
                      }}
                      className="w-full justify-start rounded-none border-b border-zinc-700 last:border-b-0 hover:bg-zinc-800 py-3"
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <div className="text-left flex items-center justify-between w-full">
                        <span className="font-bold">{config.label}</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-white text-xs">
                          {config.count}
                        </Badge>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </>
          )}
        </div>
        
        {/* Desktop View (768px and above) - DESIGN ORIGINAL */}
        <div className="hidden sm:flex gap-4">
          {Object.entries(tabConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={key}
                onClick={() => setActiveTab(key as 'pending' | 'completed')}
                variant={activeTab === key ? 'default' : 'outline'}
                className={cn(
                  "flex items-center gap-2 text-white px-6 py-3",
                  activeTab === key ? `bg-${config.color} hover:bg-${config.color}/90 ${config.shadow}` : "bg-zinc-800/50 border-zinc-600"
                )}
              >
                <Icon className="w-5 h-5" />
                {config.label}
                <Badge variant="secondary" className="ml-2 bg-zinc-800 text-white">
                  {config.count}
                </Badge>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo das Transferências */}
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
              onFilterByTeam={undefined}
              selectedTeamFilter={selectedTeamFilter}
            />
          ))}
        </div>
      )}
    </>
  )
}