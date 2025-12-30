'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { Trophy, Users, Banknote, Gavel } from 'lucide-react'

const features = [
    {
        title: "Gestão Profissional",
        description: "Tabelas automáticas, artilharia e calendário de jogos. Tudo atualizado em tempo real para sua liga profissional.",
        icon: Trophy,
        image: "/screens/tabela.png",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        title: "Mercado e Leilões",
        description: "A emoção do mercado. Faça leilões em tempo real, negocie transferências e gerencie contratos de jogadores.",
        icon: Gavel,
        image: "/screens/leilao.png",
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        title: "Controle Financeiro",
        description: "Não quebre o clube. Monitore receitas, despesas e salários dos jogadores com um fluxo de caixa detalhado.",
        icon: Banknote,
        image: "/screens/financas.png",
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        title: "Scout e Elenco",
        description: "Banco de dados completo com mais de 700 jogadores, atributos detalhados e gestão completa de plantel.",
        icon: Users,
        image: "/screens/elenco.png",
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    }
]

export function ProductShowcase() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    return (
        <section ref={containerRef} className="bg-zinc-950 relative" style={{ height: '300vh' }}>
            <div className="sticky top-0 h-screen overflow-hidden flex flex-col lg:flex-row">

                {/* Left Column - Text Content */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 lg:p-24 absolute lg:relative z-20 pointer-events-none lg:pointer-events-auto">
                    <div className="relative w-full h-full max-w-lg">
                        {features.map((feature, index) => {
                            // Creating fade in/out ranges for text
                            // Range size per item is 1 / 4 = 0.25
                            // Item 0: 0.0 - 0.2
                            // Item 1: 0.25 - 0.45
                            const start = index * 0.25
                            const end = start + 0.25
                            const mid = start + 0.125

                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            const opacity = useTransform(scrollYProgress,
                                [start, start + 0.05, end - 0.05, end],
                                [0, 1, 1, 0]
                            )

                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            const y = useTransform(scrollYProgress,
                                [start, mid, end],
                                [50, 0, -50]
                            )

                            return (
                                <motion.div
                                    key={index}
                                    style={{ opacity, y }}
                                    className="absolute inset-0 flex flex-col justify-center bg-zinc-950/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-6 rounded-xl"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
                                    <p className="text-xl text-zinc-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Column - Images */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 lg:p-12 bg-zinc-900/50">
                    <div className="relative w-full aspect-video max-w-2xl rounded-xl border border-zinc-800 shadow-2xl overflow-hidden bg-zinc-900">
                        {features.map((feature, index) => {
                            const start = index * 0.25
                            const end = start + 0.25

                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            const opacity = useTransform(scrollYProgress,
                                [start, start + 0.01, end - 0.01, end],
                                [0, 1, 1, 0]
                            )

                            return (
                                <motion.div
                                    key={index}
                                    style={{ opacity }}
                                    className="absolute inset-0"
                                >
                                    <Image
                                        src={feature.image}
                                        alt={feature.title}
                                        fill
                                        className="object-cover"
                                    />
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </section>
    )
}
