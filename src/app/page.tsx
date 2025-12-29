import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Trophy,
  Shield,
  Users,
  Gamepad2,
  Table,
  Share2,
  BarChart3,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Rocket,
  Check,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-green-500/30 font-sans scroll-smooth">

      {/* --- HEADER --- */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-green-500 to-emerald-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/20">
              <Trophy className="w-6 h-6 text-zinc-950 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              LIGA<span className="text-green-500">.ON</span>
            </span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#features" className="hover:text-green-400 transition-colors">Funcionalidades</Link>
            <Link href="#games" className="hover:text-green-400 transition-colors">Jogos</Link>
            <Link href="#pricing" className="hover:text-green-400 transition-colors">Preços</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button className="font-bold bg-green-500 hover:bg-green-600 text-zinc-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300">
              Criar Liga Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm text-green-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg shadow-black/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            A Plataforma Definitiva para sua Liga
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700">
            leve seu campeonato<br />
            para o <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Próximo Nível</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 leading-relaxed">
            Gestão profissional para campeonatos de Games e Esportes Reais. Automatize tabelas, leilões e estatísticas enquanto você foca na resenha.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 animate-in fade-in slide-in-from-bottom-16 duration-1000 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-green-500 hover:bg-green-600 text-zinc-950 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all">
              Começar Agora <Rocket className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-300 hover:text-white backdrop-blur-sm">
              <PlayCircle className="mr-2 w-5 h-5 text-purple-500" /> Ver Exemplo ao Vivo
            </Button>
          </div>

          {/* Mockup Hardware */}
          <div className="w-full max-w-5xl aspect-video rounded-xl bg-zinc-900/50 border border-zinc-800 shadow-2xl relative overflow-hidden group animate-in fade-in zoom-in-95 duration-1000 flex items-center justify-center">
            <Image
              src="/hero.png"
              alt="Painel Administrativo LigaOn"
              fill
              className="object-cover"
              priority
            />
            {/* Glow Behind Mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </div>

        </div>
      </section>

      {/* --- FEATURE HIGHLIGHTS (BENTO GRID REFINED) --- */}
      <section id="features" className="py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Funcionalidades de Elite</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Ferramentas poderosas para quem exige o melhor. Tudo automatizado para você não perder tempo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

            {/* Leilões e Mercado */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-green-500/30 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <div className="mb-4 inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Mercado & Leilões Ao Vivo</h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    O coração da liga. Realize leilões em tempo real, gerencie propostas de transferência e controle orçamentos.
                    Seu campeonato com a emoção de um manager profissional.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Leilão em tempo real</li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Multas rescisórias automáticas</li>
                    <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Controle financeiro rigoroso</li>
                  </ul>
                </div>
                {/* Visual Placeholder */}
                <div className="w-full md:w-1/3 bg-zinc-950 rounded-xl border border-zinc-800 h-40 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 to-zinc-950" />
                  <p className="text-zinc-700 text-xs font-mono">Mockup Leilão</p>
                </div>
              </div>
            </div>

            {/* Gerador de Conteúdo */}
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/30 transition-all group relative overflow-hidden">
              <div className="mb-6 inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <Share2 className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gerador de Cards</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Engaje sua comunidade no Instagram. Gere cards de resultados, artilharia e "Dia de Jogo" automaticamente.
              </p>
              <div className="w-full bg-zinc-950 rounded-lg p-3 border border-zinc-800 flex justify-center">
                <div className="w-20 h-28 bg-gradient-to-br from-purple-900/50 to-zinc-900 border border-purple-500/20 rounded shadow-lg transform rotate-3" />
                <div className="w-20 h-28 bg-gradient-to-br from-green-900/50 to-zinc-900 border border-green-500/20 rounded shadow-lg transform -rotate-3 -ml-10" />
              </div>
            </div>

            {/* Gestão Financeira */}
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-yellow-500/30 transition-all group relative overflow-hidden">
              <div className="mb-6 inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <Table className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestão Financeira</h3>
              <p className="text-zinc-400 text-sm">
                Cada time tem seu caixa. Receba premiações por vitórias, pague salários e multe quem não cumpre as regras.
              </p>
            </div>

            {/* ELO & Stats */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col items-start justify-center">
              <div className="flex gap-4 items-center mb-4">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800"><BarChart3 className="w-6 h-6 text-blue-500" /></div>
                <h3 className="text-xl font-bold">Estatísticas & Ranking ELO</h3>
              </div>
              <p className="text-zinc-400 text-sm max-w-xl">
                Vá além da tabela de pontos. Nosso sistema calcula o ELO (Skill Rating) de cada jogador baseado na dificuldade dos oponentes.
                Descubra quem é realmente o melhor da liga.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- GAMES SECTION --- */}
      <section id="games" className="py-24 bg-zinc-900/30 border-t border-zinc-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Sua Liga, Suas Regras</h2>
            <p className="text-zinc-400">Plataforma otimizada para os principais jogos competitivos do mercado.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {/* PES / FIFA */}
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden hover:border-green-500/50 transition-all group">
              <div className="h-48 relative flex items-center justify-center overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=800&auto=format&fit=crop"
                  alt="Futebol Virtual"
                  fill
                  className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">Futebol Virtual</h3>
                  <p className="text-green-400 text-xs font-bold mt-1 bg-zinc-950/80 px-3 py-1 rounded-full border border-green-500/30 inline-block">PES & FIFA / EA FC</p>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Master League Online</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400 text-sm space-y-4">
                <p>
                  A experiência definitiva de Manager. Monte seu elenco através de leilões, negocie com outros players e gerencie o saldo do seu clube.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Mercado</Badge>
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Súmulas</Badge>
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Artilharia</Badge>
                </div>
              </CardContent>
            </Card>

            {/* NBA / BASQUETE */}
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden hover:border-orange-500/50 transition-all group">
              <div className="h-48 relative flex items-center justify-center overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop"
                  alt="Basquete"
                  fill
                  className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">Basquete</h3>
                  <p className="text-orange-400 text-xs font-bold mt-1 bg-zinc-950/80 px-3 py-1 rounded-full border border-orange-500/30 inline-block">NBA 2K & LIVE</p>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Dynasty Mode Online</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400 text-sm space-y-4">
                <p>
                  Gerencie sua franquia com teto salarial (Salary Cap/Luxury Tax). Sistema de Draft e trocas complexas para os fãs hardcore da liga.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Draft</Badge>
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Salary Cap</Badge>
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Playoffs</Badge>
                </div>
              </CardContent>
            </Card>

            {/* REAL SPORTS */}
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden hover:border-blue-500/50 transition-all group">
              <div className="h-48 relative flex items-center justify-center overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800&auto=format&fit=crop"
                  alt="Futebol Society"
                  fill
                  className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">Esportes Reais</h3>
                  <p className="text-blue-400 text-xs font-bold mt-1 bg-zinc-950/80 px-3 py-1 rounded-full border border-blue-500/30 inline-block">SOCIETY & VÁRZEA</p>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Gestão de Peladas</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400 text-sm space-y-4">
                <p>
                  Organize o futebol de domingo. Controle mensalidades, gere a tabela de jogos e mantenha o histórico de quem é o "pato" da turma.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Pagamentos</Badge>
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Presença</Badge>
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">Ranking</Badge>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos Simples</h2>
            <p className="text-zinc-400">Escolha como prefere investir na sua diversão.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Mensal */}
            <Card className="bg-zinc-900 border-zinc-800 relative">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Mensal</CardTitle>
                <CardDescription>Flexibilidade total para você.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">R$ 30,00</span>
                  <span className="text-zinc-500"> / mês</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Todas as funcionalidades liberadas</li>
                  <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Sem limite de participantes</li>
                  <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Cancele quando quiser</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-zinc-800 hover:bg-zinc-700">Escolher Mensal</Button>
              </CardFooter>
            </Card>

            {/* Anual */}
            <Card className="bg-zinc-900 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden transform md:-translate-y-4">
              <div className="absolute top-0 right-0 p-4">
                <Badge className="bg-green-500 hover:bg-green-600 text-zinc-950 font-bold">ECONOMIZE R$ 60</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Anual</CardTitle>
                <CardDescription className="text-green-400">A escolha mais inteligente.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">R$ 300,00</span>
                  <span className="text-zinc-500"> / ano</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-white font-medium text-sm"><Check className="w-4 h-4 text-green-500" /> 2 meses Grátis</li>
                  <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Suporte prioritário no WhatsApp</li>
                  <li className="flex items-center gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-green-500" /> Acesso antecipado a novas features</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-zinc-950 font-bold">Escolher Anual</Button>
              </CardFooter>
            </Card>

          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF (REALISTIC) --- */}
      <section className="py-20 border-b border-zinc-900 bg-zinc-900/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center rounded-2xl p-8 border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <p className="text-green-500 font-bold tracking-wider text-sm uppercase mb-1">Acesso Antecipado</p>
              <h2 className="text-2xl font-bold">Junte-se aos Pioneiros</h2>
            </div>
            <div className="flex gap-8 md:gap-16 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-black text-white mb-1">BETA</p>
                <p className="text-zinc-500 text-sm">Versão Atual</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-black text-white mb-1">100%</p>
                <p className="text-zinc-500 text-sm">Focado em Games</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-black text-white mb-1">24h</p>
                <p className="text-zinc-500 text-sm">Suporte Dedicado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 bg-zinc-950">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
            <p className="text-zinc-400">Tire suas dúvidas antes de começar sua liga.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-zinc-800">
              <AccordionTrigger className="text-left text-lg hover:text-green-400 hover:no-underline">Serve para campeonato de PES 2021?</AccordionTrigger>
              <AccordionContent className="text-zinc-400">
                Com certeza! Temos suporte nativo para eFootball (PES) de todas as versões, incluindo PES 2021. O sistema já possui logos e nomes de times pré-configurados.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-zinc-800">
              <AccordionTrigger className="text-left text-lg hover:text-green-400 hover:no-underline">Posso usar para futebol society/várzea?</AccordionTrigger>
              <AccordionContent className="text-zinc-400">
                Sim! A LIGA.ON é extremamente flexível. Você pode criar um campeonato de futebol real, cadastrar seus amigos como jogadores, registrar súmulas e ter artilharia e classificação automática.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-zinc-800">
              <AccordionTrigger className="text-left text-lg hover:text-green-400 hover:no-underline">É gratuito para criar?</AccordionTrigger>
              <AccordionContent className="text-zinc-400">
                Você pode criar sua liga e testar todas as funcionalidades gratuitamente. Temos planos premium para ligas maiores que precisam de recursos avançados ou mais participantes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-zinc-800">
              <AccordionTrigger className="text-left text-lg hover:text-green-400 hover:no-underline">Funciona no celular?</AccordionTrigger>
              <AccordionContent className="text-zinc-400">
                Totalmente. Desenvolvemos a plataforma pensando &quot;Mobile First&quot;. Seus participantes conseguirão ver a tabela, enviar resultados e negociar jogadores diretamente pelo smartphone.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-zinc-900 bg-zinc-950 text-center md:text-left">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 justify-center md:justify-start mb-4">
                <div className="bg-gradient-to-tr from-green-500 to-emerald-600 p-1.5 rounded-lg">
                  <Trophy className="w-4 h-4 text-zinc-950 fill-current" />
                </div>
                <span className="text-xl font-black tracking-tighter text-white">
                  LIGA<span className="text-green-500">.ON</span>
                </span>
              </Link>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto md:mx-0">
                A plataforma definitiva para gestão de campeonatos virtuais e reais. Feito com 💚 para a comunidade.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#features" className="hover:text-green-400 transition-colors">Funcionalidades</Link></li>
                <li><Link href="#pricing" className="hover:text-green-400 transition-colors">Preços</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Showcase</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-green-400 transition-colors">Termos de Uso</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Privacidade</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Contato</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-xs gap-4">
            <p>&copy; {new Date().getFullYear()} Liga.On - Todos os direitos reservados.</p>
            <p>Develop by Wellinton Batista</p>
          </div>
        </div>
      </footer>
    </div>
  )
}