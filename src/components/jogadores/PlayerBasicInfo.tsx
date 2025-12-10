import { Ruler } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PlayerBasicInfoProps {
  age?: number | null
  height?: number | null
  nationality: string
  preferred_foot: string | null
  alternative_positions?: string[] | null
}

export function PlayerBasicInfo({
  age,
  height,
  nationality,
  preferred_foot,
  alternative_positions
}: PlayerBasicInfoProps) {
  const formatHeight = (height: number | null | undefined) => {
    if (height === null || height === undefined) return '-'
    return `${height}cm`
  }

  return (
    <>
      {/* Linha 1: básicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 text-xs lg:text-sm">
        <div>
          <span className="text-zinc-500">Idade:</span> <strong>{age ?? '-'}</strong>
        </div>
        <div>
          <span className="text-zinc-500 flex items-center gap-2">
            <Ruler className="w-3 h-3 lg:w-4 lg:h-4" />
            Altura: <strong className="ml-1 lg:ml-2">{formatHeight(height)}</strong>
          </span> 
        </div>
        <div>
          <span className="text-zinc-500">Nacionalidade:</span> <strong>{nationality}</strong>
        </div>
        <div>
          <span className="text-zinc-500">Pé:</span> <strong>{preferred_foot}</strong>
        </div>
      </div>

      {/* Posições alternativas */}
      {alternative_positions && alternative_positions.length > 0 && (
        <div>
          <p className="text-zinc-500 font-medium mb-2">Posições Alternativas:</p>
          <div className="flex gap-2 flex-wrap">
            {alternative_positions.map(p => (
              <Badge key={p} className="bg-red-600/20 text-red-300 border-red-600/40 text-xs">{p}</Badge>
            ))}
          </div>
        </div>
      )}
    </>
  )
}