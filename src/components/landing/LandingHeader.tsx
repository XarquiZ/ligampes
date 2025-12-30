'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export function LandingHeader() {
    const pathname = usePathname()
    const isHome = pathname === '/'

    return (
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md fixed top-0 w-full z-50">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">

                {/* Logo */}
                {isHome ? (
                    <div
                        className="flex items-center gap-2 group cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="relative w-40 h-12 transition-opacity hover:opacity-80">
                            <Image
                                src="/LOGO.png"
                                alt="Liga.On Logo"
                                fill
                                className="object-contain cursor-pointer"
                                priority
                            />
                        </div>
                    </div>
                ) : (
                    <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                        <div className="relative w-40 h-12 transition-opacity hover:opacity-80">
                            <Image
                                src="/LOGO.png"
                                alt="Liga.On Logo"
                                fill
                                className="object-contain cursor-pointer"
                                priority
                            />
                        </div>
                    </Link>
                )}

                {/* Nav Desktop - Removed as per request */}
                <div className="hidden md:flex" />

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800 hidden sm:inline-flex">
                        <Link href="/login">Acompanhar Solicitação</Link>
                    </Button>
                    <Button asChild className="font-bold bg-green-500 hover:bg-green-600 text-zinc-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300">
                        <Link href="/criar">Criar Liga Grátis</Link>
                    </Button>
                </div>
            </div>
        </header>
    )
}
