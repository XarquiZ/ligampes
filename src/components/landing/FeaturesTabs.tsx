'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LayoutDashboard, Share2, Wallet, Check } from 'lucide-react'

const features = {
    gestao: {
        icon: LayoutDashboard,
        title: "Gestão Profissional",
        items: ["Criação de Times e Jogadores", "Tabelas Automáticas", "Súmula Digital"],
        imageGradient: "from-blue-600 to-indigo-900"
    },
    engajamento: {
        icon: Share2,
        title: "Engajamento Social",
        items: ["Gerador de Cards para Instagram", "Artilharia e Assistências", "Ranking ELO dos Jogadores"],
        imageGradient: "from-purple-600 to-pink-900"
    },
    financeiro: {
        icon: Wallet,
        title: "Controle Financeiro",
        items: ["Pagamento de Mensalidades", "Multas e Recebimentos", "Fluxo de Caixa da Liga"],
        imageGradient: "from-green-600 to-emerald-900"
    }
}

export function FeaturesTabs() {
    const [activeTab, setActiveTab] = useState("gestao")

    return (
        <section className="py-24 bg-zinc-900/30 border-y border-zinc-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Por Dentro do Sistema</h2>
                    <p className="text-zinc-400">Ferramentas poderosas para quem exige o melhor.</p>
                </div>

                <Tabs defaultValue="gestao" className="max-w-5xl mx-auto" onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 w-full bg-zinc-950 p-1 border border-zinc-800 rounded-xl mb-12 h-auto">
                        <TabsTrigger value="gestao" className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-4 gap-2 hover:text-white transition-colors">
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="hidden md:inline">Gestão</span>
                        </TabsTrigger>
                        <TabsTrigger value="engajamento" className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-4 gap-2 hover:text-white transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="hidden md:inline">Engajamento</span>
                        </TabsTrigger>
                        <TabsTrigger value="financeiro" className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-4 gap-2 hover:text-white transition-colors">
                            <Wallet className="w-5 h-5" />
                            <span className="hidden md:inline">Financeiro</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="grid md:grid-cols-2 gap-12 items-center min-h-[400px]">
                        {/* Text Content */}
                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="text-3xl font-bold mb-6">{features[activeTab as keyof typeof features].title}</h3>
                                    <ul className="space-y-4">
                                        {features[activeTab as keyof typeof features].items.map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-lg text-zinc-300">
                                                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-green-500" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Visual Content */}
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    className={`aspect-video rounded-2xl bg-gradient-to-br ${features[activeTab as keyof typeof features].imageGradient} shadow-2xl border border-white/10 flex items-center justify-center relative overflow-hidden`}
                                >
                                    {/* Mockup Pattern */}
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                                    <div className="text-white/50 font-mono text-xl">{features[activeTab as keyof typeof features].title} Mockup</div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                </Tabs>
            </div>
        </section>
    )
}
