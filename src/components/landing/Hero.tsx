'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Rocket, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroImage } from './HeroImage'

export function Hero() {
    return (
        <section className="relative pt-32 pb-32 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm text-green-400 mb-8 shadow-lg shadow-black/50 backdrop-blur-sm"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    A plataforma oficial do futebol amador
                </motion.div>

                {/* Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
                >
                    Crie sua liga amadora<br />
                    em <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Minutos</span>.
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed"
                >
                    Tabela, jogos, artilharia e estatísticas em um só lugar. Profissionalize seu campeonato sem dor de cabeça.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12"
                >
                    <div className="flex flex-col items-center gap-2">
                        <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-green-500 hover:bg-green-600 text-zinc-950 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all">
                            <Link href="/criar">
                                Criar minha liga agora <Rocket className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                        <span className="text-xs text-zinc-500 font-medium tracking-wide">
                            Gratuito para começar • Sem cartão
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-2 sm:mt-[-24px]">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-300 hover:text-white backdrop-blur-sm">
                            <PlayCircle className="mr-2 w-5 h-5 text-purple-500" /> Ver Exemplo
                        </Button>
                    </div>

                </motion.div>


                {/* Dashboard Preview */}
                <HeroImage />

            </div>
        </section >
    )
}
