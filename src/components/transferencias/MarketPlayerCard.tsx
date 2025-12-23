'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Edit, Trash2, ShoppingCart, Info, ExternalLink, MessageCircle, Handshake } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MarketPlayer } from './types'
import EditDescriptionForm from './EditDescriptionForm'

interface MarketPlayerCardProps {
  listing: MarketPlayer
  isMine?: boolean
  onStartEditDescription: (listing: MarketPlayer) => void
  onRemoveFromMarket: (listingId: string) => void
  onBuyPlayer: (listing: MarketPlayer) => void
  onMakeProposal: (listing: MarketPlayer) => void
  editingDescription: string | null
  editDescriptionText: string
  setEditDescriptionText: (text: string) => void
  onUpdateDescription: (listingId: string) => void
  onCancelEdit: () => void
}

export default function MarketPlayerCard({
  listing,
  isMine = false,
  onStartEditDescription,
  onRemoveFromMarket,
  onBuyPlayer,
  onMakeProposal,
  editingDescription,
  editDescriptionText,
  setEditDescriptionText,
  onUpdateDescription,
  onCancelEdit
}: MarketPlayerCardProps) {
  const router = useRouter()

  const player = listing.player || {
    id: listing.player_id,
    name: listing.player_name,
    position: 'N/A',
    overall: 0,
    photo_url: null,
    base_price: 0,
    team_id: null
  }

  const teamName = listing.team_name || 'Time desconhecido'
  const teamLogo = listing.team_logo
  const safeTeamName = teamName || 'Time'

  // Verifica se é negociável pela descrição (pode conter palavras-chave)
  const isNegotiable = listing.description?.toLowerCase().includes('negoci') ||
    listing.description?.toLowerCase().includes('proposta') ||
    listing.description?.toLowerCase().includes('aceito')

  const navigateToPlayerPage = (playerId: string) => {
    router.push(`/dashboard/jogadores/${playerId}`)
  }

  const handleActionClick = () => {
    if (isMine) return

    if (isNegotiable) {
      // Para jogadores negociáveis, chama a função de fazer proposta/abrir chat
      onMakeProposal(listing)
    } else {
      // Para jogadores com preço fixo, chama a função de compra
      onBuyPlayer(listing)
    }
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all p-4">
      {/* Header com time */}
      <div className="flex items-center gap-2 mb-3">
        {teamLogo ? (
          <img
            src={teamLogo}
            alt={teamName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {safeTeamName.substring(0, 2)}
            </span>
          </div>
        )}
        <span className="text-sm text-zinc-300">{teamName}</span>

        {/* Badge para negociáveis */}
        {isNegotiable && (
          <Badge className="ml-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1">
            <Handshake className="w-3 h-3 mr-1" />
            Aceita Propostas
          </Badge>
        )}
      </div>

      {/* Player info */}
      <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => navigateToPlayerPage(player.id)}>
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-purple-500"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
            <span className="text-lg font-black text-white">{player.position}</span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">{player.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-purple-600">{player.position}</Badge>
                <Badge className="bg-yellow-600">OVR {player.overall}</Badge>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      {/* Price - SEMPRE MOSTRADO, mas com estilo diferente para negociáveis */}
      <div className="mb-3">
        <p className="text-zinc-400 text-sm">
          {isNegotiable ? 'Preço Sugerido' : 'Preço no Mercado'}
        </p>
        <p className={cn(
          "font-bold text-xl",
          isNegotiable ? "text-purple-400" : "text-emerald-400"
        )}>
          R$ {listing.price.toLocaleString('pt-BR')}
        </p>
        {!isNegotiable && (
          <p className="text-zinc-500 text-xs">
            Valor base: R$ {player.base_price.toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      {/* Description */}
      {listing.description && (
        <div className="mb-3">
          <p className="text-zinc-400 text-sm flex items-center gap-1 mb-1">
            <Info className="w-3 h-3" />
            {isNegotiable ? 'Informações da Negociação' : 'Descrição do vendedor'}
          </p>
          <div className={cn(
            "text-zinc-300 text-sm rounded-lg p-2",
            isNegotiable
              ? "bg-purple-900/20 border border-purple-700/30"
              : "bg-zinc-800/30"
          )}>
            <p>{listing.description}</p>
            {isNegotiable && (
              <div className="flex items-center gap-1 mt-2 text-purple-400 text-xs">
                <MessageCircle className="w-3 h-3" />
                <span>Clique em "Enviar Proposta" para negociar via chat</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isMine ? (
          <>
            <Button
              onClick={() => onStartEditDescription(listing)}
              variant="outline"
              size="sm"
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              onClick={() => onRemoveFromMarket(listing.id)}
              variant="outline"
              size="sm"
              className="flex-1 bg-red-600/20 border-red-600 hover:bg-red-600/30 text-white"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remover
            </Button>
          </>
        ) : (
          <Button
            onClick={handleActionClick}
            className={cn(
              "flex-1 text-white flex items-center justify-center gap-2",
              isNegotiable
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                : "bg-green-600 hover:bg-green-700"
            )}
          >
            {isNegotiable ? (
              <>
                <MessageCircle className="w-4 h-4" />
                Enviar Proposta
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Fazer Proposta
              </>
            )}
          </Button>
        )}
      </div>

      {/* Formulário de edição de descrição */}
      {isMine && editingDescription === listing.id && (
        <EditDescriptionForm
          listing={listing}
          editDescriptionText={editDescriptionText}
          setEditDescriptionText={setEditDescriptionText}
          onUpdateDescription={onUpdateDescription}
          onCancelEdit={onCancelEdit}
        />
      )}
    </Card>
  )
}

// Função de utilitário
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}