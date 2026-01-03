'use client'

import { motion } from 'framer-motion'
import { Check, ArrowUp, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export function PricingFAQ() {
    return (
        <section id="pricing" className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos Simples e Justos</h2>
                    <p className="text-zinc-400">Comece de graça. Evolua quando precisar.</p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">

                    {/* Grátis */}
                    <Card className="bg-zinc-900 border-zinc-800 relative flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Starter (Grátis)</CardTitle>
                            <CardDescription>Para organizar o rachão da semana</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold text-white mb-6">R$ 0 <span className="text-sm text-zinc-500 font-normal">/ para sempre</span></div>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-green-500" /> Até 8 Times</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-green-500" /> Tabela e Classificação Automática</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-green-500" /> Link para compartilhar</li>
                            </ul>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold">
                                <Link href="/criar">Começar Grátis</Link>
                            </Button>
                            <span className="text-xs text-zinc-500 font-medium">Gratuito para começar • Sem cartão</span>
                        </CardFooter>
                    </Card>

                    {/* Pro */}
                    <Card className="bg-zinc-900 border-green-500 relative flex flex-col shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                            <Badge className="bg-green-500 text-zinc-950 font-bold px-3 py-1 text-xs uppercase tracking-wide">Recomendado</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Liga PRO</CardTitle>
                            <CardDescription>Para campeonatos sérios</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold text-white mb-6">R$ 29,90 <span className="text-sm text-zinc-500 font-normal">/ mês</span></div>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-green-500" /> <span className="font-bold">Times Ilimitados</span></li>
                                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-green-500" /> Artilharia e Estatísticas Completas</li>
                                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-green-500" /> Fotos dos Jogadores</li>
                                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-green-500" /> Sem Anúncios</li>
                            </ul>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-zinc-950 font-bold">
                                <Link href="/criar">Criar Liga Profissional</Link>
                            </Button>
                            <span className="text-xs text-zinc-500 font-medium">7 dias de garantia • Cancele quando quiser</span>
                        </CardFooter>
                    </Card>

                </div>

                {/* FAQ Simplificado */}
                <div className="max-w-2xl mx-auto">
                    <p className="text-center text-zinc-500 text-sm mb-4">Dúvidas Frequentes</p>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-zinc-800">
                            <AccordionTrigger className="text-zinc-200 hover:text-green-400">Posso testar a versão PRO?</AccordionTrigger>
                            <AccordionContent className="text-zinc-400">
                                Sim! Ao criar sua liga, você tem acesso a todas as funcionalidades para configurar. O pagamento só é necessário para liberar o acesso público completo se você escolher o plano pago.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="border-zinc-800">
                            <AccordionTrigger className="text-zinc-200 hover:text-green-400">Serve para mata-mata?</AccordionTrigger>
                            <AccordionContent className="text-zinc-400">
                                Sim, o sistema gerencia fases de grupos e mata-mata (oitavas, quartas, semi, final) automaticamente.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

            </div>
        </section>
    )
}
