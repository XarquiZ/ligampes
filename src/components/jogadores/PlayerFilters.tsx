'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CustomCheckbox } from './CustomCheckbox'

interface PlayerFiltersProps {
  searchName: string
  setSearchName: (value: string) => void
  selectedPositions: string[]
  togglePosition: (position: string) => void
  clearPositionFilters: () => void
  selectedPlaystyles: string[]
  togglePlaystyle: (playstyle: string) => void
  clearPlaystyleFilters: () => void
  filterTeam: string
  setFilterTeam: (value: string) => void
  clearAllFilters: () => void
  teams: Array<{ id: string; name: string; logo_url: string | null }>
  POSITIONS: string[]
  PLAYSTYLES: string[]
}

export function PlayerFilters({
  searchName,
  setSearchName,
  selectedPositions,
  togglePosition,
  clearPositionFilters,
  selectedPlaystyles,
  togglePlaystyle,
  clearPlaystyleFilters,
  filterTeam,
  setFilterTeam,
  clearAllFilters,
  teams,
  POSITIONS,
  PLAYSTYLES
}: PlayerFiltersProps) {
  const [positionFilterOpen, setPositionFilterOpen] = useState(false)
  const [playstyleFilterOpen, setPlaystyleFilterOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 lg:w-5 lg:h-5" />
          <Input
            placeholder="Procurar jogador..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-12 h-12 lg:h-14 bg-zinc-900/70 border-zinc-700 text-white placeholder:text-zinc-500 text-base lg:text-lg rounded-xl"
          />
        </div>

        {/* FILTRO DE POSIÇÕES */}
        <div className="relative">
          <Button 
            variant="outline" 
            className={cn(
              "h-12 lg:h-14 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-sm w-full lg:w-40",
              selectedPositions.length > 0 && "border-purple-500 text-purple-400"
            )}
            onClick={() => setPositionFilterOpen(!positionFilterOpen)}
          >
            <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Posições
            {selectedPositions.length > 0 && (
              <Badge className="bg-purple-600 text-xs h-5 px-2 min-w-5">{selectedPositions.length}</Badge>
            )}
          </Button>
          
          {positionFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-full lg:w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-40 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-base">Filtrar por Posição</h3>
                {selectedPositions.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearPositionFilters}
                    className="text-xs text-red-400 hover:text-red-300 h-6"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {POSITIONS.map(position => (
                  <CustomCheckbox
                    key={position}
                    id={`position-${position}`}
                    checked={selectedPositions.includes(position)}
                    onChange={() => togglePosition(position)}
                    label={position}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FILTRO DE ESTILOS DE JOGO */}
        <div className="relative">
          <Button 
            variant="outline" 
            className={cn(
              "h-12 lg:h-14 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-sm w-full lg:w-40",
              selectedPlaystyles.length > 0 && "border-purple-500 text-purple-400"
            )}
            onClick={() => setPlaystyleFilterOpen(!playstyleFilterOpen)}
          >
            <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Estilos
            {selectedPlaystyles.length > 0 && (
              <Badge className="bg-purple-600 text-xs h-5 px-2 min-w-5">{selectedPlaystyles.length}</Badge>
            )}
          </Button>
          
          {playstyleFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-full lg:w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-40 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-base">Filtrar por Estilo</h3>
                {selectedPlaystyles.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearPlaystyleFilters}
                    className="text-xs text-red-400 hover:text-red-300 h-6"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {PLAYSTYLES.map(playstyle => (
                  <CustomCheckbox
                    key={playstyle}
                    id={`playstyle-${playstyle}`}
                    checked={selectedPlaystyles.includes(playstyle)}
                    onChange={() => togglePlaystyle(playstyle)}
                    label={playstyle}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FILTRO DE TIME */}
        <div className="w-full lg:w-48">
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="h-12 lg:h-14 bg-zinc-900/70 border-zinc-700 text-white">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os times</SelectItem>
              <SelectItem value="Sem Time">Sem time</SelectItem>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex items-center gap-3">
                    {t.logo_url && <img src={t.logo_url} alt="" className="w-6 h-6 rounded" />}
                    <span>{t.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="lg" onClick={clearAllFilters} className="h-12 lg:h-14 px-4 lg:px-6 bg-zinc-900/70 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500 text-white">
          <X className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
          Resetar Filtros
        </Button>
      </div>

      {/* Fechar filtros quando clicar fora */}
      {(positionFilterOpen || playstyleFilterOpen) && (
        <div 
          className="fixed inset-0 z-0 bg-transparent cursor-default"
          onClick={() => {
            setPositionFilterOpen(false)
            setPlaystyleFilterOpen(false)
          }}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}
    </>
  )
}