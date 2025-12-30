"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    BarChart3,
    Users,
    Trophy,
    Settings,
    LogOut,
    LayoutDashboard,
    ExternalLink,
    Shirt
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface AdminSidebarProps {
    slug: string
}

export function AdminSidebar({ slug }: AdminSidebarProps) {
    const pathname = usePathname()

    const links = [
        {
            href: `/${slug}/admin`,
            label: "Visão Geral",
            icon: LayoutDashboard,
            active: pathname === `/${slug}/admin`,
        },
        {
            href: `/${slug}/admin/times`,
            label: "Times",
            icon: Shirt,
            active: pathname.startsWith(`/${slug}/admin/times`),
        },
        {
            href: `/${slug}/admin/campeonatos`,
            label: "Campeonatos",
            icon: Trophy,
            active: pathname.startsWith(`/${slug}/admin/campeonatos`),
        },
        {
            href: `/${slug}/admin/jogadores`,
            label: "Jogadores",
            icon: Users,
            active: pathname.startsWith(`/${slug}/admin/jogadores`),
        },
        {
            href: `/${slug}/admin/financeiro`,
            label: "Financeiro",
            icon: BarChart3,
            active: pathname.startsWith(`/${slug}/admin/financeiro`),
        },
        {
            href: `/${slug}/admin/configuracoes`,
            label: "Configurações",
            icon: Settings,
            active: pathname.startsWith(`/${slug}/admin/configuracoes`),
        },
    ]

    return (
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-col h-screen sticky top-0">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                <Link href={`/${slug}/admin`} className="relative w-32 h-8">
                    <Image
                        src="/LOGO.png"
                        alt="Liga.On Logo"
                        fill
                        className="object-contain object-left"
                    />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                            link.active
                                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                        )}
                    >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                    </Link>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 space-y-2">
                <Button variant="outline" asChild className="w-full justify-start gap-2 border-zinc-800 hover:bg-zinc-800 text-zinc-400">
                    <Link href={`/${slug}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                        Ver Site Público
                    </Link>
                </Button>
                <form action="/auth/signout" method="post">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut className="w-4 h-4" />
                        Sair
                    </Button>
                </form>
            </div>
        </aside>
    )
}
