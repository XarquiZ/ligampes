import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CheckCircle2, MessageSquare, BarChart2, Bell } from 'lucide-react'
import { Announcement } from '@/hooks/useInbox'

interface InboxModalProps {
    isOpen: boolean
    onClose: () => void
    announcements: Announcement[]
    onMarkAsRead: (id: string) => Promise<void>
    onVote: (annId: string, optId: string) => Promise<void>
}

export default function InboxModal({
    isOpen,
    onClose,
    announcements,
    onMarkAsRead,
    onVote
}: InboxModalProps) {

    const [selectedVote, setSelectedVote] = useState<Record<string, string>>({})

    const handleVoteSubmit = async (announcementId: string) => {
        const optionId = selectedVote[announcementId]
        if (!optionId) return
        await onVote(announcementId, optionId)
    }

    // Ordenar: Não lidos primeiro, depois por data
    const sortedAnnouncements = [...announcements].sort((a, b) => {
        if (a.read === b.read) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return a.read ? 1 : -1
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Bell className="text-purple-500" />
                        Caixa de Entrada
                        <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-300">
                            {announcements.filter(a => !a.read).length} não lidas
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {sortedAnnouncements.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma mensagem no momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedAnnouncements.map(ann => (
                                <div
                                    key={ann.id}
                                    className={`
                    rounded-xl border p-5 transition-all
                    ${ann.read
                                            ? 'bg-zinc-900/30 border-zinc-800/50 opacity-75 hover:opacity-100'
                                            : 'bg-zinc-900 border-purple-500/30 shadow-lg shadow-purple-500/5'}
                  `}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-3 items-center">
                                            <div className={`p-2 rounded-full ${ann.type === 'poll' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                {ann.type === 'poll' ? <BarChart2 size={18} /> : <MessageSquare size={18} />}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${ann.read ? 'text-zinc-300' : 'text-white'}`}>
                                                    {ann.title}
                                                </h3>
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(ann.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        {ann.read && (
                                            <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 gap-1">
                                                <CheckCircle2 size={12} /> Lida
                                            </Badge>
                                        )}
                                        {!ann.read && ann.priority && (
                                            <Badge variant="destructive" className="animate-pulse">Importante</Badge>
                                        )}
                                    </div>

                                    <div className="prose prose-invert max-w-none text-zinc-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                                        {ann.content}
                                    </div>

                                    {/* AREA DE AÇÃO */}
                                    {ann.type === 'announcement' && !ann.read && (
                                        <Button
                                            onClick={() => onMarkAsRead(ann.id)}
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                                            size="sm"
                                        >
                                            Marcar como lida
                                        </Button>
                                    )}

                                    {ann.type === 'poll' && (
                                        <div className="pl-4 border-l-2 border-zinc-800">
                                            {ann.read && ann.voted_option_id ? (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-bold">Seu Voto:</p>
                                                    {ann.poll_options?.map(opt => (
                                                        <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border ${opt.id === ann.voted_option_id ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'border-transparent opacity-50'}`}>
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${opt.id === ann.voted_option_id ? 'border-green-500' : 'border-zinc-600'}`}>
                                                                {opt.id === ann.voted_option_id && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                                                            </div>
                                                            <span>{opt.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <RadioGroup value={selectedVote[ann.id]} onValueChange={(val) => setSelectedVote({ ...selectedVote, [ann.id]: val })}>
                                                        {ann.poll_options?.map(opt => (
                                                            <div key={opt.id} className={`flex items-center space-x-2 p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 transition-colors ${selectedVote[ann.id] === opt.id ? 'border-purple-500/50 bg-purple-500/10' : ''}`}>
                                                                <RadioGroupItem value={opt.id} id={opt.id} className="border-zinc-500 text-purple-500" />
                                                                <Label htmlFor={opt.id} className="flex-1 cursor-pointer text-zinc-300">{opt.label}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                    <Button
                                                        onClick={() => handleVoteSubmit(ann.id)}
                                                        disabled={!selectedVote[ann.id]}
                                                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        Votar
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
