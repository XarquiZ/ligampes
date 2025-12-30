import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
            <LandingHeader />

            <main className="flex-1 container mx-auto px-6 py-32 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Central Legal LIGA.ON</h1>
                    <p className="text-zinc-400">Transparência e conformidade para sua liga.</p>
                </div>

                <Tabs defaultValue="terms" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-900 p-1 mb-8">
                        <TabsTrigger value="terms" className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white hover:text-zinc-200 transition-colors">Termos de Uso</TabsTrigger>
                        <TabsTrigger value="privacy" className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white hover:text-zinc-200 transition-colors">Política de Privacidade</TabsTrigger>
                    </TabsList>

                    <TabsContent value="terms">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Termos de Uso</CardTitle>
                                <CardDescription className="text-zinc-400">Última atualização: Dezembro 2025</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-zinc-300 leading-relaxed">
                                <div>
                                    <h3 className="text-white font-bold mb-2">1. Aceitação</h3>
                                    <p>Ao criar uma conta no LIGA.ON, você concorda com estes termos. O serviço é fornecido "como está" para gestão de campeonatos de e-sports.</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">2. O Modelo de Serviço</h3>
                                    <p>O LIGA.ON opera num modelo de configuração assistida. Ao criar sua conta, você entende que a liberação do ambiente (servidor e domínio) pode levar até 1 dia útil para ser configurada pela nossa equipe técnica.</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">3. Contas e Pagamentos</h3>
                                    <p>Você é responsável por manter sua senha segura. Planos pagos são renovados automaticamente (mensal ou anual) até que você cancele. O reembolso pode ser solicitado em até 7 dias após a primeira compra.</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">4. Uso Aceitável</h3>
                                    <p>É proibido usar a plataforma para organizar atividades ilegais, jogos de azar não regulamentados ou conteúdo ofensivo. Reservamo-nos o direito de suspender contas que violem esta regra.</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">5. Propriedade Intelectual</h3>
                                    <p>Todo o código e design da plataforma pertencem ao LIGA.ON. Os dados dos seus campeonatos (nomes de times, tabelas) pertencem a você.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Política de Privacidade e LGPD</CardTitle>
                                <CardDescription className="text-zinc-400">Como cuidamos dos seus dados.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-zinc-300 leading-relaxed">
                                <div>
                                    <h3 className="text-white font-bold mb-2">1. Coleta de Dados</h3>
                                    <p>Coletamos seu Nome, E-mail e dados de uso para fornecer o serviço.</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">2. Uso das Informações</h3>
                                    <p>Seus dados são usados para: autenticação (login), comunicação sobre o status do seu servidor (via E-mail/WhatsApp) e processamento de pagamentos.</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">3. Compartilhamento</h3>
                                    <p>Não vendemos seus dados. Compartilhamos apenas com parceiros essenciais para o funcionamento: Vercel (Hospedagem), Supabase (Banco de Dados) e Stripe (Pagamentos).</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">4. Seus Direitos (LGPD)</h3>
                                    <p>Você pode solicitar a exportação ou exclusão completa dos seus dados a qualquer momento enviando um e-mail para o suporte.</p>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">5. Cookies</h3>
                                    <p>Utilizamos cookies apenas para manter sua sessão de login ativa.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <LandingFooter />
        </div>
    )
}
