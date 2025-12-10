'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, Clock, CheckCircle, DollarSign, ArrowRight, 
  Calendar, Users, ArrowRightLeft, X, Ban, ShoppingCart, 
  Gavel, User, UserPlus, Users as UsersIcon, Image as ImageIcon
} from 'lucide-react'
import ExchangePlayers from './ExchangePlayers'
import { Transfer, formatBalance, formatDateTime, isAuction } from './types'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PlayerDetails {
  id: string
  name: string
  photo_url?: string
  position?: string
  overall?: number
  base_price?: number
}

interface TransferCardProps {
  transfer: Transfer
  activeTab: 'pending' | 'completed'
  userTeamId: string | null
  isAdmin: boolean
  exchangePlayersDetails: { [key: string]: any[] }
  aprovar: (transferId: string, type: 'seller' | 'buyer' | 'admin') => void
  rejeitarTransferencia: (transferId: string) => void
}

export default function TransferCard({
  transfer,
  activeTab,
  userTeamId,
  isAdmin,
  exchangePlayersDetails,
  aprovar,
  rejeitarTransferencia
}: TransferCardProps) {
  const isDismissal = !transfer.to_team_id || transfer.transfer_type === 'dismiss'
  const isAuctionTransfer = isAuction(transfer.transfer_type)
  const isMultiSell = transfer.transfer_type === 'multi_sell'
  const hasMultiplePlayers = isMultiSell && transfer.transfer_players && transfer.transfer_players.length > 1
  
  const [additionalPlayersDetails, setAdditionalPlayersDetails] = useState<PlayerDetails[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  // Buscar detalhes dos jogadores adicionais
  useEffect(() => {
    const loadAdditionalPlayersDetails = async () => {
      if (!hasMultiplePlayers || !transfer.transfer_players) return
      
      // Pular o primeiro jogador (já está em transfer.player)
      const additionalPlayerIds = transfer.transfer_players.slice(1)
      
      if (additionalPlayerIds.length === 0) {
        setAdditionalPlayersDetails([])
        return
      }
      
      setLoadingPlayers(true)
      try {
        const { data, error } = await supabase
          .from('players')
          .select('id, name, photo_url, position, overall, base_price')
          .in('id', additionalPlayerIds)
        
        if (error) {
          console.error('Erro ao carregar detalhes dos jogadores:', error)
          setAdditionalPlayersDetails([])
        } else {
          setAdditionalPlayersDetails(data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar jogadores:', error)
        setAdditionalPlayersDetails([])
      } finally {
        setLoadingPlayers(false)
      }
    }
    
    loadAdditionalPlayersDetails()
  }, [hasMultiplePlayers, transfer.transfer_players])

  // Encontrar detalhes do jogador pelo ID
  const getPlayerDetails = (playerId: string): PlayerDetails | null => {
    return additionalPlayersDetails.find(p => p.id === playerId) || null
  }

  // Encontrar nome do jogador (do array ou do banco)
  const getPlayerName = (playerId: string, index: number): string => {
    // Primeiro tenta do array player_names
    if (transfer.player_names && transfer.player_names.length > index + 1) {
      return transfer.player_names[index + 1]
    }
    
    // Depois tenta do banco
    const playerDetails = getPlayerDetails(playerId)
    return playerDetails?.name || `Jogador ${index + 2}`
  }

  // Encontrar foto do jogador
  const getPlayerPhoto = (playerId: string): string | null => {
    const playerDetails = getPlayerDetails(playerId)
    return playerDetails?.photo_url || null
  }

  // Encontrar posição do jogador
  const getPlayerPosition = (playerId: string): string => {
    const playerDetails = getPlayerDetails(playerId)
    return playerDetails?.position || 'N/A'
  }

  // Encontrar OVR do jogador
  const getPlayerOverall = (playerId: string): number => {
    const playerDetails = getPlayerDetails(playerId)
    return playerDetails?.overall || 0
  }

  return (
    <Card
      key={transfer.id}
      className={cn(
        "bg-white/5 backdrop-blur-xl border transition-all",
        transfer.status === 'approved' 
          ? "border-green-500/20 hover:border-green-500/40 p-4" 
          : "border-white/10 hover:border-white/20 p-5",
        transfer.is_exchange && "border-blue-500/20 hover:border-blue-500/40",
        isDismissal && "border-red-500/20 hover:border-red-500/40",
        isAuctionTransfer && "border-orange-500/20 hover:border-orange-500/40",
        isMultiSell && "border-purple-500/20 hover:border-purple-500/40"
      )}
    >
      {/* Badge de tipo de transferência */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <Badge className={cn(
            "text-xs",
            isAuctionTransfer ? "bg-orange-600" : 
            transfer.is_exchange ? "bg-blue-600" : 
            isDismissal ? "bg-red-600" : 
            isMultiSell ? "bg-purple-600" : "bg-emerald-600"
          )}>
            {isAuctionTransfer ? (
              <>
                <Gavel className="w-3 h-3 mr-1" />
                Leilão
              </>
            ) : transfer.is_exchange ? (
              <>
                <ArrowRightLeft className="w-3 h-3 mr-1" />
                Troca
              </>
            ) : isDismissal ? (
              <>
                <X className="w-3 h-3 mr-1" />
                Dispensa
              </>
            ) : isMultiSell ? (
              <>
                <UsersIcon className="w-3 h-3 mr-1" />
                Venda Múltipla
              </>
            ) : (
              <>
                <DollarSign className="w-3 h-3 mr-1" />
                Venda
              </>
            )}
          </Badge>
          
          {/* Badge de quantidade de jogadores em vendas múltiplas */}
          {hasMultiplePlayers && (
            <Badge className="bg-purple-800 text-white text-xs">
              <UserPlus className="w-3 h-3 mr-1" />
              {transfer.transfer_players?.length || 0} jogadores
            </Badge>
          )}
        </div>
        
        {transfer.status === 'approved' && (
          <Badge className="bg-green-600 text-white text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluída
          </Badge>
        )}
      </div>

      {transfer.status === 'pending' ? (
        // LAYOUT COMPACTO PARA EM ANDAMENTO
        <>
          {/* Times e Valor em linha compacta */}
          <div className="flex items-center justify-between mb-4">
            {/* Time Vendedor */}
            <div className="flex flex-col items-center text-center flex-1">
              {isAuctionTransfer ? (
                // Logo do Leilão
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-yellow-600 flex items-center justify-center mb-1">
                  <Gavel className="w-5 h-5 text-white" />
                </div>
              ) : transfer.from_team?.logo_url ? (
                <img 
                  src={transfer.from_team.logo_url} 
                  alt={transfer.from_team.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-red-500/50 mb-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center mb-1">
                  <span className="text-xs font-bold text-white">
                    {transfer.from_team?.name?.substring(0, 2) || 'VD'}
                  </span>
                </div>
              )}
              <p className="text-white text-sm font-medium truncate w-full">
                {isAuctionTransfer ? 'Leilão' : transfer.from_team?.name || 'Vendedor'}
              </p>
              <p className="text-zinc-400 text-xs">
                {isAuctionTransfer ? 'Sistema de Leilão' : 'Vendedor'}
              </p>
            </div>

            {/* Setas e Valor - Compacto */}
            <div className="flex flex-col items-center mx-2">
              <div className="flex items-center gap-1">
                <ArrowRight className="w-4 h-4 text-yellow-400" />
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    {transfer.is_exchange ? (
                      <ArrowRightLeft className="w-3 h-3 text-blue-400" />
                    ) : isAuctionTransfer ? (
                      <Gavel className="w-3 h-3 text-orange-400" />
                    ) : (
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                    )}
                    <span className={cn(
                      "font-bold text-sm",
                      transfer.is_exchange ? "text-blue-400" : 
                      isAuctionTransfer ? "text-orange-400" : "text-emerald-400"
                    )}>
                      {formatBalance(transfer.value)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-zinc-400 text-xs mt-1 text-center">
                {isAuctionTransfer ? 'Leilão' : transfer.is_exchange ? 'Troca' : 'Venda'}
              </p>
            </div>

            {/* Time Comprador */}
            <div className="flex flex-col items-center text-center flex-1">
              {transfer.to_team?.logo_url ? (
                <img 
                  src={transfer.to_team.logo_url} 
                  alt={transfer.to_team.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-500/50 mb-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mb-1">
                  <span className="text-xs font-bold text-white">
                    {transfer.to_team?.name?.substring(0, 2) || 'CP'}
                  </span>
                </div>
              )}
              <p className="text-white text-sm font-medium truncate w-full">
                {transfer.to_team?.name || 'Comprador'}
              </p>
              <p className="text-zinc-400 text-xs">Comprador</p>
            </div>
          </div>

          {/* Seção de jogadores */}
          {hasMultiplePlayers ? (
            // Exibir múltiplos jogadores em vendas múltiplas
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <UsersIcon className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">
                  {transfer.transfer_players?.length || 0} Jogadores na Venda
                </h4>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {/* Jogador principal (primeiro da lista) */}
                <div className="flex items-center gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                  {transfer.player?.photo_url ? (
                    <img 
                      src={transfer.player.photo_url} 
                      alt={transfer.player.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                      <span className="text-xs font-black text-white">
                        {transfer.player?.position || 'N/A'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">
                        {transfer.player?.name || 'Jogador Desconhecido'}
                      </h3>
                      <Badge className="bg-purple-600 text-[10px]">
                        {transfer.player?.position || 'N/A'}
                      </Badge>
                    </div>
                    <p className="text-purple-300 text-xs mt-1">
                      Principal
                    </p>
                  </div>
                </div>
                
                {/* Outros jogadores */}
                {loadingPlayers ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  (transfer.transfer_players?.slice(1) || []).map((playerId: string, index: number) => {
                    const playerName = getPlayerName(playerId, index)
                    const playerPhoto = getPlayerPhoto(playerId)
                    const playerPosition = getPlayerPosition(playerId)
                    const playerOverall = getPlayerOverall(playerId)
                    const playerValue = transfer.player_values?.[index + 1]
                    
                    return (
                      <div key={playerId || index} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                        {playerPhoto ? (
                          <img 
                            src={playerPhoto} 
                            alt={playerName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-cyan-700 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-white truncate">
                                {playerName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-blue-600 text-[10px]">
                                  {playerPosition}
                                </Badge>
                                <span className="text-zinc-400 text-xs">OVR {playerOverall}</span>
                              </div>
                            </div>
                            {playerValue && (
                              <span className="text-emerald-400 text-xs font-bold ml-2">
                                R$ {playerValue.toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-xs mt-1">
                            Jogador adicional
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              
              <div className="mt-3 p-2 bg-zinc-900/50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Total de jogadores:</span>
                  <span className="text-white font-bold">{transfer.transfer_players?.length || 1}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-zinc-400">Valor total:</span>
                  <span className="text-emerald-400 font-bold">{formatBalance(transfer.value)}</span>
                </div>
              </div>
            </div>
          ) : (
            // Exibir jogador único (para vendas normais ou trocas)
            <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg mb-4">
              {transfer.player?.photo_url ? (
                <img 
                  src={transfer.player.photo_url} 
                  alt={transfer.player.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                  <span className="text-sm font-black text-white">
                    {transfer.player?.position || 'N/A'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  {transfer.player?.name || 'Jogador Desconhecido'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-purple-600 text-xs">
                    {transfer.player?.position || 'N/A'}
                  </Badge>
                  <span className="text-yellow-400 text-xs font-semibold">
                    ⏳ Aguardando
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Jogadores da Troca (se for troca) */}
          {transfer.is_exchange && <ExchangePlayers transfer={transfer} exchangePlayersDetails={exchangePlayersDetails} />}

          {/* Aprovações - Compacto */}
          <div className="flex items-center justify-between mb-4 px-2">
            {/* Vendedor */}
            <div className="text-center group relative">
              <CheckCircle2
                className={cn(
                  "h-8 w-8 transition-all",
                  transfer.approved_by_seller ? "text-green-400" : "text-zinc-600"
                )}
              />
              <p className="text-xs text-zinc-400 mt-1">
                {isAuctionTransfer ? 'Sistema' : 'Vendedor'}
              </p>
            </div>

            {/* Comprador */}
            <div className="text-center group relative">
              <CheckCircle2
                className={cn(
                  "h-8 w-8 transition-all",
                  transfer.approved_by_buyer ? "text-green-400" : "text-zinc-600"
                )}
              />
              <p className="text-xs text-zinc-400 mt-1">Comprador</p>
            </div>

            {/* Admin */}
            <div className="text-center group relative">
              <CheckCircle2
                className={cn(
                  "h-8 w-8 transition-all",
                  transfer.approved_by_admin ? "text-green-400" : "text-zinc-600"
                )}
              />
              <p className="text-xs text-zinc-400 mt-1">Admin</p>
            </div>
          </div>

          {/* Botões de aprovação */}
          {(userTeamId === transfer.from_team_id || userTeamId === transfer.to_team_id || isAdmin) && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 justify-center">
                {userTeamId === transfer.from_team_id && !transfer.approved_by_seller && !isAuctionTransfer && (
                  <Button
                    onClick={() => aprovar(transfer.id, 'seller')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                  >
                    Aprovar Vendedor
                  </Button>
                )}
                {userTeamId === transfer.to_team_id && !transfer.approved_by_buyer && (
                  <Button
                    onClick={() => aprovar(transfer.id, 'buyer')}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3"
                  >
                    Aprovar Comprador
                  </Button>
                )}
                {isAdmin && !transfer.approved_by_admin && (
                  <Button
                    onClick={() => aprovar(transfer.id, 'admin')}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3"
                  >
                    Aprovar Admin
                  </Button>
                )}
              </div>

              {/* BOTÃO DE CANCELAR - APENAS PARA ADMIN */}
              {isAdmin && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => rejeitarTransferencia(transfer.id)}
                    variant="outline"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-xs"
                  >
                    <Ban className="w-3 h-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}

              {/* Mensagem se já aprovou */}
              {((userTeamId === transfer.from_team_id && transfer.approved_by_seller) ||
                (userTeamId === transfer.to_team_id && transfer.approved_by_buyer) ||
                (isAdmin && transfer.approved_by_admin)) && (
                <p className="text-green-400 font-bold text-xs flex items-center justify-center gap-1 mt-2">
                  <CheckCircle className="w-3 h-3" />
                  Você já aprovou esta negociação
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        // LAYOUT PARA TRANSFERÊNCIAS FINALIZADAS
        <div className="space-y-3">
          {/* Header com data/hora */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">
                {formatDateTime(transfer.created_at).date} às {formatDateTime(transfer.created_at).time}
              </span>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex items-center justify-between">
            {/* Time de Origem */}
            <div className="flex items-center gap-2">
              {isAuctionTransfer ? (
                // Logo do Leilão
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-yellow-600 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-white" />
                </div>
              ) : transfer.from_team?.logo_url ? (
                <img 
                  src={transfer.from_team.logo_url} 
                  alt={transfer.from_team.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-red-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {transfer.from_team?.name?.substring(0, 2) || 'VD'}
                  </span>
                </div>
              )}
              <div className="text-right">
                <p className="text-white text-xs font-semibold truncate max-w-[60px]">
                  {isAuctionTransfer ? 'Leilão' : transfer.from_team?.name || 'Vendedor'}
                </p>
                <p className="text-zinc-400 text-[10px]">
                  {isAuctionTransfer ? 'Sistema de Leilão' : 
                   isDismissal ? 'Anterior' : 'Vendedor'}
                </p>
              </div>
            </div>

            {/* Setas e Valor */}
            <div className="flex flex-col items-center flex-1 mx-2">
              <div className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-yellow-400" />
                <div className="flex items-center gap-1">
                  {isDismissal ? (
                    <X className="w-3 h-3 text-red-400" />
                  ) : transfer.is_exchange ? (
                    <ArrowRightLeft className="w-3 h-3 text-blue-400" />
                  ) : isAuctionTransfer ? (
                    <Gavel className="w-3 h-3 text-orange-400" />
                  ) : (
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className={cn(
                    "font-bold text-sm",
                    isDismissal ? "text-red-400" : 
                    transfer.is_exchange ? "text-blue-400" : 
                    isAuctionTransfer ? "text-orange-400" : "text-emerald-400"
                  )}>
                    {formatBalance(transfer.value)}
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-yellow-400" />
              </div>
              <p className="text-zinc-400 text-[10px] mt-1">
                {isAuctionTransfer ? 'Leilão' : 
                 isDismissal ? 'Dispensa' : transfer.is_exchange ? 'Troca' : 'Venda'}
              </p>
            </div>

            {/* Destino */}
            <div className="flex items-center gap-2">
              <div className="text-left">
                <p className="text-white text-xs font-semibold truncate max-w-[60px]">
                  {isDismissal ? 'Sem Clube' : transfer.to_team?.name || 'Comprador'}
                </p>
                <p className="text-zinc-400 text-[10px]">
                  {isDismissal ? 'Destino' : 'Comprador'}
                </p>
              </div>
              {isDismissal ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-300" />
                </div>
              ) : transfer.to_team?.logo_url ? (
                <img 
                  src={transfer.to_team.logo_url} 
                  alt={transfer.to_team.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-green-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {transfer.to_team?.name?.substring(0, 2) || 'CP'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seção de jogadores */}
          {hasMultiplePlayers ? (
            // Exibir múltiplos jogadores em vendas múltiplas finalizadas
            <div className="pt-2 border-t border-zinc-700/50">
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">
                  {transfer.transfer_players?.length || 0} Jogadores Transferidos
                </h4>
              </div>
              
              <div className="space-y-2">
                {/* Jogador principal (primeiro da lista) */}
                <div className="flex items-center gap-2">
                  {transfer.player?.photo_url ? (
                    <img 
                      src={transfer.player.photo_url} 
                      alt={transfer.player.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                      <span className="text-xs font-black text-white">
                        {transfer.player?.position || 'N/A'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">
                      {transfer.player?.name || 'Jogador Desconhecido'}
                    </p>
                    <Badge className="bg-purple-600 text-[10px]">
                      {transfer.player?.position || 'N/A'}
                    </Badge>
                  </div>
                </div>
                
                {/* Outros jogadores (collapsed por padrão) */}
                {(transfer.transfer_players?.slice(1) || []).length > 0 && (
                  <div className="pl-2 border-l-2 border-purple-500/30 ml-4">
                    <div className="flex items-center gap-1 text-xs text-zinc-400 mb-1">
                      <UserPlus className="w-3 h-3" />
                      <span>+ {(transfer.transfer_players?.slice(1) || []).length} jogadores adicionais</span>
                    </div>
                    
                    {loadingPlayers ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(transfer.transfer_players?.slice(1) || []).map((playerId: string, index: number) => {
                          const playerName = getPlayerName(playerId, index)
                          const playerPhoto = getPlayerPhoto(playerId)
                          const playerPosition = getPlayerPosition(playerId)
                          
                          return (
                            <div key={playerId} className="flex items-center gap-2 text-xs">
                              {playerPhoto ? (
                                <img 
                                  src={playerPhoto} 
                                  alt={playerName}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-700 to-cyan-700 flex items-center justify-center">
                                  <ImageIcon className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-300 truncate">{playerName}</span>
                                <Badge className="bg-blue-600 text-[8px]">{playerPosition}</Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-2 pt-2 border-t border-zinc-700/30 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total:</span>
                  <span className="text-white font-bold">{transfer.transfer_players?.length || 1} jogadores</span>
                </div>
              </div>
            </div>
          ) : (
            // Exibir jogador único para vendas normais
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-700/50">
              {transfer.player?.photo_url ? (
                <img 
                  src={transfer.player.photo_url} 
                  alt={transfer.player.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                  <span className="text-xs font-black text-white">
                    {transfer.player?.position || 'N/A'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {transfer.player?.name || 'Jogador Desconhecido'}
                </p>
                <Badge className="bg-purple-600 text-[10px]">
                  {transfer.player?.position || 'N/A'}
                </Badge>
              </div>
            </div>
          )}

          {/* Jogadores da Troca (se for troca) */}
          {transfer.is_exchange && <ExchangePlayers transfer={transfer} exchangePlayersDetails={exchangePlayersDetails} />}
        </div>
      )}
    </Card>
  )
}