'use client'

import { MapPin } from 'lucide-react'

export function SocialProof() {
    return (
        <section className="py-12 border-y border-white/5 bg-zinc-900/20">
            <div className="container mx-auto px-6 text-center">
                <p className="text-zinc-500 mb-6 font-medium uppercase tracking-wider text-sm">
                    A plataforma escolhida por quem organiza de verdade
                </p>

                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-2 text-zinc-400 font-bold text-xl">
                        <MapPin className="text-green-500" /> Ligas em todo o Brasil
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 font-bold text-xl">
                        <MapPin className="text-green-500" /> Futsal, Society e Campo
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 font-bold text-xl">
                        <MapPin className="text-green-500" /> Escolinhas e Projetos
                    </div>
                </div>
            </div>
        </section>
    )
}
