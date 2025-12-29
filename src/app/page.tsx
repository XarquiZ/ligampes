import Link from 'next/link'
import { ArrowRight, Trophy, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-red-500/30">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-red-600 to-orange-600 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
              MINHA LIGA VIRTUAL
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Preços</Link>
            <Link href="#contact" className="hover:text-white transition-colors">Contato</Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Link temporário para testar a liga migrada */}
            <Link href="http://mpes.localhost:3000/dashboard">
              <span className="text-xs text-zinc-500 hover:text-white transition-colors mr-2">
                Ir para Liga MPES (Dev)
              </span>
            </Link>
            <Button className="bg-white text-black hover:bg-zinc-200">
              Criar minha Liga
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Plataforma Multi-Tenant Disponível
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 animate-in fade-in slide-in-from-bottom-8 duration-700">
            Gerencie seu Campeonato<br />
            <span className="text-white">Como um Profissional</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            A solução completa para organizar ligas de eSports. Tabelas, leilões, transferências e estatísticas em tempo real em um site exclusivo para sua organização.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 w-full md:w-auto">
              Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-zinc-800 hover:bg-zinc-900 w-full md:w-auto">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-zinc-900/30 border-t border-zinc-800/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Trophy className="w-8 h-8 text-yellow-500" />}
              title="Gestão de Campeonatos"
              description="Crie tabelas, fases eliminatórias e agende partidas com facilidade. Tudo automatizado."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-500" />}
              title="Mercado & Leilões"
              description="Sistema completo de transferências com leilões em tempo real e controle financeiro."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-green-500" />}
              title="Site Exclusivo"
              description="Sua liga ganha um subdomínio próprio (sua-liga.minhaligavirtual.com) com sua identidade."
            />
          </div>
        </div>
      </section>

    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="mb-6 bg-zinc-900/50 w-16 h-16 rounded-xl flex items-center justify-center border border-zinc-800">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}