import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="relative w-40 h-12 mb-8">
                <Image
                    src="/LOGO.png"
                    alt="Liga.On Logo"
                    fill
                    className="object-contain"
                />
            </div>

            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl text-white">Solicitação Recebida!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <p className="text-zinc-400">
                        Sua liga foi registrada com sucesso em nosso sistema.
                    </p>

                    <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 flex items-start gap-3 text-left">
                        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-zinc-200 text-sm">Aguardando Liberação</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Para garantir a segurança e exclusividade do seu endereço, nossa equipe faz a configuração manual do seu servidor.
                            </p>
                            <p className="text-xs text-zinc-300 mt-2 font-medium">Prazo: Até 1 dia útil.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-zinc-400">Não quer esperar?</p>
                        <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 gap-2">
                            <Link href="https://wa.me/5511948707427?text=Ol%C3%A1%2C%20acabei%20de%20criar%20minha%20liga%20no%20LIGA.ON%20e%20gostaria%20de%20acelerar%20a%20libera%C3%A7%C3%A3o%20do%20meu%20painel!" target="_blank">
                                <MessageCircle className="w-5 h-5" />
                                Acelerar minha liberação
                            </Link>
                        </Button>
                        <p className="text-xs text-zinc-500">
                            Fale diretamente com nosso suporte VIP.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="justify-center border-t border-zinc-800 pt-6">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        Voltar para a Home
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
