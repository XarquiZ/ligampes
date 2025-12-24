import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CheckCircle2, MessageSquare, BarChart2, Bell, AlertTriangle, ArrowLeft, Mail, ChevronRight } from 'lucide-react'
import { Announcement } from '@/hooks/useInbox'
import { supabase } from '@/lib/supabase'

interface InboxModalProps {
    isOpen: boolean
    onClose: () => void
    announcements: Announcement[]
    onMarkAsRead: (id: string) => Promise<void>
    onVote: (annId: string, optId: string) => Promise<void>
    preventClose?: boolean
}

interface PollResult {
    option_id: string
    vote_count: number
}

function PollResultView({ announcement }: { announcement: Announcement }) {
    const [results, setResults] = useState<PollResult[] | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchResults = async () => {
            const { data, error } = await supabase.rpc('get_poll_results', { announcement_id_param: announcement.id })
            if (!error) setResults(data)
            setLoading(false)
        }
        fetchResults()
    }, [announcement.id])

    if (loading) return <div className="text-sm text-zinc-500 py-2">Carregando resultados...</div>

    const totalVotes = results?.reduce((acc, curr) => acc + curr.vote_count, 0) || 0

    return (
        <div className="space-y-3 mt-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 animate-in fade-in duration-300">
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Resultados Parciais ({totalVotes} votos)</h4>
            {announcement.poll_options?.map(opt => {
                const voteData = results?.find(r => r.option_id === opt.id)
                const count = voteData?.vote_count || 0
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0

                return (
                    <div key={opt.id} className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>{opt.label}</span>
                            <span>{percentage}% ({count})</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-600 transition-all duration-500"
                                style={{ width: `${percentage}% ` }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function InboxModal({
    isOpen,
    onClose,
    announcements,
    onMarkAsRead,
    onVote,
    preventClose = false
}: InboxModalProps) {

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [selectedVote, setSelectedVote] = useState<Record<string, string>>({})
    const [showingResults, setShowingResults] = useState<Record<string, boolean>>({})

    // Auto-select first announcement if none selected
    useEffect(() => {
        if (isOpen && !selectedId && announcements.length > 0) {
            setSelectedId(announcements[0].id)
        }
    }, [isOpen, announcements, selectedId])

    const handleInteractOutside = (e: Event) => {
        if (preventClose) {
            e.preventDefault()
        }
    }

    const toggleResults = (id: string) => {
        setShowingResults(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleVoteSubmit = async (announcementId: string) => {
        const optionId = selectedVote[announcementId]
        if (!optionId) return

        await onVote(announcementId, optionId)

        // Auto-show results after voting
        setShowingResults(prev => ({ ...prev, [announcementId]: true }))
    }

    // Ordenar: Não lidos primeiro, depois por data
    const sortedAnnouncements = [...announcements].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority ? -1 : 1
        if (a.read === b.read) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return a.read ? 1 : -1
    })

    const selectedAnnouncement = announcements.find(a => a.id === selectedId)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && preventClose) return;
            if (!open) onClose();
        }}>
            <DialogContent
                className="max-w-[95vw] md:max-w-6xl h-[90vh] bg-zinc-950 border-zinc-800 text-white flex flex-col p-0 gap-0 overflow-hidden shadow-2xl shadow-purple-900/20"
                onInteractOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={!preventClose}
            >
                <DialogTitle className="sr-only">Caixa de Entrada</DialogTitle>

                <div className="flex h-full">
                    {/* SIDEBAR - LISTA DE EMAILS style */}
                    <div className={`
                        w-full md:w-[380px] border-r border-zinc-800 flex flex-col bg-zinc-900/50 min-h-0
                        ${selectedId ? 'hidden md:flex' : 'flex'}
                    `}>
                        <div className="p-5 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
                                        <Mail className="text-white h-4 w-4" />
                                    </div>
                                    Caixa de Entrada
                                </h2>
                                {preventClose && (
                                    <Badge variant="destructive" className="animate-pulse shadow-sm shadow-red-900/20">
                                        Ação Obrigatória
                                    </Badge>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar mensagens..."
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-2 pl-3 pr-8 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                                <div className="absolute right-3 top-2.5 text-zinc-500">
                                    <MessageSquare size={14} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500 font-medium">
                                <span className="text-zinc-300">{announcements.length}</span> mensagens
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span className="text-purple-400">{announcements.filter(a => !a.read).length}</span> não lidas
                            </div>
                        </div>

                        <ScrollArea className="flex-1 h-full">
                            <div className="p-3 space-y-2">
                                {sortedAnnouncements.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
                                        <Mail className="h-10 w-10 opacity-20" />
                                        <p className="text-sm">Sua caixa de entrada está vazia.</p>
                                    </div>
                                ) : (
                                    sortedAnnouncements.map(ann => (
                                        <button
                                            key={ann.id}
                                            onClick={() => setSelectedId(ann.id)}
                                            className={`
                                                w-full text-left p-4 rounded-xl text-sm transition-all border group relative overflow-hidden
                                                ${selectedId === ann.id
                                                    ? 'bg-zinc-800/80 border-purple-500/50 shadow-lg shadow-black/20'
                                                    : 'bg-zinc-900/20 border-transparent hover:bg-zinc-800/50 hover:border-zinc-800'
                                                }
                                                ${!ann.read ? 'bg-zinc-900/60 border-l-4 border-l-purple-500' : ''}
                                            `}
                                        >
                                            {selectedId === ann.id && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
                                            )}

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {ann.priority && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                                                        )}
                                                        <span className={`font-semibold truncate text-base ${ann.read ? 'text-zinc-400' : 'text-white'}`}>
                                                            {ann.title}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2 font-medium">
                                                        {new Date(ann.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>

                                                <p className={`text-xs line-clamp-2 leading-relaxed mb-2 ${ann.read ? 'text-zinc-500' : 'text-zinc-300'}`}>
                                                    {ann.content}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`
                                                        text-[10px] h-5 border-zinc-800 px-1.5
                                                        ${ann.type === 'poll' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-400'}
                                                    `}>
                                                        {ann.type === 'poll' ? <BarChart2 size={10} className="mr-1" /> : <MessageSquare size={10} className="mr-1" />}
                                                        {ann.type === 'poll' ? 'Enquete' : 'Aviso'}
                                                    </Badge>

                                                    {ann.read && ann.voted_option_id && (
                                                        <span className="flex items-center text-[10px] text-green-500 gap-1">
                                                            <CheckCircle2 size={10} />
                                                            Votado
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* CONTENT AREA */}
                    <div className={`
                        flex-1 flex-col bg-zinc-950 relative min-h-0
                        ${selectedId ? 'flex' : 'hidden md:flex'}
                    `}>
                        {/* Background Detail */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-zinc-950/0 to-zinc-950/0 pointer-events-none" />

                        {selectedAnnouncement ? (
                            <>
                                {/* Mobile Header to go back */}
                                <div className="md:hidden p-4 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} className="h-8 w-8 -ml-2 text-zinc-400">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="font-semibold text-sm">Voltar para Inbox</span>
                                </div>

                                <ScrollArea className="flex-1 h-full">
                                    <div className="max-w-3xl mx-auto p-6 md:p-10">
                                        {/* Header do Email Detalhado */}
                                        <div className="mb-8 relative">
                                            <div className="flex items-start justify-between gap-4 mb-6">
                                                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                                                    {selectedAnnouncement.title}
                                                </h1>
                                            </div>

                                            <div className="flex items-center gap-4 pb-8 border-b border-zinc-800">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner">
                                                    <Bell size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-white font-semibold text-base">Administração do Campeonato</span>
                                                        {selectedAnnouncement.priority && (
                                                            <Badge variant="destructive" className="h-5 text-[10px] px-1.5 ml-1">Alta Prioridade</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-sm text-zinc-400 gap-2">
                                                        <span>para todos os participantes</span>
                                                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                        <span>{new Date(selectedAnnouncement.created_at).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conteúdo */}
                                        <div className="prose prose-invert prose-lg max-w-none text-zinc-300 mb-10 leading-relaxed whitespace-pre-wrap font-light">
                                            {selectedAnnouncement.content}
                                        </div>

                                        {/* Área de Ação (Votação/Confirmação) */}
                                        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl shadow-black/40">
                                            <div className="bg-zinc-900/60 p-4 border-b border-zinc-800 flex items-center justify-between">
                                                <h3 className="font-semibold flex items-center gap-2 text-white">
                                                    {selectedAnnouncement.type === 'poll' ? (
                                                        <>
                                                            <BarChart2 className="w-4 h-4 text-purple-400" />
                                                            Enquete Oficial
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                                            Confirmação de Leitura
                                                        </>
                                                    )}
                                                </h3>
                                                {selectedAnnouncement.read && (
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                                        Concluído
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="p-6 md:p-8">
                                                {selectedAnnouncement.type === 'announcement' && (
                                                    <div className="flex flex-col items-center gap-6 py-2">
                                                        {!selectedAnnouncement.read ? (
                                                            <>
                                                                <p className="text-zinc-400 text-center max-w-md">
                                                                    Por favor, confirme que você leu e entendeu este comunicado para continuar utilizando a plataforma.
                                                                </p>
                                                                <Button
                                                                    onClick={() => onMarkAsRead(selectedAnnouncement.id)}
                                                                    className="w-full md:w-auto min-w-[240px] bg-white text-black hover:bg-zinc-200 font-semibold h-12 text-base shadow-lg shadow-white/10"
                                                                >
                                                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                                                    Marcar como lida
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
                                                                    <CheckCircle2 className="w-6 h-6" />
                                                                </div>
                                                                <p>Você marcou esta mensagem como lida em {new Date().toLocaleDateString('pt-BR')}.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedAnnouncement.type === 'poll' && (
                                                    <div className="space-y-6">
                                                        {selectedAnnouncement.read && selectedAnnouncement.voted_option_id ? (
                                                            // Modo Visualização (Já Votou)
                                                            <div className="space-y-6">
                                                                <p className="text-sm text-zinc-400 mb-4">
                                                                    Você já votou nesta enquete. Veja abaixo os resultados parciais da comunidade.
                                                                </p>

                                                                <div className="grid gap-3">
                                                                    {selectedAnnouncement.poll_options?.map(opt => (
                                                                        <div key={opt.id} className={`
                                                                            flex items-center gap-4 p-4 rounded-xl border transition-all
                                                                            ${opt.id === selectedAnnouncement.voted_option_id
                                                                                ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20'
                                                                                : 'border-zinc-800 bg-zinc-900/50 opacity-60'
                                                                            }
                                                                        `}>
                                                                            <div className={`
                                                                                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                                                                ${opt.id === selectedAnnouncement.voted_option_id ? 'border-green-500' : 'border-zinc-600'}
                                                                            `}>
                                                                                {opt.id === selectedAnnouncement.voted_option_id && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
                                                                            </div>
                                                                            <span className={`font-medium ${opt.id === selectedAnnouncement.voted_option_id ? 'text-green-400' : 'text-zinc-300'}`}>
                                                                                {opt.label}
                                                                            </span>
                                                                            {opt.id === selectedAnnouncement.voted_option_id && (
                                                                                <Badge className="ml-auto bg-green-500 text-black hover:bg-green-600">Seu Voto</Badge>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="pt-4 border-t border-zinc-800">
                                                                    {!showingResults[selectedAnnouncement.id] ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => toggleResults(selectedAnnouncement.id)}
                                                                            className="w-full h-12 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium"
                                                                        >
                                                                            <BarChart2 className="w-4 h-4 mr-2" />
                                                                            Ver Resultados Parciais
                                                                        </Button>
                                                                    ) : (
                                                                        <PollResultView announcement={selectedAnnouncement} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // Modo Votação
                                                            <div className="space-y-8">
                                                                <RadioGroup
                                                                    value={selectedVote[selectedAnnouncement.id]}
                                                                    onValueChange={(val) => setSelectedVote({ ...selectedVote, [selectedAnnouncement.id]: val })}
                                                                    className="grid gap-3"
                                                                >
                                                                    {selectedAnnouncement.poll_options?.map(opt => (
                                                                        <div key={opt.id}
                                                                            className={`
                                                                                relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer group
                                                                                ${selectedVote[selectedAnnouncement.id] === opt.id
                                                                                    ? 'border-purple-600 bg-purple-600/10 shadow-[0_0_20px_rgba(147,51,234,0.15)]'
                                                                                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700'
                                                                                }
                                                                            `}
                                                                            onClick={() => setSelectedVote({ ...selectedVote, [selectedAnnouncement.id]: opt.id })}
                                                                        >
                                                                            <RadioGroupItem value={opt.id} id={opt.id} className="border-zinc-500 text-purple-600 data-[state=checked]:border-purple-600 h-5 w-5" />
                                                                            <Label htmlFor={opt.id} className="flex-1 cursor-pointer text-zinc-200 font-medium text-base pl-2">{opt.label}</Label>
                                                                        </div>
                                                                    ))}
                                                                </RadioGroup>

                                                                <Button
                                                                    onClick={() => handleVoteSubmit(selectedAnnouncement.id)}
                                                                    disabled={!selectedVote[selectedAnnouncement.id]}
                                                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-14 text-lg rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
                                                                >
                                                                    Confirmar Voto
                                                                </Button>
                                                                <p className="text-center text-xs text-zinc-500">
                                                                    Seu voto é anônimo e não poderá ser alterado depois.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center bg-zinc-950/50">
                                <div className="w-24 h-24 rounded-full bg-zinc-900/80 flex items-center justify-center mb-6 shadow-xl shadow-black/20 border border-zinc-800">
                                    <Mail className="h-10 w-10 opacity-30 text-purple-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-zinc-300">Nenhuma mensagem selecionada</h3>
                                <p className="text-zinc-500 max-w-sm">
                                    Selecione uma mensagem da lista à esquerda para ler os detalhes e visualizar as opções disponíveis.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

