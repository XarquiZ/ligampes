'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, FileSpreadsheet, MessageCircle, XCircle } from 'lucide-react'

const pains = [
    {
        icon: MessageCircle,
        color: 'text-green-500',
        title: 'Estresse no WhatsApp',
        description: 'Centenas de mensagens, ninguém lê as regras e você perde horas explicando.'
    },
    {
        icon: FileSpreadsheet,
        color: 'text-blue-500',
        title: 'Planilhas Confusas',
        description: 'Só você entende, difícil de atualizar e visualmente ruim para os times.'
    },
    {
        icon: XCircle,
        color: 'text-red-500',
        title: 'Discussões por Artilharia',
        description: 'Quem fez o gol? Sem um sistema oficial, as brigas são inevitáveis.'
    },
    {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        title: 'Falta de Credibilidade',
        description: 'Campeonato desorganizado afasta times bons e patrocinadores.'
    }
]

export function PainSection() {
    return (
        <section className="py-24 bg-zinc-900/30 border-y border-white/5">
            <div className="container mx-auto px-6">

                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-zinc-100">
                        Cansado de organizar campeonato na "mão"?
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Você ama organizar, mas odeia a confusão. A gente entende.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pains.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900"
                        >
                            <div className={`w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 ${item.color}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    )
}
