'use client'

import { motion } from 'framer-motion'
import { UserPlus, CalendarDays, Share2 } from 'lucide-react'

const steps = [
    {
        number: '01',
        icon: UserPlus,
        title: 'Crie sua Liga',
        description: 'Cadastre-se em segundos. Dê um nome, escolha o esporte e pronto.'
    },
    {
        number: '02',
        icon: CalendarDays,
        title: 'Adicione Times e Jogos',
        description: 'Cadastre as equipes e gere a tabela de jogos automaticamente, ou manualmente se preferir.'
    },
    {
        number: '03',
        icon: Share2,
        title: 'Compartilhe',
        description: 'Envie o link para os capitães. Todo mundo acompanha a classificação e estatísticas pelo celular.'
    }
]

export function HowItWorks() {
    return (
        <section className="py-24 bg-zinc-900/30 border-y border-white/5">
            <div className="container mx-auto px-6">

                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                        Simples como deve ser
                    </h2>
                    <p className="text-zinc-400">
                        Esqueça softwares complexos. Aqui você resolve tudo em 3 passos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-zinc-800 via-green-500/50 to-zinc-800 border-t border-dashed border-zinc-700 -z-10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className="relative flex flex-col items-center text-center"
                        >
                            <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl relative group">
                                <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <step.icon className="w-10 h-10 text-green-500" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                                    {step.number}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-zinc-400 leading-relaxed max-w-xs">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    )
}
