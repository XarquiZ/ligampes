import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
            <LandingHeader />

            <main className="flex-1 container mx-auto px-6 py-32 max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-12 md:gap-24">

                    {/* Left Column: Info */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-4">Fale com a gente</h1>
                            <p className="text-zinc-400 text-lg">
                                Tem alguma dúvida sobre sua liga ou quer sugerir uma funcionalidade? Estamos online e prontos para ajudar.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Email Card */}
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="bg-zinc-800 p-3 rounded-full">
                                        <Mail className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500 font-medium">E-mail</p>
                                        <p className="text-white font-medium">suporte@ligaon.com.br</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* WhatsApp Card */}
                            <Card className="bg-zinc-900 border-green-900/30">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="bg-green-500/10 p-3 rounded-full">
                                        <MessageCircle className="w-6 h-6 text-green-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-500 font-medium">WhatsApp</p>
                                        <p className="text-white font-medium mb-2">Atendimento em tempo real</p>
                                        <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-zinc-950 font-bold">
                                            <Link href="https://wa.me/5511999999999" target="_blank">
                                                Conversar no WhatsApp
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
                        <h2 className="text-2xl font-bold mb-6">Envie uma mensagem</h2>
                        <form className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" placeholder="Seu nome" className="bg-zinc-950 border-zinc-800 focus:border-green-500" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" placeholder="seu@email.com" className="bg-zinc-950 border-zinc-800 focus:border-green-500" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="subject">Assunto</Label>
                                <Input id="subject" placeholder="Ex: Dúvida sobre pagamento" className="bg-zinc-950 border-zinc-800 focus:border-green-500" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="message">Mensagem</Label>
                                <Textarea id="message" placeholder="Como podemos ajudar?" className="bg-zinc-950 border-zinc-800 focus:border-green-500 min-h-[150px]" />
                            </div>

                            <Button type="button" className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold">
                                Enviar Mensagem
                            </Button>
                        </form>
                    </div>

                </div>
            </main>

            <LandingFooter />
        </div>
    )
}
