'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Plus, GripVertical, AlertTriangle, CheckCircle, Ban, Target, Trophy, Clock, MessageCircle, Gamepad2, ScrollText } from 'lucide-react';
import { updateOrganizationRules } from '@/app/[site]/dashboard/informacoes/actions';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Rule {
    id: string;
    title: string;
    content: string;
    color: string;
    icon: string;
}

interface RulesEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRules: Rule[];
}

const COLORS = [
    { value: 'indigo', label: 'Indigo' },
    { value: 'green', label: 'Verde' },
    { value: 'red', label: 'Vermelho' },
    { value: 'yellow', label: 'Amarelo' },
    { value: 'blue', label: 'Azul' },
    { value: 'orange', label: 'Laranja' },
    { value: 'purple', label: 'Roxo' },
    { value: 'pink', label: 'Rosa' },
];

const ICONS = [
    { value: 'ScrollText', label: 'Texto', icon: ScrollText },
    { value: 'AlertTriangle', label: 'Alerta', icon: AlertTriangle },
    { value: 'Ban', label: 'Proibido', icon: Ban },
    { value: 'CheckCircle', label: 'Sucesso', icon: CheckCircle },
    { value: 'Target', label: 'Alvo', icon: Target },
    { value: 'Trophy', label: 'Troféu', icon: Trophy },
    { value: 'Clock', label: 'Relógio', icon: Clock },
    { value: 'MessageCircle', label: 'Mensagem', icon: MessageCircle },
    { value: 'Gamepad2', label: 'Game', icon: Gamepad2 },
];

export function RulesEditorModal({ isOpen, onClose, currentRules = [] }: RulesEditorModalProps) {
    const { organization } = useOrganization();
    const [rules, setRules] = useState<Rule[]>(currentRules.length > 0 ? currentRules : []);
    const [loading, setLoading] = useState(false);

    const handleAddRule = () => {
        const newRule: Rule = {
            id: crypto.randomUUID(),
            title: '',
            content: '',
            color: 'indigo',
            icon: 'ScrollText',
        };
        setRules([...rules, newRule]);
    };

    const handleRemoveRule = (id: string) => {
        setRules(rules.filter(rule => rule.id !== id));
    };

    const handleUpdateRule = (id: string, field: keyof Rule, value: string) => {
        setRules(rules.map(rule => rule.id === id ? { ...rule, [field]: value } : rule));
    };

    const handleSave = async () => {
        if (!organization?.id) return;
        setLoading(true);

        try {
            const result = await updateOrganizationRules(organization.id, rules);
            if (result.success) {
                onClose();
            } else {
                alert('Erro ao salvar regras: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar regras');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b border-zinc-800 bg-zinc-900 z-10">
                    <DialogTitle>Editar Regras da Liga</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Adicione, edite ou remova as regras que aparecerão na aba "Regras".
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {rules.length === 0 ? (
                        <div className="text-center py-10 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                            Nenhuma regra definida ainda.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {rules.map((rule, index) => (
                                <div key={rule.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 space-y-4 group transition-all hover:border-zinc-600">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 bg-zinc-900/50 px-2 py-1 rounded text-xs text-zinc-500 font-mono">
                                            #{index + 1}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveRule(rule.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-zinc-400">Título</label>
                                            <Input
                                                value={rule.title}
                                                onChange={e => handleUpdateRule(rule.id, 'title', e.target.value)}
                                                placeholder="Ex: Respeito Mútuo"
                                                className="bg-zinc-900 border-zinc-700 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-400">Cor do Card</label>
                                                <Select value={rule.color} onValueChange={val => handleUpdateRule(rule.id, 'color', val)}>
                                                    <SelectTrigger className="bg-zinc-900 border-zinc-700 h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-700">
                                                        {COLORS.map(c => (
                                                            <SelectItem key={c.value} value={c.value} className="text-zinc-300 focus:bg-zinc-800 cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-3 h-3 rounded-full bg-${c.value}-500`} />
                                                                    {c.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-400">Ícone</label>
                                                <Select value={rule.icon} onValueChange={val => handleUpdateRule(rule.id, 'icon', val)}>
                                                    <SelectTrigger className="bg-zinc-900 border-zinc-700 h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-700">
                                                        {ICONS.map(i => {
                                                            const IconComp = i.icon;
                                                            return (
                                                                <SelectItem key={i.value} value={i.value} className="text-zinc-300 focus:bg-zinc-800 cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <IconComp className="w-4 h-4" />
                                                                        {i.label}
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-400">Conteúdo / Descrição</label>
                                        <Textarea
                                            value={rule.content}
                                            onChange={e => handleUpdateRule(rule.id, 'content', e.target.value)}
                                            placeholder="Descreva a regra detalhadamente..."
                                            className="bg-zinc-900 border-zinc-700 min-h-[100px] focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        onClick={handleAddRule}
                        variant="outline"
                        className="w-full border-dashed border-zinc-700 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 py-8"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Adicionar Nova Regra
                    </Button>
                </div>

                <DialogFooter className="p-6 border-t border-zinc-800 bg-zinc-900 z-10">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-zinc-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
