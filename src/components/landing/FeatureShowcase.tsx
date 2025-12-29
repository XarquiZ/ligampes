"use client"

import React from 'react'
import Image from 'next/image'
import {
    ArrowRight,
    Trophy,
    Users,
    Table,
    BarChart3,
} from 'lucide-react'

export function FeatureShowcase() {
    const [activeFeature, setActiveFeature] = React.useState(0)
    const [autorotate, setAutorotate] = React.useState(true)

    const features = [
        {
            title: "Painel Geral",
            description: "Visão completa da sua liga em um só lugar.",
            image: "/DASHBOARD.png",
            icon: <BarChart3 className="w-5 h-5" />
        },
        {
            title: "Mercado & Leilões",
            description: "Emoção real com leilões ao vivo e disputa de jogadores.",
            image: "/leilao.png",
            icon: <Users className="w-5 h-5" />
        },
        {
            title: "Gestão de Elenco",
            description: "Controle total sobre seu time, salário e contratos.",
            image: "/Ger_jogadores.png",
            icon: <Users className="w-5 h-5" />
        },
        {
            title: "Financeiro",
            description: "Gestão bancária automática com receitas e despesas.",
            image: "/SALDO.png",
            icon: <Table className="w-5 h-5" />
        },
        {
            title: "Transferências",
            description: "Negocie trocas, vendas e empréstimos entre times.",
            image: "/trasnf.png",
            icon: <ArrowRight className="w-5 h-5" />
        },
        {
            title: "Tabelas",
            description: "Classificação automática atualizada em tempo real.",
            image: "/tabelas.png",
            icon: <Trophy className="w-5 h-5" />
        }
    ]

    React.useEffect(() => {
        if (!autorotate) return
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [autorotate, features.length])

    return (
        <div
            className="flex flex-col lg:flex-row gap-8 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm"
            onMouseEnter={() => setAutorotate(false)}
            onMouseLeave={() => setAutorotate(true)}
        >
            {/* Menu Lateral */}
            <div className="flex flex-col gap-2 w-full lg:w-1/3">
                {features.map((feature, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={`text-left p-4 rounded-xl transition-all duration-300 border flex items-center gap-4 group ${activeFeature === index
                                ? "bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                                : "bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700"
                            }`}
                    >
                        <div className={`p-2 rounded-lg ${activeFeature === index ? "bg-green-500 text-zinc-950" : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"}`}>
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm ${activeFeature === index ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                                {feature.title}
                            </h3>
                            {activeFeature === index && (
                                <p className="text-green-400 text-xs mt-1 animate-in fade-in slide-in-from-left-2 md:block hidden">
                                    {feature.description}
                                </p>
                            )}
                        </div>
                        {activeFeature === index && (
                            <div className="ml-auto w-1 h-12 bg-green-500 rounded-full animate-in fade-in zoom-in" />
                        )}
                    </button>
                ))}
            </div>

            {/* Área da Imagem */}
            <div className="flex-1 relative aspect-video bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl group/image">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${activeFeature === index ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                    >
                        <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            className="object-cover object-top"
                            priority={index === 0}
                        />
                        {/* Overlay Gradient for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 via-transparent to-transparent" />
                    </div>
                ))}

                {/* Loading/Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-4000 ease-linear"
                    style={{
                        width: autorotate ? '100%' : '0%',
                        transitionDuration: autorotate ? '4000ms' : '0ms',
                        opacity: autorotate ? 1 : 0
                    }}
                    key={activeFeature} // Reset animation on change
                />
            </div>
        </div>
    )
}
