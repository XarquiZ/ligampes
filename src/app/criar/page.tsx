"use client"

import { useActionState, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createLeagueAction } from '@/app/actions/create-league'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Loader2, Check, AlertCircle, Gamepad2, Activity, Dribbble, ArrowLeft, UserPlus, ServerCog, Rocket } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const schema = z.object({
    gameType: z.enum(['EAFC', 'PES', 'NBA', 'REAL_SPORTS']),
    leagueName: z.string().min(3, "O nome da liga deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "O endereço deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
})

type FormData = z.infer<typeof schema>

const initialState = {
    message: '',
    errors: {},
}

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(createLeagueAction, initialState)
    const [showPassword, setShowPassword] = useState(false)
    const [user, setUser] = useState<any>(null)
    const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange'
    })

    // Check Auth on Mount
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
            }
        }
        checkUser()
    }, [])

    const handleGoogleLogin = async () => {
        const formData = {
            leagueName: getValues('leagueName'),
            slug: getValues('slug'),
            gameType: getValues('gameType'),
            plan: selectedPlan
        }
        localStorage.setItem('saved_league_form', JSON.stringify(formData))
        // Cookie ensures server redirects back to /criar
        document.cookie = `auth_redirect=/criar; path=/; max-age=300`

        await supabase.auth.signOut()
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
                queryParams: { access_type: 'offline', prompt: 'consent' },
            },
        })
    }

    // Restore Draft Effect
    useEffect(() => {
        const saved = localStorage.getItem('saved_league_form')
        if (saved) {
            try {
                const data = JSON.parse(saved)
                if (data.leagueName) setValue('leagueName', data.leagueName)
                if (data.slug) setValue('slug', data.slug)
                if (data.gameType) setValue('gameType', data.gameType)
                if (data.plan) setSelectedPlan(data.plan)

                // Clear after restoring? Only if user is submitting. 
                // Let's keep it until manual clear or success.
            } catch (e) { }
        }
    }, [setValue])

    const leagueName = watch('leagueName')
    const selectedGameType = watch('gameType')

    // Auto-generate slug
    useEffect(() => {
        if (leagueName) {
            const slug = leagueName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9\s-]/g, "")
                .trim()
                .replace(/\s+/g, "-")

            setValue('slug', slug, { shouldValidate: true })
        }
    }, [leagueName, setValue])

    useEffect(() => {
        if (state?.message) {
            toast.error(state.message)
        }
    }, [state])

    const gameOptions = [
        { id: 'EAFC', label: 'EAFC (FIFA)', icon: Gamepad2, color: 'text-blue-500' },
        { id: 'PES', label: 'eFootball (PES)', icon: Gamepad2, color: 'text-purple-500' },
        { id: 'NBA', label: 'NBA 2K', icon: Dribbble, color: 'text-orange-500' },
        { id: 'REAL_SPORTS', label: 'Esporte Real', icon: Activity, color: 'text-green-500' },
    ]

    const [showPlanModal, setShowPlanModal] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'mensal' | 'anual'>('free')

    const handleSelectPlan = (plan: 'free' | 'mensal' | 'anual') => {
        setSelectedPlan(plan)
        setShowPlanModal(false)
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-zinc-950 text-white relative">
            {/* Back Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 z-20 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors backdrop-blur-sm"
            >
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>

            {/* Plan Selection Modal */}
            {showPlanModal && (
                <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-start pt-20 justify-center p-4 overflow-y-auto">
                    <div className="max-w-6xl w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">

                        {/* Back to Home */}
                        <div className="w-full flex justify-start">
                            <Link href="/" className="flex items-center text-zinc-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Voltar ao Início
                            </Link>
                        </div>

                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 w-[calc(100vw-3rem)] -mx-6 px-6 md:w-full md:grid md:grid-cols-3 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">

                            {/* Free Plan */}
                            <Card className={cn(
                                "min-w-[85vw] md:min-w-0 snap-center flex flex-col transition-all cursor-pointer relative",
                                selectedPlan === 'free' ? "bg-zinc-800/80 border-green-500 ring-1 ring-green-500" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                            )}>
                                <CardHeader>
                                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                        <Trophy className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <CardTitle className="text-2xl text-white">Starter Grátis</CardTitle>
                                    <CardDescription>Para quem está começando</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    <ul className="space-y-2 text-sm text-zinc-400">
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Até 8 Times</li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 1 Campeonato Ativo</li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Domínio Próprio (.com.br)</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Gestão de Jogadores</li>
                                    </ul>
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Button
                                        onClick={() => handleSelectPlan('free')}
                                        className={cn(
                                            "w-full font-bold h-12",
                                            selectedPlan === 'free' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                        )}
                                    >
                                        {selectedPlan === 'free' ? 'Selecionado' : 'Começar Grátis'}
                                    </Button>
                                </div>
                            </Card>

                            {/* Mensal Plan */}
                            <Card className={cn(
                                "min-w-[85vw] md:min-w-0 snap-center flex flex-col transition-all cursor-pointer relative overflow-hidden group",
                                selectedPlan === 'mensal' ? "bg-zinc-800/80 border-green-500 ring-1 ring-green-500" : "bg-zinc-900 border-zinc-800 hover:border-green-500/50"
                            )}>
                                <CardHeader>
                                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                        <Trophy className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <CardTitle className="text-2xl text-white">Mensal</CardTitle>
                                    <CardDescription>R$ 30,00 / mês</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    <ul className="space-y-2 text-sm text-zinc-300">
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Times Ilimitados</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Campeonatos Ilimitados</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Domínio Próprio (.com.br)</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Sem Anúncios</li>
                                    </ul>
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Button
                                        onClick={() => handleSelectPlan('mensal')}
                                        className={cn(
                                            "w-full font-bold h-12",
                                            selectedPlan === 'mensal' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                        )}
                                    >
                                        {selectedPlan === 'mensal' ? 'Selecionado' : 'Assinar Mensal'}
                                    </Button>
                                </div>
                            </Card>

                            {/* Anual Plan */}
                            <Card className={cn(
                                "min-w-[85vw] md:min-w-0 snap-center flex flex-col transition-all cursor-pointer relative overflow-hidden group shadow-[0_0_30px_rgba(34,197,94,0.15)]",
                                selectedPlan === 'anual' ? "bg-zinc-800/80 border-green-500 ring-1 ring-green-500 transform scale-[1.02]" : "bg-zinc-900 border-green-500 hover:border-green-400"
                            )}>
                                <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    ECONOMIZE R$ 60
                                </div>
                                <CardHeader>
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                        <Trophy className="w-6 h-6 text-green-500" />
                                    </div>
                                    <CardTitle className="text-2xl text-white">Anual</CardTitle>
                                    <CardDescription className="text-green-400">R$ 300,00 / ano</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    <ul className="space-y-2 text-sm text-zinc-300">
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>2 Meses Grátis</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Tudo do plano Mensal</li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Domínio Próprio (.com.br)</strong></li>
                                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Suporte VIP (WhatsApp)</li>
                                    </ul>
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Button
                                        onClick={() => handleSelectPlan('anual')}
                                        className={cn(
                                            "w-full font-bold h-12",
                                            selectedPlan === 'anual' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
                                        )}
                                    >
                                        {selectedPlan === 'anual' ? 'Selecionado' : 'Assinar Anual'}
                                    </Button>
                                </div>
                            </Card>

                        </div>

                        <div className="text-zinc-500 text-sm w-full text-center pb-4">
                            Escolha um plano para prosseguir com o cadastro.
                        </div>
                    </div>
                </div>
            )}

            {/* Left Side - Visual */}
            <div className="hidden lg:relative lg:flex flex-col justify-between p-12 bg-zinc-900 overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop"
                        alt="Gaming Setup"
                        fill
                        className="object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-12">
                        <div className="relative w-32 h-10">
                            <Image
                                src="/LOGO.png"
                                alt="Liga.On Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </Link>
                </div>

                <div className="relative z-10 mt-8 mb-auto">
                    <h2 className="text-3xl font-bold mb-8 leading-tight">
                        Do Cadastro ao Kick-off <br />
                        <span className="text-green-500">em 3 Passos</span>
                    </h2>

                    <div className="space-y-8">
                        {/* Passo 1 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/30">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div className="w-px h-full bg-zinc-800 my-2" />
                            </div>
                            <div className="pb-8">
                                <h3 className="font-bold text-white text-lg">1. Reserva (O Cadastro)</h3>
                                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                                    Você cria sua conta, escolhe o nome da liga e garante seu endereço exclusivo (ex: ligaon.com/sualiga).
                                </p>
                            </div>
                        </div>

                        {/* Passo 2 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/30 animate-pulse">
                                    <ServerCog className="w-5 h-5" />
                                </div>
                                <div className="w-px h-full bg-zinc-800 my-2" />
                            </div>
                            <div className="pb-8">
                                <h3 className="font-bold text-white text-lg">2. Configuração Dedicada</h3>
                                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                                    Nossa equipe sobe sua infraestrutura para garantir performance. Você recebe um e-mail confirmando.
                                </p>
                            </div>
                        </div>

                        {/* Passo 3 */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 border border-green-500/30">
                                    <Rocket className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">3. Liberação e Acesso</h3>
                                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                                    Em até 24h, você recebe o acesso total para realizar o pagamento e assumir o controle.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-xl space-y-8">
                    <div className="lg:hidden mb-8 text-center">
                        <Link href="/" className="inline-block relative w-32 h-10">
                            <Image
                                src="/LOGO.png"
                                alt="Liga.On Logo"
                                fill
                                className="object-contain"
                            />
                        </Link>
                    </div>

                    {/* Headline Moved Here */}
                    <div className="">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
                            Sua liga profissional <br />
                            <span className="text-green-500">começa agora.</span>
                        </h1>
                        {/* Fake numbers text removed */}
                    </div>

                    <form action={formAction} className="space-y-8">

                        {/* 1. Game Selector */}
                        <div className="space-y-3">
                            <Label className="text-base">Qual o seu jogo?</Label>
                            {/* Hidden Input for Plan */}
                            <input type="hidden" name="plan" value={selectedPlan} />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <input type="hidden" name="gameType" value={selectedGameType || ''} />
                                {gameOptions.map((game) => (
                                    <div
                                        key={game.id}
                                        onClick={() => setValue('gameType', game.id as any, { shouldValidate: true })}
                                        className={cn(
                                            "cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 gap-2 hover:bg-zinc-900/50",
                                            selectedGameType === game.id
                                                ? "bg-green-500/10 border-green-500 ring-1 ring-green-500"
                                                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        <game.icon className={cn("w-6 h-6", game.color)} />
                                        <span className={cn("text-xs font-bold text-center", selectedGameType === game.id ? "text-white" : "text-zinc-400")}>{game.label}</span>
                                    </div>
                                ))}
                            </div>
                            {errors.gameType && <p className="text-red-500 text-xs">{errors.gameType.message}</p>}
                        </div>


                        {/* 2. League Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider text-xs">Detalhes do Campeonato</h3>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="leagueName">Nome da Liga</Label>
                                    <Input
                                        id="leagueName"
                                        placeholder="Ex: Copa dos Amigos"
                                        {...register('leagueName')}
                                        className="bg-zinc-900 border-zinc-800 focus:border-green-500 h-12"
                                    />
                                    {errors.leagueName && <p className="text-red-500 text-xs">{errors.leagueName.message}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Identificador do Sistema (Slug)</Label>
                                    <div className="flex items-center">
                                        <Input
                                            id="slug"
                                            placeholder="ex: copa-dos-amigos"
                                            {...register('slug')}
                                            className="bg-zinc-900 border-zinc-800 focus:border-green-500 h-12"
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500">Este código será usado para configurar seu domínio personalizado.</p>
                                    {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                                </div>
                            </div>
                        </div>



                        <Alert className={cn(
                            "bg-zinc-900 border-l-4",
                            selectedPlan === 'free' ? "border-zinc-800/50 border-l-zinc-500" : "border-zinc-800/50 border-l-green-500"
                        )}>
                            <AlertCircle className={cn("h-4 w-4", selectedPlan === 'free' ? "text-zinc-500" : "text-green-500")} />
                            <AlertTitle className={cn(selectedPlan === 'free' ? "text-zinc-400" : "text-green-500")}>
                                {selectedPlan === 'free' && "Plano Starter Grátis"}
                                {selectedPlan === 'mensal' && "Plano Mensal (R$ 30/mês)"}
                                {selectedPlan === 'anual' && "Plano Anual (R$ 300/ano)"}
                            </AlertTitle>
                            <AlertDescription className="text-zinc-400 text-xs mt-1">
                                {selectedPlan === 'free' && "Você está criando uma conta com limite de 8 times e 1 campeonato ativo."}
                                {selectedPlan === 'mensal' && "Você terá acesso ilimitado. O pagamento será solicitado após a configuração."}
                                {selectedPlan === 'anual' && "Você terá acesso ilimitado com 2 meses grátis. O pagamento será solicitado após a configuração."}
                            </AlertDescription>
                        </Alert>


                        {/* Kick Off Guarantee */}
                        <div className="bg-zinc-900 border border-green-900/30 rounded-lg p-4 flex gap-3 items-start">
                            <div className="bg-green-500/10 p-2 rounded-full shrink-0">
                                <Trophy className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Kick Off Garantido</h4>
                                <p className="text-zinc-400 text-xs mt-1">
                                    Nós montamos sua liga primeiro. Você só realiza o pagamento da assinatura depois de ver tudo pronto e aprovado.
                                </p>
                            </div>
                        </div>

                        <Button
                            disabled={isPending}
                            type="submit"
                            onClick={(e) => {
                                if (!user) {
                                    e.preventDefault()
                                    toast.info('Para continuar, faça login com Google.')
                                    handleGoogleLogin()
                                }
                            }}
                            className="w-full h-12 text-base bg-green-500 hover:bg-green-600 text-zinc-950 font-bold shadow-lg shadow-green-500/20"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando sua liga...
                                </>
                            ) : (
                                "Criar Conta e Começar"
                            )}
                        </Button>
                        {state?.errors && (
                            <div className="text-red-500 text-sm mt-2">
                                {Object.values(state.errors).flat().map((error: any, index: number) => (
                                    <p key={index}>{error}</p>
                                ))}
                            </div>
                        )}

                        <p className="text-center text-sm text-zinc-500">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="text-green-500 hover:underline">
                                Fazer Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div >
        </div >
    )
}
