'use client'

import { motion } from 'framer-motion'
import { UserPlus, ServerCog, Rocket } from 'lucide-react'

const steps = [
    {
        icon: UserPlus,
        title: "1. Reserva (O Cadastro)",
        description: "Você cria sua conta, escolhe o nome da liga e garante seu endereço exclusivo (ex: ligaon.com/sualiga).",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    },
    {
        icon: ServerCog,
        title: "2. Configuração Dedicada",
        description: "Nossa equipe sobe sua infraestrutura manualmente para garantir performance máxima. Você recebe um e-mail confirmando o início.",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        pulse: true
    },
    {
        icon: Rocket,
        title: "3. Liberação e Acesso",
        description: "Em até 24h, você recebe o 'Golden Ticket' no seu e-mail e WhatsApp para realizar o pagamento e assumir o controle total.",
        color: "text-green-500",
        bg: "bg-green-500/10",
        border: "border-green-500/20"
    }
]

export function HowItWorks() {
    return (
        <section className="py-24 bg-zinc-950 relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-4"
                    >
                        Do Cadastro ao Kick-off em 3 Passos
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-400 text-lg"
                    >
                        Entenda nosso modelo Concierge de ativação.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-zinc-800 md:-translate-x-1/2" />

                    <div className="space-y-12 md:space-y-24">
                        {steps.map((step, index) => {
                            const isEven = index % 2 === 0
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.5, delay: index * 0.2 }}
                                    className={`flex flex-col md:flex-row gap-8 items-start md:items-center relative ${isEven ? 'md:flex-row-reverse' : ''}`}
                                >
                                    {/* Icon Bubble */}
                                    <div className={`absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-zinc-950 border-4 border-zinc-900 z-10 flex items-center justify-center ${step.pulse ? 'shadow-[0_0_20px_rgba(168,85,247,0.4)]' : ''}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.bg} ${step.color}`}>
                                            <step.icon className={`w-6 h-6 ${step.pulse ? 'animate-pulse' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className={`pl-20 md:pl-0 w-full md:w-1/2 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                                        <div className={`p-6 rounded-2xl bg-zinc-900/50 border ${step.border} hover:border-opacity-50 transition-colors`}>
                                            <h3 className={`text-xl font-bold mb-2 ${step.color}`}>{step.title}</h3>
                                            <p className="text-zinc-400 leading-relaxed">{step.description}</p>
                                        </div>
                                    </div>

                                    {/* Empty Spacer for alternating layout */}
                                    <div className="hidden md:block w-1/2" />

                                </motion.div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </section>
    )
}
