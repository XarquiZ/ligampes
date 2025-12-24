import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox' // Assuming we have this or use native
import { Plus, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AdminAnnouncementModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AdminAnnouncementModal({ isOpen, onClose }: AdminAnnouncementModalProps) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [type, setType] = useState<'announcement' | 'poll'>('announcement')
    const [targetType, setTargetType] = useState<'all' | 'division' | 'team'>('all')
    const [targetValue, setTargetValue] = useState('')
    const [priority, setPriority] = useState(false)

    // Poll options
    const [pollOptions, setPollOptions] = useState<string[]>(['', ''])

    // Teams for selection
    const [teams, setTeams] = useState<{ id: string, name: string }[]>([])

    useEffect(() => {
        if (isOpen && targetType === 'team') {
            const fetchTeams = async () => {
                const { data } = await supabase.from('teams').select('id, name').order('name')
                if (data) setTeams(data)
            }
            fetchTeams()
        }
    }, [isOpen, targetType])

    const handleAddOption = () => {
        setPollOptions([...pollOptions, ''])
    }

    const handleRemoveOption = (index: number) => {
        setPollOptions(pollOptions.filter((_, i) => i !== index))
    }

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...pollOptions]
        newOptions[index] = value
        setPollOptions(newOptions)
    }

    const handleSubmit = async () => {
        if (!title || !content) return alert('Preencha título e conteúdo')
        if (type === 'poll' && pollOptions.some(o => !o.trim())) return alert('Preencha todas as opções da enquete')

        setLoading(true)
        try {
            // 1. Create Announcement
            const { data: ann, error: annError } = await supabase
                .from('announcements')
                .insert({
                    title,
                    content,
                    type,
                    target_type: targetType,
                    target_value: targetType === 'all' ? null : targetValue,
                    priority
                })
                .select()
                .single()

            if (annError) throw annError

            // 2. Create Poll Options if needed
            if (type === 'poll' && ann) {
                const optionsToInsert = pollOptions.map(label => ({
                    announcement_id: ann.id,
                    label
                }))

                const { error: pollError } = await supabase
                    .from('poll_options')
                    .insert(optionsToInsert)

                if (pollError) throw pollError
            }

            alert('Comunicado enviado com sucesso!')
            onClose()
            // Reset form
            setTitle('')
            setContent('')
            setType('announcement')
            setTargetType('all')
            setTargetValue('')
            setPriority(false)
            setPollOptions(['', ''])

        } catch (error) {
            console.error('Erro ao enviar:', error)
            alert('Erro ao enviar comunicado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Comunicado</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Manutenção Programada"
                            className="bg-zinc-800 border-zinc-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Conteúdo</Label>
                        <Textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Digite a mensagem..."
                            className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="announcement">Aviso Geral</SelectItem>
                                    <SelectItem value="poll">Enquete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Prioridade</Label>
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="priority"
                                    checked={priority}
                                    onChange={e => setPriority(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="priority" className="text-sm text-zinc-400">
                                    Obrigatório (Popup)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Destinatário</Label>
                        <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Clubes</SelectItem>
                                <SelectItem value="division">Por Divisão</SelectItem>
                                <SelectItem value="team">Clube Específico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {targetType === 'division' && (
                        <div className="space-y-2">
                            <Label>Selecione a Divisão</Label>
                            <Select value={targetValue} onValueChange={setTargetValue}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Série A</SelectItem>
                                    <SelectItem value="B">Série B</SelectItem>
                                    <SelectItem value="C">Série C</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {targetType === 'team' && (
                        <div className="space-y-2">
                            <Label>Selecione o Clube</Label>
                            <Select value={targetValue} onValueChange={setTargetValue}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue placeholder="Selecione o time..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                    {teams.map(team => (
                                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {type === 'poll' && (
                        <div className="space-y-2 border-t border-zinc-800 pt-4">
                            <Label>Opções da Enquete</Label>
                            {pollOptions.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={option}
                                        onChange={e => handleOptionChange(index, e.target.value)}
                                        placeholder={`Opção ${index + 1}`}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                    {pollOptions.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveOption(index)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <X size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddOption}
                                className="w-full border-dashed border-zinc-700 hover:bg-zinc-800"
                            >
                                <Plus size={16} className="mr-2" /> Adicionar Opção
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Enviar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
