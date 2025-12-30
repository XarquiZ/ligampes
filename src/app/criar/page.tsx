"use client"

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createLeagueAction } from '@/app/actions/create-league'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Loader2, Check, AlertCircle, Gamepad2, Activity, Dribbble, ArrowLeft, UserPlus, ServerCog, Rocket, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// --- Schemas & Types ---
const schema = z.object({
    gameType: z.enum(['EAFC', 'PES', 'NBA', 'REAL_SPORTS']),
    leagueName: z.string().min(3, "O nome da liga deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "O endereço deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
})
type FormData = z.infer<typeof schema>
const initialState = { message: '', errors: {} }

export default function RegisterWizardPage() {
    // --- Global State ---
    const [user, setUser] = useState<any>(null)
    const [loadingAuth, setLoadingAuth] = useState(true)
    const [step, setStep] = useState<'auth' | 'plan' | 'form'>('auth')
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'mensal' | 'anual'>('free')
    const router = useRouter()

    // --- Form State ---
    const [state, formAction, isPending] = useActionState(createLeagueAction, initialState)
    const { register, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange'
    })

    // --- Effects ---
    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUser(user)
                    setStep('plan')
                } else {
                    setUser(null)
                    setStep('auth')
                }
            } finally {
                setLoadingAuth(false)
            }
        }
        checkUser()
    }, [])

    useEffect(() => {
        if (state?.message) toast.error(state.message)
    }, [state])

    // Slug Generator
    const leagueName = watch('leagueName')
    useEffect(() => {
        if (leagueName) {
            const slug = leagueName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
            setValue('slug', slug, { shouldValidate: true })
        }
    }, [leagueName, setValue])


    // --- Handlers ---
    // --- Handlers ---
    const handleLogin = async () => {
        // Set fallback redirect cookie to bypass strict URL whitelisting issues with query params
        document.cookie = `auth_redirect=/criar; path=/; max-age=300` // 5 minutes

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`, // Clean URL (must be whitelisted exactly)
                queryParams: { access_type: 'offline', prompt: 'consent' },
            },
        })
    }

    const handlePlanSelect = (plan: 'free' | 'mensal' | 'anual') => {
        if (selectedPlan === plan) {
            setStep('form')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            setSelectedPlan(plan)
        }
    }

    // --- Render Steps ---

    if (loadingAuth) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-green-500/30">
            {/* Header / Nav */}
            <div className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">
                <button
                    onClick={() => step === 'form' ? setStep('plan') : router.push('/')}
                    className="pointer-events-auto p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full backdrop-blur-md transition-colors border border-white/5 text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="hidden md:flex gap-2 pointer-events-auto">
                    <div className={cn("px-4 py-2 rounded-full text-xs font-bold transition-colors backdrop-blur-md border", step === 'auth' ? "bg-green-500 text-black border-green-500" : "bg-zinc-900/50 border-white/10 text-zinc-500")}>1. Login</div>
                    <div className={cn("px-4 py-2 rounded-full text-xs font-bold transition-colors backdrop-blur-md border", step === 'plan' ? "bg-green-500 text-black border-green-500" : "bg-zinc-900/50 border-white/10 text-zinc-500")}>2. Plano</div>
                    <div className={cn("px-4 py-2 rounded-full text-xs font-bold transition-colors backdrop-blur-md border", step === 'form' ? "bg-green-500 text-black border-green-500" : "bg-zinc-900/50 border-white/10 text-zinc-500")}>3. Liga</div>
                </div>
            </div>

            {/* STEP 1: AUTHENTICATION */}
            {step === 'auth' && (
                <div className="min-h-screen grid lg:grid-cols-2 animate-in fade-in duration-500">
                    <div className="hidden lg:relative lg:flex flex-col justify-end p-12 bg-zinc-900 overflow-hidden">
                        <Image src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop" alt="Stadium" fill className="object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
                        <div className="relative z-10 max-w-lg">
                            <h2 className="text-4xl font-bold mb-4">Sua jornada começa aqui.</h2>
                            <p className="text-zinc-400 text-lg">Junte-se a milhares de organizadores e leve seu campeonato para o próximo nível.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 bg-zinc-950">
                        <div className="w-full max-w-sm text-center space-y-8">
                            <div className="relative w-40 h-12 mx-auto"><Image src="/LOGO.png" alt="Logo" fill className="object-contain" /></div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold">Faça Login ou Crie sua Conta</h1>
                                <p className="text-zinc-400 text-sm">Use o Google para entrar em segundos.</p>
                            </div>
                            <Button onClick={handleLogin} className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold flex items-center justify-center gap-3 transition-transform active:scale-95">
                                <Image src="https://authjs.dev/img/providers/google.svg" alt="G" width={20} height={20} />
                                Continuar com Google
                            </Button>
                            <p className="text-xs text-zinc-600">Ao continuar você aceita nossos termos de uso.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: PLAN SELECTION */}
            {step === 'plan' && (
                <div className="min-h-screen py-24 px-4 flex flex-col items-center animate-in slide-in-from-right-10 duration-500">
                    <div className="text-center mb-12 space-y-4 max-w-2xl">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Escolha seu Plano</h1>
                        <p className="text-zinc-400 text-lg">Selecione a melhor opção para o tamanho da sua liga.</p>
                    </div>

                    <div className="w-full max-w-6xl grid md:grid-cols-3 gap-6">
                        {/* Free */}
                        <Card
                            className={cn("bg-zinc-900/50 transition-all cursor-pointer group relative overflow-hidden", selectedPlan === 'free' ? "border-green-500 ring-1 ring-green-500/50" : "border-zinc-800 hover:border-zinc-700")}
                            onClick={() => handlePlanSelect('free')}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Trophy className="w-6 h-6 text-zinc-400" /></div>
                                <CardTitle className="text-2xl text-white">Starter</CardTitle>
                                <CardDescription className="text-zinc-400">Grátis</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2 text-sm text-zinc-400">
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Até 8 Times</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 1 Campeonato</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Gestão Básica</li>
                                </ul>
                                <Button variant="outline" className={cn("w-full mt-4 bg-transparent border-zinc-700 hover:bg-green-500 hover:text-black hover:border-green-500", selectedPlan === 'free' ? "bg-green-500 text-black border-green-500" : "text-white")}>
                                    {selectedPlan === 'free' ? 'Confirmar e Prosseguir' : 'Selecionar Starter'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Mensal */}
                        <Card
                            className={cn("transition-all cursor-pointer group relative overflow-hidden", selectedPlan === 'mensal' ? "bg-zinc-900/80 border-green-500 ring-1 ring-green-500" : "bg-zinc-900/50 border-zinc-800 hover:border-green-500")}
                            onClick={() => handlePlanSelect('mensal')}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Activity className="w-6 h-6 text-green-500" /></div>
                                <CardTitle className="text-2xl text-white">Mensal</CardTitle>
                                <CardDescription className="text-green-400">R$ 30,00 / mês</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Ilimitado</strong></li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Sem Anúncios</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Domínio .com.br</li>
                                </ul>
                                <Button variant="outline" className={cn("w-full mt-4 bg-transparent border-zinc-700 hover:bg-green-500 hover:text-black hover:border-green-500", selectedPlan === 'mensal' ? "bg-green-500 text-black border-green-500" : "text-white")}>
                                    {selectedPlan === 'mensal' ? 'Confirmar e Prosseguir' : 'Selecionar Mensal'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Anual */}
                        <Card
                            className={cn("bg-zinc-900/50 transition-all cursor-pointer group relative overflow-hidden", selectedPlan === 'anual' ? "border-purple-500 ring-1 ring-purple-500/50" : "border-zinc-800 hover:border-green-500/50")}
                            onClick={() => handlePlanSelect('anual')}
                        >
                            <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">2 MESES OFF</div>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Rocket className="w-6 h-6 text-purple-500" /></div>
                                <CardTitle className="text-2xl text-white">Anual</CardTitle>
                                <CardDescription className="text-purple-400">R$ 300,00 / ano</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2 text-sm text-zinc-400">
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-purple-500" /> <strong>Economize R$ 60</strong></li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-purple-500" /> Tudo do Mensal</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-purple-500" /> Suporte VIP</li>
                                </ul>
                                <Button variant="outline" className={cn("w-full mt-4 bg-transparent border-zinc-700 hover:bg-purple-500 hover:text-white hover:border-purple-500", selectedPlan === 'anual' ? "bg-purple-500 text-white border-purple-500" : "text-white")}>
                                    {selectedPlan === 'anual' ? 'Confirmar e Prosseguir' : 'Selecionar Anual'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* STEP 3: LEAGUE FORM */}
            {step === 'form' && (
                <div className="min-h-screen grid lg:grid-cols-2 animate-in slide-in-from-right-10 duration-500">
                    {/* Visual Recap */}
                    <div className="hidden lg:flex flex-col p-12 bg-zinc-900 border-r border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <div className="relative z-10 my-auto">
                            <h2 className="text-4xl font-bold mb-8">Quase lá!</h2>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-zinc-400">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><Check className="w-5 h-5" /></div>
                                    <div><p className="text-white font-medium">Conta Criada</p><p className="text-xs">{user?.email}</p></div>
                                </div>
                                <div className="flex items-center gap-4 text-zinc-400">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><Check className="w-5 h-5" /></div>
                                    <div><p className="text-white font-medium">Plano Selecionado</p><p className="text-xs uppercase">{selectedPlan}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">3</div>
                                    <div><p className="text-white font-medium">Configurar Liga</p><p className="text-xs text-zinc-400">Preencha os dados ao lado</p></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="flex items-center justify-center p-6 lg:p-12">
                        <div className="w-full max-w-lg space-y-8">
                            <div>
                                <h1 className="text-3xl font-black mb-2">Detalhes da Liga</h1>
                                <p className="text-zinc-400">Personalize seu campeonato.</p>
                            </div>

                            <form action={formAction} className="space-y-6">
                                <input type="hidden" name="plan" value={selectedPlan} />

                                <div className="space-y-3">
                                    <Label>Jogo</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="hidden" name="gameType" value={watch('gameType') || ''} />
                                        {[
                                            { id: 'EAFC', label: 'EAFC' },
                                            { id: 'PES', label: 'eFootball' },
                                            { id: 'NBA', label: 'NBA 2K' },
                                            { id: 'REAL_SPORTS', label: 'Real' }
                                        ].map(g => (
                                            <div key={g.id} onClick={() => setValue('gameType', g.id as any)} className={cn("p-3 rounded-lg border cursor-pointer hover:bg-zinc-900 transition-colors text-center text-sm font-medium", watch('gameType') === g.id ? "bg-green-500/10 border-green-500 text-white" : "border-zinc-800 text-zinc-400")}>
                                                {g.label}
                                            </div>
                                        ))}
                                    </div>
                                    {errors.gameType && <p className="text-red-500 text-xs">{errors.gameType.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Nome da Liga</Label>
                                    <Input placeholder="Ex: Premier League Bairro" {...register('leagueName')} className="bg-zinc-900 border-zinc-800 h-12" />
                                    {errors.leagueName && <p className="text-red-500 text-xs">{errors.leagueName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Link Personalizado</Label>
                                    <div className="flex">
                                        <div className="h-12 flex items-center px-3 bg-zinc-900 border border-r-0 border-zinc-800 rounded-l-md text-zinc-500 text-sm">ligaon.com/</div>
                                        <Input placeholder="premier-bairro" {...register('slug')} className="rounded-l-none bg-zinc-900 border-zinc-800 h-12" />
                                    </div>
                                    {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                                </div>

                                <Button disabled={isPending} className="w-full h-12 bg-green-500 hover:bg-green-600 text-black font-bold text-lg">
                                    {isPending ? <Loader2 className="animate-spin" /> : "Finalizar e Criar"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
