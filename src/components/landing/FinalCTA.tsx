'use client'

import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function FinalCTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-green-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 text-center">

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-black mb-8 leading-tight"
                >
                    Seu campeonato <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">merece ser profissional.</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto"
                >
                    Junte-se a centenas de organizadores que deixaram o papel e a caneta para trás.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <Button asChild size="lg" className="h-16 px-10 text-xl font-bold bg-green-500 hover:bg-green-600 text-zinc-950 shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all transform hover:scale-105">
                        <Link href="/criar">
                            Crie sua liga amadora agora <Rocket className="ml-3 w-6 h-6" />
                        </Link>
                    </Button>
                    <p className="mt-4 text-sm text-zinc-500">Leva menos de 2 minutos • Sem cartão de crédito</p>
                </motion.div>

            </div>
        </section>
    )
}
