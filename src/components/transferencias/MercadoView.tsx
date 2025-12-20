'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ShoppingCart, Users, Tag } from 'lucide-react'
import MarketPlayerCard from './MarketPlayerCard'
import MarketPlayerForm from './MarketPlayerForm'
import { MarketPlayer, Player } from './types'

interface MercadoViewProps {
  marketTab: 'disponiveis' | 'meus'
  setMarketTab: (tab: 'disponiveis' | 'meus') => void
  marketPlayers: MarketPlayer[]
  myMarketPlayers: MarketPlayer[]
  availablePlayers: Player[]
  loadingMarket: boolean
  showAddForm: boolean
  setShowAddForm: (show: boolean) => void
  selectedPlayer: Player | null
  setSelectedPlayer: (player: Player | null) => void
  marketPrice: string
  setMarketPrice: (price: string) => void
  marketDescription: string
  setMarketDescription: (description: string) => void
  editingDescription: string | null
  setEditingDescription: (id: string | null) => void
  editDescriptionText: string
  setEditDescriptionText: (text: string) => void
  priceOptions: { value: number; label: string }[]
  handlePriceChange: (value: string) => void
  handleOpenDescriptionModal: () => void
  handleAddToMarket: (saleMode: 'fixed_price' | 'negotiable') => void
  handleRemoveFromMarket: (listingId: string) => void
  handleBuyPlayer: (listing: MarketPlayer) => void
  handleMakeProposal: (listing: MarketPlayer) => void
  handleStartEditDescription: (listing: MarketPlayer) => void
  handleUpdateDescription: (listingId: string) => void
  handleCancelEdit: () => void
  addingPlayer: boolean
  handleCancelAdd: () => void
}

export default function MercadoView({
  marketTab,
  setMarketTab,
  marketPlayers,
  myMarketPlayers,
  availablePlayers,
  loadingMarket,
  showAddForm,
  setShowAddForm,
  selectedPlayer,
  setSelectedPlayer,
  marketPrice,
  setMarketPrice,
  marketDescription,
  setMarketDescription,
  editingDescription,
  setEditingDescription,
  editDescriptionText,
  setEditDescriptionText,
  priceOptions,
  handlePriceChange,
  handleOpenDescriptionModal,
  handleAddToMarket,
  handleRemoveFromMarket,
  handleBuyPlayer,
  handleMakeProposal,
  handleStartEditDescription,
  handleUpdateDescription,
  handleCancelEdit,
  addingPlayer,
  handleCancelAdd
}: MercadoViewProps) {
  return (
    <>
      {/* Tabs do Mercado */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-start">
        <Button
          onClick={() => setMarketTab('disponiveis')}
          variant={marketTab === 'disponiveis' ? 'default' : 'outline'}
          className={cn(
            "flex items-center justify-center w-full sm:w-auto gap-2 text-white",
            marketTab === 'disponiveis' ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-800/50 border-zinc-600"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Disponíveis
          <Badge variant="secondary" className="ml-2 bg-zinc-700">
            {marketPlayers.length}
          </Badge>
        </Button>

        <Button
          onClick={() => setMarketTab('meus')}
          variant={marketTab === 'meus' ? 'default' : 'outline'}
          className={cn(
            "flex items-center justify-center w-full sm:w-auto gap-2 text-white",
            marketTab === 'meus' ? "bg-green-600 hover:bg-green-700" : "bg-zinc-800/50 border-zinc-600"
          )}
        >
          <Users className="w-4 h-4" />
          Meus Jogadores
          <Badge variant="secondary" className="ml-2 bg-zinc-700">
            {myMarketPlayers.length}
          </Badge>
        </Button>
      </div>

      {marketTab === 'meus' && (
        <MarketPlayerForm
          availablePlayers={availablePlayers}
          selectedPlayer={selectedPlayer}
          setSelectedPlayer={setSelectedPlayer}
          marketPrice={marketPrice}
          setMarketPrice={setMarketPrice}
          marketDescription={marketDescription}
          setMarketDescription={setMarketDescription}
          priceOptions={priceOptions}
          handlePriceChange={handlePriceChange}
          handleOpenDescriptionModal={handleOpenDescriptionModal}
          handleAddToMarket={handleAddToMarket}
          addingPlayer={addingPlayer}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          handleCancelAdd={handleCancelAdd}
        />
      )}

      {/* Lista de jogadores disponíveis */}
      {loadingMarket ? (
        <div className="text-center py-16">
          <p className="text-xl text-zinc-400 animate-pulse">Carregando mercado...</p>
        </div>
      ) : marketTab === 'disponiveis' && marketPlayers.length === 0 ? (
        <Card className="p-8 md:p-16 text-center bg-white/5 border-white/10">
          <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-xl text-zinc-400">Nenhum jogador disponível no mercado</p>
          <p className="text-zinc-500 mt-2">Os times ainda não anunciaram jogadores para venda</p>
        </Card>
      ) : marketTab === 'meus' && myMarketPlayers.length === 0 && !showAddForm ? (
        <Card className="p-8 md:p-16 text-center bg-white/5 border-white/10">
          <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-xl text-zinc-400">Você ainda não anunciou jogadores</p>
          <p className="text-zinc-500 mt-2">Clique em "Adicionar Jogador" para começar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {(marketTab === 'disponiveis' ? marketPlayers : myMarketPlayers)
            .filter(listing => marketTab === 'disponiveis' ? listing.is_active : true)
            .map(listing => (
              <MarketPlayerCard
                key={listing.id}
                listing={listing}
                isMine={marketTab === 'meus'}
                onStartEditDescription={handleStartEditDescription}
                onRemoveFromMarket={handleRemoveFromMarket}
                onBuyPlayer={handleBuyPlayer}
                onMakeProposal={handleMakeProposal}
                editingDescription={editingDescription}
                editDescriptionText={editDescriptionText}
                setEditDescriptionText={setEditDescriptionText}
                onUpdateDescription={handleUpdateDescription}
                onCancelEdit={handleCancelEdit}
              />
            ))
          }
        </div>
      )}
    </>
  )
}