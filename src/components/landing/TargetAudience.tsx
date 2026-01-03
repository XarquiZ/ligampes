'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

export function TargetAudience() {
    return (
        <section className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">

                    {/* Para quem é */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-green-500/5 border border-green-500/20 rounded-3xl p-8"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                            Perfeito para:
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Organizadores de campeonatos amadores',
                                'Ligas de Bairro e Várzea',
                                'Torneios de Futsal e Society',
                                'Escolinhas de Futebol',
                                'Grupos de amigos (Racha/Pelada)'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-zinc-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Para quem NÃO é */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 opacity-80"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <XCircle className="w-8 h-8 text-red-500" />
                            Não é para:
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Clubes de Futebol Profissional',
                                'Sites de Apostas (Bet)',
                                'Quem busca transmissão ao vivo de jogos',
                                'Venda de ingressos online'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                </div>

            </div>
        </section>
    )
}
