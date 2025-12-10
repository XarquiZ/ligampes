import { Badge } from '@/components/ui/badge'

interface PlayerSkillsProps {
  skills?: string[] | null
}

export function PlayerSkills({ skills }: PlayerSkillsProps) {
  if (!skills || skills.length === 0) return null

  return (
    <div>
      <p className="text-zinc-400 font-medium mb-2">Habilidades Especiais</p>
      <div className="flex flex-wrap gap-2">
        {skills.map(s => (
          <Badge key={s} className="bg-purple-600/20 text-purple-300 border-purple-600/40 text-xs">{s}</Badge>
        ))}
      </div>
    </div>
  )
}