'use client'

import Link from 'next/link'
import Image from 'next/image'

export function LandingFooter() {
    return (
        <footer className="py-12 border-t border-zinc-900 bg-zinc-950 text-center md:text-left">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 justify-center md:justify-start mb-4">
                            <div className="relative w-32 h-10">
                                <Image
                                    src="/LOGO.png"
                                    alt="Liga.On Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </Link>
                        <p className="text-zinc-500 text-sm max-w-xs mx-auto md:mx-0">
                            A plataforma definitiva para gestão de campeonatos. Infraestrutura dedicada e suporte concierge.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><Link href="#" className="hover:text-green-400 transition-colors">Funcionalidades</Link></li>
                            <li><Link href="#" className="hover:text-green-400 transition-colors">Preços</Link></li>
                            <li><Link href="#" className="hover:text-green-400 transition-colors">Showcase</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><Link href="/legal" className="hover:text-green-400 transition-colors">Termos de Uso</Link></li>
                            <li><Link href="/legal" className="hover:text-green-400 transition-colors">Privacidade</Link></li>
                            <li><Link href="/contato" className="hover:text-green-400 transition-colors">Contato</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-xs gap-4">
                    <p>&copy; {new Date().getFullYear()} Liga.On - Todos os direitos reservados.</p>
                    <p>Develop by Wellinton Batista</p>
                </div>
            </div>
        </footer>
    )
}
