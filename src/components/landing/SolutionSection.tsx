'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

const features = [
    {
        icon: Trophy,
        title: 'Página da Liga Profissional',
        description: 'Seu campeonato com site próprio, escudo dos times e classificação automática.'
    },
    {
        icon: Calendar,
        title: 'Tabela e Jogos',
        description: 'Gerador automático de confrontos. Chega de quebrar a cabeça montando tabela.'
    },
    {
        icon: BarChart3,
        title: 'Estatísticas Completas',
        description: 'Artilharia, assistências, cartões e craque do jogo atualizados em tempo real.'
    },
    {
        icon: Users,
        title: 'Gestão de Elenco',
        description: 'Controle de inscritos, fotos dos jogadores e histórico de cada atleta.'
    }
]

export function SolutionSection() {
    return (
        <section className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">

                <div className="flex flex-col lg:flex-row items-center gap-16">

                    <div className="lg:w-1/2">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
                        >
                            Tudo o que você precisa <br />
                            <span className="text-green-500">em um só lugar</span>
                        </motion.h2>
                        <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                            O LigaOn resolve a parte chata da organização para você focar no que importa: o jogo.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="space-y-3"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                                    <p className="text-sm text-zinc-500">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>

                        <Button asChild size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-lg h-12 px-8">
                            <Link href="/criar">
                                Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                    </div>

                    <div className="lg:w-1/2 relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-purple-500/20 rounded-2xl blur-2xl -z-10" />
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl skew-y-1 transform hover:skew-y-0 transition-transform duration-500">
                            {/* Abstract representation of the dashboard */}
                            <div className="aspect-video bg-zinc-950 rounded-lg overflow-hidden relative border border-zinc-800">
                                <Image
                                    src="/screens/tabela.png"
                                    alt="Tabela do Campeonato, Jogos e Classificação do LigaOn"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    )
}
