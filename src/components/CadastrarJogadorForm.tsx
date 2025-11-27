'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, Control } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  AlertCircle,
  Goal,
  Zap,
  Scale,
  Shield,
  Circle,
  Star,
  ListChecks,
  ChevronsUpDown,
  Check,
  Loader2,
  Ruler,
  Target,
} from 'lucide-react'
import { supabase } from "@/lib/supabase"

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

// ===========================================================================
// DADOS ESTÁTICOS
// ===========================================================================

interface Team { id: string; name: string; logo_url: string | null }

const OVERALL_VALUE_MAP = [
  { ovr: 85, value: 170_000_000 }, { ovr: 84, value: 150_000_000 }, { ovr: 83, value: 130_000_000 },
  { ovr: 82, value: 110_000_000 }, { ovr: 81, value: 95_000_000 },  { ovr: 80, value: 85_000_000 },
  { ovr: 79, value: 70_000_000 },  { ovr: 78, value: 55_000_000 },  { ovr: 77, value: 40_000_000 },
  { ovr: 76, value: 30_000_000 },  { ovr: 75, value: 25_000_000 },  { ovr: 74, value: 15_000_000 },
  { ovr: 73, value: 12_000_000 },  { ovr: 72, value: 8_000_000 },   { ovr: 71, value: 6_000_000 },
  { ovr: 70, value: 4_000_000 },   { ovr: 0,   value: 1_000 },
]

const calculateBasePrice = (ovr: number) => OVERALL_VALUE_MAP.find(e => ovr >= e.ovr)?.value || 1_000

// Posições OBRIGATÓRIAS (sem "Nenhum")
const POSITIONS = ['GO', 'ZC', 'LE', 'LD', 'VOL', 'MLG', 'MAT', 'SA','MLE','MLD', 'PTE', 'PTD', 'CA'] as const
const ALT_POS = ['GO', 'ZC', 'LE', 'LD', 'VOL', 'MLG', 'MAT', 'SA','MLE','MLD', 'PTE', 'PTD', 'CA'] as const
const PREFERRED_FOOT = ['Direito', 'Esquerdo', 'Ambos', 'Nenhum'] as const
const PLAYSTYLES = ['Artilheiro', 'Armador criativo', 'Atacante surpresa', 'Clássica nº 10', 'Especialista em cruz.', 'Goleiro defensivo', 'Goleiro ofensivo', 'Homem de área', 'Jog. de infiltração', 'Jog. de Lado de Campo', 'Lateral móvel', 'Meia versátil', 'Nenhum', 'Orquestrador', 'Pivô', 'Ponta velocista', 'Primeiro volante', 'Provocador', 'Puxa marcação', 'Volantão', 'Zagueiro defensivo', 'Zagueiro ofensivo'] as const;
const SKILLS = ['360 graus', 'Afastamento acrobático', 'Arremesso lateral longo', 'Arremesso longo do GO', 'Cabeçada', 'Chapéu', 'Chute ascendente', 'Chute com o peito do pé', 'Chute de longe', 'Chute de primeira', 'Controle da cavadinha', 'Controle de domínio', 'Corte de calcanhar', 'Cruzamento preciso', 'Curva para fora', 'De letra', 'Elástico', 'Especialista em Pênaltis', 'Espírito guerreiro', 'Finalização acrobática', 'Finta de letra', 'Folha seca', 'Interceptação', 'Liderança', 'Malícia', 'Marcação individual', 'Passe aéreo baixo', 'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Pedalada simples', 'Pegador de pênaltis', 'Precisão à distância', 'Puxada de letra', 'Reposição alta do GO', 'Reposição baixa do GO', 'Super substituto', 'Toque de calcanhar', 'Toque duplo', 'Volta para marcar'] as const
const NATIONALITIES = ['Angola', 'Argentina', 'Bolívia', 'Brasil', 'Chile', 'Colômbia', 'Coreia do Sul', 'Costa do Marfim', 'Costa Rica', 'Dinamarca', 'Equador', 'Espanha', 'França', 'Gâmbia', 'Guiné', 'Holanda', 'Itália', 'México', 'Paraguai', 'Peru', 'Portugal', 'República do Congo', 'Senegal', 'Suíça', 'Uruguai', 'Venezuela', 'Desconhecida'] as const

// Alturas de 1,40m até 2,30m (140cm até 230cm)
const HEIGHT_OPTIONS = Array.from({ length: 91 }, (_, i) => {
  const height = 140 + i;
  return {
    value: height,
    label: `${height}cm (${(height / 100).toFixed(2)}m)`
  };
});

// ===========================================================================
// SCHEMA — NOME E POSIÇÃO OBRIGATÓRIOS
// ===========================================================================

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório e deve ter pelo menos 2 caracteres"),
  position: z.enum(POSITIONS, { required_error: "Selecione uma posição" }),
  overall: z.coerce.number().min(0).max(99),
  age: z.coerce.number().min(15).max(45).nullable().optional(),
  height: z.coerce.number().min(140).max(230).nullable().optional(), // NOVO CAMPO
  nationality: z.string().nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  photo_url: z.string().url().nullable().optional().or(z.literal('')),

  offensive_talent: z.coerce.number().min(0).max(99).nullable().optional(),
  ball_control: z.coerce.number().min(0).max(99).nullable().optional(),
  dribbling: z.coerce.number().min(0).max(99).nullable().optional(),
  tight_possession: z.coerce.number().min(0).max(99).nullable().optional(),
  low_pass: z.coerce.number().min(0).max(99).nullable().optional(),
  lofted_pass: z.coerce.number().min(0).max(99).nullable().optional(),
  finishing: z.coerce.number().min(0).max(99).nullable().optional(),
  heading: z.coerce.number().min(0).max(99).nullable().optional(),
  place_kicking: z.coerce.number().min(0).max(99).nullable().optional(),
  curl: z.coerce.number().min(0).max(99).nullable().optional(),
  speed: z.coerce.number().min(0).max(99).nullable().optional(),
  acceleration: z.coerce.number().min(0).max(99).nullable().optional(),
  kicking_power: z.coerce.number().min(0).max(99).nullable().optional(),
  jump: z.coerce.number().min(0).max(99).nullable().optional(),
  physical_contact: z.coerce.number().min(0).max(99).nullable().optional(),
  balance: z.coerce.number().min(0).max(99).nullable().optional(),
  stamina: z.coerce.number().min(0).max(99).nullable().optional(),
  defensive_awareness: z.coerce.number().min(0).max(99).nullable().optional(),
  ball_winning: z.coerce.number().min(0).max(99).nullable().optional(),
  aggression: z.coerce.number().min(0).max(99).nullable().optional(),
  gk_awareness: z.coerce.number().min(0).max(99).nullable().optional(),
  gk_catching: z.coerce.number().min(0).max(99).nullable().optional(),
  gk_clearing: z.coerce.number().min(0).max(99).nullable().optional(),
  gk_reflexes: z.coerce.number().min(0).max(99).nullable().optional(),
  gk_reach: z.coerce.number().min(0).max(99).nullable().optional(),

  weak_foot_usage: z.coerce.number().min(1).max(4).optional(),
  weak_foot_accuracy: z.coerce.number().min(1).max(4).optional(),
  form: z.coerce.number().min(1).max(8).optional(),
  injury_resistance: z.coerce.number().min(1).max(3).optional(),

  preferred_foot: z.enum(PREFERRED_FOOT).nullable().optional(),
  playstyle: z.enum(PLAYSTYLES).nullable().optional(),
  alternative_positions: z.array(z.enum(ALT_POS)).nullable().optional(),
  skills: z.array(z.enum(SKILLS)).nullable().optional(),

  inspiring_ball_carry: z.coerce.number().min(0).max(2).nullable().optional(),
  inspiring_low_pass: z.coerce.number().min(0).max(2).nullable().optional(),
  inspiring_lofted_pass: z.coerce.number().min(0).max(2).nullable().optional(),

  // NOVO CAMPO
  is_penalty_specialist: z.boolean().default(false).optional(),
})

type PlayerFormValues = z.infer<typeof formSchema>

interface CadastrarJogadorFormProps {
  playerToEdit?: (PlayerFormValues & { id: string }) | null
  onPlayerAdded: () => void
}

// ===========================================================================
// COMPONENTES AUXILIARES
// ===========================================================================

const Attr = ({ control, name, label }: { control: Control<PlayerFormValues>; name: keyof PlayerFormValues; label: string }) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-xs text-zinc-400">{label}</FormLabel>
        <FormControl>
          <Input
            type="number"
            min={0}
            max={99}
            placeholder="—"
            className="h-11 text-center text-base bg-zinc-800/70 border-zinc-700 text-white"
            {...field}
            value={field.value ?? ''}
            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
          />
        </FormControl>
      </FormItem>
    )}
  />
)

const Insp = ({ control, name, label }: { control: Control<PlayerFormValues>; name: keyof PlayerFormValues; label: string }) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-sm font-medium text-zinc-300">{label}</FormLabel>
        <Select onValueChange={v => field.onChange(v === '0' ? null : Number(v))} value={String(field.value ?? 0)}>
          <FormControl>
            <SelectTrigger className="h-11 bg-zinc-800/70 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="0">0 estrelas</SelectItem>
            <SelectItem value="1"><Star className="w-4 h-4 inline fill-yellow-400" /> 1 estrela</SelectItem>
            <SelectItem value="2"><Star className="w-4 h-4 inline fill-yellow-400" /> 2 estrelas</SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
    )}
  />
)

const MultiSelect = ({ control, name, label, options, placeholder, Icon }: any) => {
  const [open, setOpen] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : []
        return (
          <FormItem>
            <FormLabel className="text-lg font-semibold flex items-center gap-3 text-white">
              <Icon className="w-6 h-6 text-purple-400" />
              {label}
            </FormLabel>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(!open)}
                className="w-full justify-between h-12 bg-zinc-800/70 border-zinc-700 text-left text-white hover:bg-zinc-700"
              >
                <div className="flex flex-wrap gap-1.5">
                  {selected.length > 0 ? selected.map(v => <Badge key={v} className="bg-purple-600 text-xs">{v}</Badge>) : <span className="text-zinc-500">{placeholder}</span>}
                </div>
                <ChevronsUpDown className="w-4 h-4 opacity-60" />
              </Button>

              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute top-full mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {options.map((opt: string) => {
                        const checked = selected.includes(opt)
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const newVal = checked ? selected.filter(x => x !== opt) : [...selected, opt]
                              field.onChange(newVal.length ? newVal : null)
                            }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition text-left",
                              checked ? "bg-purple-600/30 border border-purple-500" : "hover:bg-zinc-800"
                            )}
                          >
                            <div className={`w-5 h-5 rounded border ${checked ? "bg-purple-600 border-purple-600" : "border-zinc-500"} flex items-center justify-center`}>
                              {checked && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span>{opt}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </FormItem>
        )
      }}
    />
  )
}

// ===========================================================================
// COMPONENTE PRINCIPAL
// ===========================================================================

export function CadastrarJogadorForm({ playerToEdit, onPlayerAdded }: CadastrarJogadorFormProps) {

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])

  const isEditMode = !!playerToEdit

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: playerToEdit ? {
      ...playerToEdit,
      team_id: playerToEdit.team_id || null,
      photo_url: playerToEdit.photo_url || '',
      alternative_positions: playerToEdit.alternative_positions || null,
      skills: playerToEdit.skills || null,
      preferred_foot: playerToEdit.preferred_foot || "Nenhum",
      playstyle: playerToEdit.playstyle || "Nenhum",
      nationality: playerToEdit.nationality || "Desconhecida",
      age: playerToEdit.age || null,
      height: playerToEdit.height || null, // NOVO
      is_penalty_specialist: playerToEdit.is_penalty_specialist || false, // NOVO
    } : {
      name: "",
      position: undefined as any, // obrigatório
      overall: 75,
      age: null,
      height: null, // NOVO
      nationality: "Desconhecida",
      team_id: null,
      photo_url: "",
      preferred_foot: "Nenhum",
      playstyle: "Nenhum",
      is_penalty_specialist: false, // NOVO
      weak_foot_usage: 2,
      weak_foot_accuracy: 2,
      form: 5,
      injury_resistance: 2,
      alternative_positions: null,
      skills: null,
      inspiring_ball_carry: 0,
      inspiring_low_pass: 0,
      inspiring_lofted_pass: 0,
    },
  })

  const overall = form.watch('overall') || 0
  const basePrice = useMemo(() => calculateBasePrice(overall), [overall])
  const position = form.watch('position')
  const isGK = position === 'GO'

  useEffect(() => {
    supabase.from('teams').select('id, name, logo_url').order('name').then(({ data }) => {
      if (data) setTeams(data as Team[])
    })
  }, [supabase])

  const onSubmit = async (values: PlayerFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const clean = (v: any) => (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) ? null : v

    const data = {
      ...values,
      team_id: clean(values.team_id),
      photo_url: clean(values.photo_url),
      alternative_positions: clean(values.alternative_positions),
      skills: clean(values.skills),
      preferred_foot: values.preferred_foot === 'Nenhum' ? null : values.preferred_foot,
      playstyle: values.playstyle === 'Nenhum' ? null : values.playstyle,
      nationality: values.nationality === 'Desconhecida' ? null : values.nationality,
      height: clean(values.height), // NOVO
      is_penalty_specialist: values.is_penalty_specialist, // NOVO
      base_price: basePrice,
    }

    try {
      if (isEditMode) {
        const { error: updError } = await supabase.from('players').update(data).eq('id', playerToEdit!.id)
        if (updError) throw updError
      } else {
        const { error: insError } = await supabase.from('players').insert(data)
        if (insError) throw insError
      }
      form.reset()
      onPlayerAdded()
    } catch (e: any) {
      setError(e.message || "Erro ao salvar jogador")
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-10 pb-20">
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-600 rounded-xl flex items-center gap-3 text-red-300">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-14 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <TabsTrigger value="general" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-l-xl">Gerais</TabsTrigger>
              <TabsTrigger value="attributes" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Atributos</TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-r-xl">Detalhes</TabsTrigger>
            </TabsList>

            {/* GERAIS */}
            <TabsContent value="general" className="space-y-8 mt-8">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-bold text-white">
                    Nome Completo <Badge className="bg-red-600">Obrigatório</Badge>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Vinícius Júnior" className="h-14 text-lg bg-zinc-800/70 border-zinc-700 text-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">
                      Posição <Badge className="bg-red-600">Obrigatório</Badge>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-zinc-800/70 border-zinc-700 text-white">
                          <SelectValue placeholder="Selecione uma posição" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POSITIONS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* NOVO CAMPO - ALTURA */}
                <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-purple-400" />
                      Altura
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)} 
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-zinc-800/70 border-zinc-700 text-white">
                          <SelectValue placeholder="Selecione a altura" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {HEIGHT_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={String(value)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="overall" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Overall</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={99} className="h-12 text-3xl font-bold text-center bg-zinc-800/70 border-zinc-700 text-white"
                        {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Idade</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" className="h-12 bg-zinc-800/70 border-zinc-700 text-white"
                        {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="team_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Clube Atual</FormLabel>
                    <Select onValueChange={v => field.onChange(v === 'none' ? null : v)} value={field.value ?? 'none'}>
                      <FormControl><SelectTrigger className="h-12 bg-zinc-800/70 border-zinc-700 text-white"><SelectValue placeholder="Sem clube" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem Clube</SelectItem>
                        {teams.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-3">
                              {t.logo_url && <img src={t.logo_url} alt="" className="w-6 h-6 rounded" onError={e => (e.target as any).style.display='none'} />}
                              {t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="nationality" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Nacionalidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "Desconhecida"}>
                      <FormControl><SelectTrigger className="h-12 bg-zinc-800/70 border-zinc-700 text-white"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="p-6 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl border border-purple-700 text-center">
                <p className="text-purple-300 text-lg">Valor Base Calculado</p>
                <p className="text-4xl font-black text-white mt-2">R$ {basePrice.toLocaleString('pt-BR')}</p>
              </div>

              <FormField control={form.control} name="photo_url" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-white">URL da Foto (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." className="h-12 bg-zinc-800/70 border-zinc-700 text-white" {...field} value={field.value || ''} />
                  </FormControl>
                </FormItem>
              )} />
            </TabsContent>

            {/* ATRIBUTOS */}
            <TabsContent value="attributes" className="space-y-12 mt-8">
              <section>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 mb-8"><Goal className="w-10 h-10" /> Ataque & Técnica</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Attr control={form.control} name="offensive_talent" label="Talento Ofensivo" />
                  <Attr control={form.control} name="ball_control" label="Controle de Bola" />
                  <Attr control={form.control} name="dribbling" label="Drible" />
                  <Attr control={form.control} name="tight_possession" label="Condução Firme" />
                  <Attr control={form.control} name="finishing" label="Finalização" />
                  <Attr control={form.control} name="heading" label="Cabeceio" />
                  <Attr control={form.control} name="place_kicking" label="Chute Colocado" />
                  <Attr control={form.control} name="curl" label="Curva" />
                </div>
              </section>

              <section>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 mb-8"><Zap className="w-10 h-10" /> Passes & Força</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Attr control={form.control} name="low_pass" label="Passe Rasteiro" />
                  <Attr control={form.control} name="lofted_pass" label="Passe Alto" />
                  <Attr control={form.control} name="kicking_power" label="Força do Chute" />
                </div>
              </section>

              <section>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 mb-8"><Scale className="w-10 h-10" /> Físico</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Attr control={form.control} name="speed" label="Velocidade" />
                  <Attr control={form.control} name="acceleration" label="Aceleração" />
                  <Attr control={form.control} name="stamina" label="Resistência" />
                  <Attr control={form.control} name="jump" label="Impulsão" />
                  <Attr control={form.control} name="physical_contact" label="Contato Físico" />
                  <Attr control={form.control} name="balance" label="Equilíbrio" />
                </div>
              </section>

              <section>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 mb-8"><Shield className="w-10 h-10" /> Defesa</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Attr control={form.control} name="defensive_awareness" label="Talento Defensivo" />
                  <Attr control={form.control} name="ball_winning" label="Desarme" />
                  <Attr control={form.control} name="aggression" label="Agressividade" />
                </div>
              </section>

              <section>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 mb-8">
                  <Circle className="w-10 h-10" /> Goleiro {isGK && <span className="text-yellow-400 text-lg">(apenas GO)</span>}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <Attr control={form.control} name="gk_awareness" label="Talento de GO" />
                  <Attr control={form.control} name="gk_catching" label="Firmeza de GO" />
                  <Attr control={form.control} name="gk_clearing" label="Afast. de bola de GO" />
                  <Attr control={form.control} name="gk_reflexes" label="Reflexos de GO" />
                  <Attr control={form.control} name="gk_reach" label="Alcance de GO" />
                </div>
              </section>
            </TabsContent>

            {/* DETALHES & SKILLS */}
            <TabsContent value="details" className="space-y-12 mt-8">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FormField control={form.control} name="preferred_foot" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Pé Preferido</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "Nenhum"}>
                      <FormControl><SelectTrigger className="h-12 bg-zinc-800/70 border-zinc-700 text-white"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{PREFERRED_FOOT.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="playstyle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Estilo de Jogo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "Nenhum"}>
                      <FormControl><SelectTrigger className="h-12 bg-zinc-800/70 border-zinc-700 text-white"><SelectValue placeholder="Nenhum" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-64">{PLAYSTYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="weak_foot_usage" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Pior pé (Frequência)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={4} className="h-12 text-center bg-zinc-800/70 border-zinc-700 text-white"
                        {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="weak_foot_accuracy" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Pior pé (Precisão)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={4} className="h-12 text-center bg-zinc-800/70 border-zinc-700 text-white"
                        {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="form" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Forma Física</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={8} className="h-12 text-center bg-zinc-800/70 border-zinc-700 text-white"
                        {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="injury_resistance" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-white">Res. Lesão</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={3} className="h-12 text-center bg-zinc-800/70 border-zinc-700 text-white"
                        {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <section>
                <h3 className="text-3xl font-black text-yellow-400 flex items-center gap-4 mb-8"><Star className="w-12 h-12 fill-yellow-400" /> Inspirador</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Insp control={form.control} name="inspiring_ball_carry" label="Carregando a Bola" />
                  <Insp control={form.control} name="inspiring_low_pass" label="Passe Rasteiro" />
                  <Insp control={form.control} name="inspiring_lofted_pass" label="Passe Alto" />
                </div>
              </section>

              <section className="space-y-8">
                <MultiSelect control={form.control} name="alternative_positions" label="Posições Alternativas" options={ALT_POS} placeholder="Nenhuma selecionada" Icon={ChevronsUpDown} />
                <MultiSelect control={form.control} name="skills" label="Habilidades Especiais" options={SKILLS} placeholder="Nenhuma habilidade" Icon={ListChecks} />
              </section>
            </TabsContent>
          </Tabs>

          {/* BOTÃO LINDO E PADRONIZADO */}
          <div className="pt-8 border-t border-zinc-800">
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className={cn(
                "w-full h-14 text-lg font-bold rounded-2xl transition-all shadow-lg",
                form.formState.isValid
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  {isEditMode ? "SALVANDO..." : "CADASTRANDO..."}
                </>
              ) : (
                isEditMode ? "SALVAR ALTERAÇÕES" : "CADASTRAR JOGADOR"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}