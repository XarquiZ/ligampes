import { Grid3X3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { CadastrarJogadorForm } from '@/components/jogadores/CadastrarJogadorForm'
import { Filter, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PlayerHeaderProps {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  isFilterOpen: boolean
  setIsFilterOpen: (open: boolean) => void
  isCadastroOpen: boolean
  setIsCadastroOpen: (open: boolean) => void
  activeAdvancedFilters: number
  userRole: string | null
  jogadoresLength: number
  filteredPlayersLength: number
}

export function PlayerHeader({
  viewMode,
  setViewMode,
  isFilterOpen,
  setIsFilterOpen,
  isCadastroOpen,
  setIsCadastroOpen,
  activeAdvancedFilters,
  userRole,
  jogadoresLength,
  filteredPlayersLength
}: PlayerHeaderProps) {
  return (
    <>
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
            JOGADORES
          </h1>
          <p className="text-zinc-400 mt-2 text-sm lg:text-lg">Base de Jogadores • {jogadoresLength} jogadores disponíveis</p>
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Toggle de Visualização */}
          <div className="flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn("rounded-lg", viewMode === 'grid' && "bg-purple-600")}
            >
              <Grid3X3 className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn("rounded-lg", viewMode === 'list' && "bg-purple-600")}
            >
              <List className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
          </div>

          {/* Filtros Avançados */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="bg-zinc-900/50 backdrop-blur border-zinc-700 hover:border-purple-500 hover:bg-zinc-800/70 text-white relative">
                <Filter className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Filtros
                {activeAdvancedFilters > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs">
                    {activeAdvancedFilters}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
          </Sheet>

          {userRole === 'admin' && (
            <Sheet open={isCadastroOpen} onOpenChange={setIsCadastroOpen}>
              <SheetTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-sm lg:text-lg px-6 lg:px-8">
                  <PlusCircle className="w-5 h-5 lg:w-6 lg:h-6 mr-2 lg:mr-3" />
                  Novo Jogador
                </Button>
              </SheetTrigger>
            </Sheet>
          )}
        </div>
      </header>

      <div className="text-center mb-8 lg:mb-12">
        <p className="text-lg lg:text-xl text-zinc-400">
          Encontrados <span className="text-3xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{filteredPlayersLength}</span> jogadores
        </p>
      </div>
    </>
  )
}