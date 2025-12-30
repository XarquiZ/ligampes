'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Server } from 'lucide-react'

export function WaitTimeExplanation() {
    return (
        <section className="py-20 bg-zinc-950">
            <div className="container mx-auto px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative p-8 md:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden group hover:border-green-500/30 transition-colors"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">

                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700 flex items-center justify-center shadow-lg">
                                <Server className="w-10 h-10 text-green-500" />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold mb-3 text-white">Por que não é instantâneo?</h3>
                            <p className="text-zinc-400 leading-relaxed mb-4">
                                Diferente de apps genéricos onde você é &quot;apenas mais um registro&quot; em um banco de dados compartilhado, nós criamos
                                um <span className="text-green-400 font-bold">subdomínio real e isolado</span> (sua-liga.ligaon.com) para você na nossa nuvem.
                            </p>
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-center md:justify-start">
                                <div className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                    Site Blindado
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
                                    <Server className="w-4 h-4 text-purple-500" />
                                    Banco de Dados Exclusivo
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mt-4 italic">
                                &quot;A qualidade leva um pouquinho de tempo, mas a performance dura para sempre.&quot;
                            </p>
                        </div>

                    </div>
                </motion.div>
            </div>
        </section>
    )
}
