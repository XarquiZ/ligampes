'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export function BentoGrid() {
    return (
        <section className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Item 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="group relative h-[400px] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900"
                    >
                        <div className="absolute inset-0">
                            <Image
                                src="/screens/negociacoes.png"
                                alt="Negociações de Mercado"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-8">
                            <h3 className="text-2xl font-bold text-white mb-2">Negociações Diretas</h3>
                            <p className="text-zinc-400">Interaja com outros managers, faça propostas e feche contratações.</p>
                        </div>
                    </motion.div>

                    {/* Item 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="group relative h-[400px] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900"
                    >
                        <div className="absolute inset-0">
                            <Image
                                src="/screens/jogadores.png"
                                alt="Database Global"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-8">
                            <h3 className="text-2xl font-bold text-white mb-2">Database Global</h3>
                            <p className="text-zinc-400">Mais de 700 jogadores reais com atributos atualizados e fotos.</p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    )
}
