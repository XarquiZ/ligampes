"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateMatchesAction } from "@/app/[site]/dashboard/tabela/actions";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRouter } from "next/navigation";

export default function GenerateMatchesDialog() {
    const { organization } = useOrganization();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [division, setDivision] = useState("A");
    const [mode, setMode] = useState<"ida" | "ida_volta">("ida_volta");
    const [clearExisting, setClearExisting] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        if (!organization?.id) return;

        setLoading(true);
        try {
            const result = await generateMatchesAction({
                organizationId: organization.id,
                division,
                mode,
                clearExisting
            });

            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                // Dispatch event to force update Calendario if needed, though server action revalidates path usually
                window.dispatchEvent(new Event('match-updated'));
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao tentar gerar partidas.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 hover:text-yellow-400">
                    <Wand2 className="h-4 w-4" />
                    Gerar Partidas
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Gerador Automático de Partidas</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Crie automaticamente o calendário de jogos usando o sistema de rodízio (Round Robin).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    <div className="space-y-2">
                        <Label>Divisão</Label>
                        <Select value={division} onValueChange={setDivision}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A">Série A</SelectItem>
                                <SelectItem value="B">Série B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Formato</Label>
                        <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-2">
                            <div className="flex items-center space-x-2 border border-zinc-800 p-3 rounded-md bg-zinc-950/50">
                                <RadioGroupItem value="ida" id="r-ida" />
                                <Label htmlFor="r-ida" className="flex-1 cursor-pointer font-normal">
                                    Apenas Ida
                                    <span className="block text-xs text-zinc-500">Todos jogam contra todos 1 vez</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 border border-zinc-800 p-3 rounded-md bg-zinc-950/50">
                                <RadioGroupItem value="ida_volta" id="r-volta" />
                                <Label htmlFor="r-volta" className="flex-1 cursor-pointer font-normal">
                                    Ida e Volta
                                    <span className="block text-xs text-zinc-500">Todos jogam contra todos 2 vezes</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex items-start space-x-2 pt-2">
                        <Checkbox
                            id="clear"
                            checked={clearExisting}
                            onCheckedChange={(c) => setClearExisting(!!c)}
                            className="mt-1 border-white/20 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="clear" className="cursor-pointer font-bold text-red-400">
                                Limpar agendamento existente?
                            </Label>
                            <p className="text-xs text-zinc-500">
                                Se marcado, excluirá TODAS as partidas atuais desta divisão antes de gerar novas.
                                <br /><span className="text-red-500/80 font-bold">Ação irreversível!</span>
                            </p>
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleGenerate} disabled={loading} className="bg-yellow-500 text-black hover:bg-yellow-600">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Gerar Calendário
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
