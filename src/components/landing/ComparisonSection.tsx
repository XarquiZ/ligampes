"use client"

import React from 'react'
import { Check, X, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ComparisonSection() {
    const comparisonData = [
        {
            feature: "Experiência Visual",
            other: "Visual Genérico 'Tabela de Excel'",
            us: "Dark Mode Gamer & Interface Imersiva",
        },
        {
            feature: "Publicidade",
            other: "Banners de anúncios irritantes",
            us: "Zero Anúncios. Limpo para sempre.",
        },
        {
            feature: "Social Media",
            other: "Súmulas para imprimir em papel",
            us: "Gerador de Cards Automáticos",
        },
        {
            feature: "Qualidade de Imagem",
            other: "Baixa resolução (SD)",
            us: "Ultra HD (4K) liberado",
        },
        {
            feature: "Endereço da Liga",
            other: "Link difícil de decorar",
            us: "Link curto: ligaon.app/sua-liga",
        },
        {
            feature: "Foco",
            other: "Genérico (Vôlei, Truco...)",
            us: "Especialista em Esports (FIFA, NBA)",
        },
    ]

    return (
        <section className="py-24 bg-zinc-950 px-6">
            <div className="container mx-auto max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Por que escolher a <span className="text-green-500">LIGA.ON</span>?</h2>
                    <p className="text-zinc-400">Não aceite menos que o melhor para o seu campeonato.</p>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
                    {/* Header Grid */}
                    <div className="grid grid-cols-12 border-b border-zinc-800 bg-zinc-950/50">
                        <div className="col-span-4 p-6 flex items-center font-bold text-zinc-400">Funcionalidade</div>
                        <div className="col-span-4 p-6 flex items-center justify-center font-bold text-zinc-500 bg-zinc-900/30">Outros Apps</div>
                        <div className="col-span-4 p-6 flex items-center justify-center font-black text-white bg-green-500/10 border-l border-green-500/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none" />
                            <span className="relative z-10 flex items-center gap-2">
                                LIGA.ON <Rocket className="w-4 h-4 text-green-500" />
                            </span>
                        </div>
                    </div>

                    {/* Rows */}
                    {comparisonData.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 border-b border-zinc-800 last:border-0 hover:bg-white/5 transition-colors group">
                            {/* Feature Name */}
                            <div className="col-span-4 p-6 flex items-center font-medium text-zinc-300 text-sm md:text-base border-r border-zinc-800/50">
                                {item.feature}
                            </div>

                            {/* Competitor */}
                            <div className="col-span-4 p-6 flex flex-col items-center justify-center text-center text-sm text-zinc-500 bg-zinc-900/20 border-r border-zinc-800/50">
                                <X className="w-6 h-6 text-red-500/50 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                {item.other}
                            </div>

                            {/* Us */}
                            <div className="col-span-4 p-6 flex flex-col items-center justify-center text-center text-sm font-medium text-white bg-green-500/5 relative">
                                <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors duration-500" />
                                <Check className="w-6 h-6 text-green-500 mb-2 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span className="relative z-10">{item.us}</span>
                            </div>
                        </div>
                    ))}

                    {/* Call to Action Footer Row */}
                    <div className="grid grid-cols-12 bg-zinc-950/50">
                        <div className="col-span-8 p-6 hidden md:block" />
                        <div className="col-span-12 md:col-span-4 p-6 flex items-center justify-center bg-green-500/10 border-l border-green-500/20">
                            <Button asChild className="w-full font-bold bg-green-500 hover:bg-green-600 text-zinc-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all">
                                <Link href="/criar">
                                    Criar Liga Grátis
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
