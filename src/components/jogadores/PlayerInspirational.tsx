import { Star } from 'lucide-react'
import { LevelBars } from './LevelBars'
import { cn } from '@/lib/utils'

interface PlayerInspirationalProps {
  weak_foot_usage?: number | null
  weak_foot_accuracy?: number | null
  form?: number | null
  injury_resistance?: number | null
  inspiring_ball_carry?: number | null
  inspiring_low_pass?: number | null
  inspiring_lofted_pass?: number | null
}

export function PlayerInspirational({
  weak_foot_usage,
  weak_foot_accuracy,
  form,
  injury_resistance,
  inspiring_ball_carry,
  inspiring_low_pass,
  inspiring_lofted_pass
}: PlayerInspirationalProps) {
  return (
    <>
      {/* Pé fraco, Frequência, Forma física e Resistência a Lesão */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 text-xs lg:text-sm items-center">
        <div>
          <p className="text-zinc-500">Pé Fraco (Uso)</p>
          <div className="flex items-center gap-2 lg:gap-3">
            <LevelBars value={weak_foot_usage ?? 0} max={4} size="sm" />
            <span className="font-bold text-zinc-100">{weak_foot_usage ?? '-'}</span>
          </div>
        </div>

        <div>
          <p className="text-zinc-500">Pé Fraco (Precisão)</p>
          <div className="flex items-center gap-2 lg:gap-3">
            <LevelBars value={weak_foot_accuracy ?? 0} max={4} size="sm" />
            <span className="font-bold text-zinc-100">{weak_foot_accuracy ?? '-'}</span>
          </div>
        </div>

        <div>
          <p className="text-zinc-500">Forma Física</p>
          <div className="flex items-center gap-2 lg:gap-3">
            <LevelBars value={form ?? 0} max={8} size="md" />
            <span className="font-bold text-zinc-100">{form ?? '-'}</span>
          </div>
        </div>

        <div>
          <p className="text-zinc-500">Resistência a Lesão</p>
          <div className="flex items-center gap-2 lg:gap-3">
            <LevelBars value={injury_resistance ?? 0} max={3} size="sm" />
            <span className="font-bold text-zinc-100">{injury_resistance ?? '-'}</span>
          </div>
        </div>
      </div>

      {/* Inspirador */}
      <div>
        <p className="text-zinc-500 font-medium mb-2">Inspirador</p>
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="text-xs lg:text-sm">
            <div className="text-zinc-400">Carregando</div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 2 }).map((_, idx) => {
                const filled = (inspiring_ball_carry ?? 0) > idx
                return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
              })}
            </div>
          </div>

          <div className="text-xs lg:text-sm">
            <div className="text-zinc-400">Passe Rasteiro</div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 2 }).map((_, idx) => {
                const filled = (inspiring_low_pass ?? 0) > idx
                return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
              })}
            </div>
          </div>

          <div className="text-xs lg:text-sm">
            <div className="text-zinc-400">Passe Alto</div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 2 }).map((_, idx) => {
                const filled = (inspiring_lofted_pass ?? 0) > idx
                return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}