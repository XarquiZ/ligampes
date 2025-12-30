'use client'

import { motion } from 'framer-motion'
import { Check, ArrowUp, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function PricingFAQ() {
    return (
        <section id="pricing" className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">

                {/* Back Button */}
                <div className="mb-8 flex justify-center md:justify-start">
                    <Button variant="ghost" className="text-zinc-500 hover:text-white" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <ArrowUp className="mr-2 w-4 h-4" /> Voltar ao Início
                    </Button>
                </div>

                {/* Pricing Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos Simples</h2>
                    <p className="text-zinc-400">Comece grátis, pague apenas quando estiver pronto.</p>
                </div>

                {/* Cards - Scrollable on Mobile, Grid on Desktop */}
                <div className="flex overflow-x-auto snap-x snap-mandatory pb-8 lg:pb-0 lg:overflow-visible gap-6 lg:gap-8 lg:grid lg:grid-cols-3 max-w-6xl mx-auto mb-24 -mx-6 px-6 lg:mx-auto lg:px-0 scrollbar-hide">

                    {/* Starter Grátis */}
                    <Card className="min-w-[85vw] md:min-w-[350px] snap-center bg-zinc-900 border-zinc-800 relative flex flex-col h-full">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                                <Trophy className="w-5 h-5 text-zinc-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white">Starter Grátis</CardTitle>
                            <CardDescription>Para quem está começando</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3 mt-4">
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Até 8 Times</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> 1 Campeonato Ativo</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Domínio Próprio (.com.br)</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Gestão de Jogadores</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Mensal */}
                    <Card className="min-w-[85vw] md:min-w-[350px] snap-center bg-zinc-900 border-zinc-800 relative flex flex-col h-full">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                                <Trophy className="w-5 h-5 text-zinc-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white">Mensal</CardTitle>
                            <CardDescription>R$ 30,00 / mês</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3 mt-4">
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Times Ilimitados</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Campeonatos Ilimitados</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Domínio Próprio (.com.br)</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Sem Anúncios</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Anual */}
                    <Card className="min-w-[85vw] md:min-w-[350px] snap-center bg-zinc-900 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden transform lg:-translate-y-4 flex flex-col h-full">
                        <div className="absolute top-0 right-0 p-0">
                            <Badge className="bg-green-500 hover:bg-green-600 text-zinc-950 font-bold rounded-bl-xl rounded-tr-none px-4 py-1">ECONOMIZE R$ 60</Badge>
                        </div>
                        <CardHeader>
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white">Anual</CardTitle>
                            <CardDescription className="text-green-500 font-bold">R$ 300,00 / ano</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3 mt-4">
                                <li className="flex items-center gap-2 text-white font-medium text-sm"><Check className="w-4 h-4 text-green-500" /> 2 Meses Grátis</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Tudo do plano Mensal</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Domínio Próprio (.com.br)</li>
                                <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Suporte VIP (WhatsApp)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
                        <p className="text-zinc-400">Tire suas dúvidas sobre o processo Concierge.</p>
                    </div>

                    <Accordion type="single" collapsible className="w-full bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                        <AccordionItem value="item-1" className="border-zinc-800">
                            <AccordionTrigger className="text-left text-lg hover:text-green-400 hover:no-underline">Preciso pagar antes de receber a liga?</AccordionTrigger>
                            <AccordionContent className="text-zinc-400">
                                Não! O cadastro e a solicitação de criação são gratuitos. Você cria sua conta, nós montamos sua estrutura e você só paga quando receber o acesso completo para ativar o plano Pro.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="border-zinc-800">
                            <AccordionTrigger className="text-left text-lg hover:text-green-400 hover:no-underline">E se eu não gostar da plataforma?</AccordionTrigger>
                            <AccordionContent className="text-zinc-400">
                                Sem problemas. Você tem 7 dias de garantia incondicional após o pagamento. Se achar que não é para você, devolvemos 100% do valor.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3" className="border-zinc-800">
                            <AccordionTrigger className="text-left text-lg hover:text-green-400 hover:no-underline">Funciona para quais jogos?</AccordionTrigger>
                            <AccordionContent className="text-zinc-400">
                                Otimizado para PES (eFootball), FIFA (EA FC), NBA 2K e também Esportes Reais (Futebol Society, Várzea). O sistema se adapta às regras do seu campeonato.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

            </div>
        </section>
    )
}
