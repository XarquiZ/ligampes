'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
    ScrollText,
    Gamepad2,
    MessageCircle,
    Clock,
    Ban,
    AlertTriangle,
    BookOpen,
    Crosshair,
    Settings,
    Target,
    ArrowRight,
    Youtube,
    HelpCircle,
    Mail,
    ChevronDown,
    Gavel,
    X,
    Monitor,
    Download,
    ExternalLink,
    Users,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';
import FloatingChatButton from '@/components/FloatingChatButton';
import ChatPopup from '@/components/Chatpopup';
import { RulesEditorModal } from '@/components/informacoes/RulesEditorModal';
import { cn } from '@/lib/utils';
import { Edit } from 'lucide-react';

// Configuração das Seções
const sectionConfig = {
    regras: {
        label: 'Regras Oficiais',
        icon: Gavel,
        color: 'indigo-600',
        shadow: 'shadow-indigo-600/20'
    },
    manual: {
        label: 'Manual PES 2021',
        icon: BookOpen,
        color: 'indigo-600',
        shadow: 'shadow-indigo-600/20'
    },
    tutoriais: {
        label: 'Steam Link',
        icon: Monitor,
        color: 'indigo-600',
        shadow: 'shadow-indigo-600/20'
    },
    suporte: {
        label: 'Técnicos',
        icon: Users,
        color: 'indigo-600',
        shadow: 'shadow-indigo-600/20'
    },
    atributos: {
        label: 'Atributos',
        icon: Activity,
        color: 'indigo-600',
        shadow: 'shadow-indigo-600/20'
    }
};

type SectionType = keyof typeof sectionConfig;

export default function InformacoesPage() {
    const router = useRouter();
    const { organization } = useOrganization();
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [team, setTeam] = useState<any>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // State para o Custom Switch
    const [activeSection, setActiveSection] = useState<SectionType>('regras');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [isRulesEditorOpen, setIsRulesEditorOpen] = useState(false);

    // Carregar dados user/profile/team
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }

        const loadData = async () => {
            try {
                // Fetch User Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*, teams(*)')
                    .eq('id', user.id)
                    .eq('organization_id', organization?.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    setTeam(profileData.teams);
                }

                // Fetch All Teams for "Técnicos" tab
                const { data: teamsData } = await supabase
                    .from('teams')
                    .select('*, profiles(coach_name)')
                    .eq('organization_id', organization?.id)
                    .order('name');

                if (teamsData) {
                    setAllTeams(teamsData);
                }

            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        };

        loadData();
    }, [user, authLoading, router, organization?.id]);

    // Carregar mensagens não lidas
    useEffect(() => {
        if (!user?.id) return;
        const loadUnreadCount = async () => {
            try {
                const { data: conversations } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

                if (!conversations?.length) {
                    setUnreadCount(0);
                    return;
                }

                const conversationIds = conversations.map(c => c.id);
                const { count } = await supabase
                    .from('private_messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', conversationIds)
                    .eq('read', false)
                    .neq('sender_id', user.id);

                setUnreadCount(count || 0);
            } catch (error) {
                console.error('Erro msg:', error);
            }
        };
        loadUnreadCount();
    }, [user]);

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="text-white animate-pulse">Carregando...</div>
            </div>
        );
    }

    const chatUser = {
        id: user.id,
        name: profile?.coach_name || user.email || 'Usuário',
        email: user.email || ''
    };

    const chatTeam = {
        id: team?.id || '',
        name: team?.name || 'Sem time',
        divisao: team?.divisao || 'A'
    };

    const ActiveIcon = sectionConfig[activeSection].icon;
    const activeConfig = sectionConfig[activeSection];

    return (
        <div className="flex min-h-screen bg-zinc-950">
            <Sidebar user={user} profile={profile} team={team} organizationId={organization?.id} />

            <div className="flex-1 transition-all duration-300 lg:ml-0 bg-zinc-950/50">
                <div className="p-4 lg:p-8 space-y-8 max-w-6xl mx-auto">

                    {/* Header Page */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <ScrollText className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white">
                                    Central de Informações
                                </h1>
                                <p className="text-zinc-400">
                                    Regras, manuais e suporte da {organization?.name || 'Liga'}
                                </p>
                            </div>
                        </div>
                        {activeSection === 'regras' && profile?.role === 'admin' && (
                            <Button
                                onClick={() => setIsRulesEditorOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Regras
                            </Button>
                        )}
                    </div>

                    {/* CUSTOM SECTION SWITCH */}
                    <div className="relative w-full max-w-xs sm:max-w-none sm:w-fit mx-auto mb-6">

                        {/* Mobile Dropdown */}
                        <div className="sm:hidden">
                            <Button
                                variant="default"
                                size="lg"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={cn(
                                    'w-full justify-between rounded-xl border border-zinc-700 hover:opacity-90 transition-all',
                                    `bg-${activeConfig.color}`,
                                    activeConfig.shadow
                                )}
                            >
                                <div className="flex items-center">
                                    <ActiveIcon className="w-5 h-5 mr-3" />
                                    <span className="font-bold">{activeConfig.label}</span>
                                </div>
                                <ChevronDown className={cn(
                                    'w-5 h-5 transition-transform',
                                    isDropdownOpen && 'transform rotate-180'
                                )} />
                            </Button>

                            {isDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {Object.entries(sectionConfig).filter(([key]) => {
                                            // Se não for mpes, esconde manual, tutoriais e atributos
                                            if (organization?.slug !== 'mpes' && (key === 'manual' || key === 'tutoriais' || key === 'atributos')) {
                                                return false;
                                            }
                                            return true;
                                        }).map(([key, config]) => {
                                            if (key === activeSection) return null;
                                            const Icon = config.icon;
                                            return (
                                                <Button
                                                    key={key}
                                                    variant="ghost"
                                                    size="lg"
                                                    onClick={() => {
                                                        setActiveSection(key as SectionType);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full justify-start rounded-none border-b border-zinc-700 last:border-b-0 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                                                >
                                                    <Icon className="w-5 h-5 mr-3" />
                                                    <span className="font-bold">{config.label}</span>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden sm:flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700 w-fit mx-auto">
                            {Object.entries(sectionConfig).filter(([key]) => {
                                // Se não for mpes, esconde manual, tutoriais e atributos
                                if (organization?.slug !== 'mpes' && (key === 'manual' || key === 'tutoriais' || key === 'atributos')) {
                                    return false;
                                }
                                return true;
                            }).map(([key, config]) => {
                                const Icon = config.icon;
                                const isActive = activeSection === key;
                                return (
                                    <Button
                                        key={key}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveSection(key as SectionType)}
                                        className={cn(
                                            'rounded-lg text-xs font-bold px-4 py-2 transition-all mx-0.5',
                                            isActive
                                                ? `bg-${config.color} text-white shadow-lg ${config.shadow}`
                                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                        )}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {config.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* CONTENT RENDER */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* TAB: REGRAS */}
                        {activeSection === 'regras' && (
                            <div className="space-y-6">
                                <Card className="bg-zinc-900/50 border-indigo-500/30">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-indigo-400 text-xl">
                                            <ScrollText className="w-5 h-5" />
                                            Regras Oficiais – {organization?.name || 'Liga'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-zinc-300 leading-relaxed">
                                        <p>
                                            Para manter o ambiente saudável, competitivo e divertido para todos, siga atentamente as regras abaixo.
                                            O descumprimento pode levar a penalidades severas.
                                        </p>
                                    </CardContent>
                                </Card>

                                {(!organization?.rules || organization.rules.length === 0) ? (
                                    <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                                        <p className="text-zinc-500">Nenhuma regra definida para esta liga ainda.</p>
                                        {profile?.role === 'admin' && (
                                            <Button variant="link" onClick={() => setIsRulesEditorOpen(true)} className="text-indigo-400 mt-2">
                                                Adicionar Regras
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {organization.rules.map((rule: any, index: number) => {
                                            // Map string icon name to component (fallback to ScrollText)
                                            // Since we can't easily dynamically import, we'll try to use the ones imported
                                            // Map for dynamic icons used in rules
                                            const iconMap: any = {
                                                ScrollText,
                                                AlertTriangle,
                                                Ban,
                                                Gamepad2,
                                                MessageCircle,
                                                Clock,
                                                Target,
                                                Users,
                                                CheckCircle: Users // Fallback since CheckCircle isn't imported
                                            };

                                            // Extended map with fallbacks
                                            const IconComp = iconMap[rule.icon] || ScrollText;
                                            const color = rule.color || 'indigo';

                                            return (
                                                <Card key={rule.id} className={`bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 hover:border-${color}-500/30 transition-colors group`}>
                                                    <CardHeader>
                                                        <CardTitle className={`flex items-center gap-3 text-white group-hover:text-${color}-400 transition-colors`}>
                                                            <div className={`p-2 bg-${color}-500/10 rounded-lg group-hover:bg-${color}-500/20 transition-colors`}>
                                                                <IconComp className={`w-6 h-6 text-${color}-500`} />
                                                            </div>
                                                            {index + 1}. {rule.title}
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="text-zinc-400 space-y-4">
                                                        <div className="whitespace-pre-wrap">{rule.content}</div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: MANUAL */}
                        {activeSection === 'manual' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-3 gap-6">

                                    {/* Intro */}
                                    <Card className="md:col-span-2 bg-gradient-to-br from-indigo-900/20 to-zinc-900 border-indigo-500/30">
                                        <CardHeader>
                                            <CardTitle className="text-white text-2xl font-bold flex items-center gap-2">
                                                <Gamepad2 className="w-8 h-8 text-indigo-400" />
                                                O que é PES 2021 com Controles Manuais?
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-zinc-300 space-y-4">
                                            <p className="text-lg leading-relaxed">
                                                Se você é novo na <strong className="text-white">liga MPES</strong> ou nunca jogou <strong className="text-white">PES 2021</strong> no manual, aqui vai uma explicação direta pra entender como funciona e por que esse estilo é tão especial.
                                            </p>
                                            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                                                <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                                    <Settings className="w-5 h-5" />
                                                    O que significa "controle manual"?
                                                </h3>
                                                <p>
                                                    Quando jogamos no manual, significa que o jogo <strong className="text-red-400">não ajuda</strong> a direcionar passes, chutes, cruzamentos ou finalizações.
                                                    Tudo — absolutamente tudo — depende da sua precisão nos direcionais e nos botões.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-6">
                                        <Card className="bg-zinc-800/50 border-zinc-700">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-zinc-400">Configuração</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div
                                                    className="relative w-full aspect-video bg-black/60 rounded-lg overflow-hidden border border-zinc-700 mb-2 group cursor-pointer"
                                                    onClick={() => setIsImageOpen(true)}
                                                >
                                                    <Image
                                                        src="/config-controle.png"
                                                        alt="Configuração do Controle - Manual"
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                        quality={100}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                                                            Ver em tela cheia
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-zinc-400">
                                                    Configure seu controle conforme a imagem acima (Level de Passe: Desligado/Manual).
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* O que muda */}
                                    <Card className="md:col-span-3 bg-zinc-900/50 border-zinc-700">
                                        <CardHeader>
                                            <CardTitle className="text-white text-xl flex items-center gap-2">
                                                <Crosshair className="w-6 h-6 text-green-400" />
                                                O que muda na prática?
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <h4 className="text-green-400 font-bold flex items-center gap-2">
                                                        1. Passes
                                                        <ArrowRight className="w-4 h-4 opacity-50" />
                                                    </h4>
                                                    <p className="text-sm text-zinc-400">
                                                        Você escolhe a força e a direção exatas. Se errar o direcionamento em 1 grau, a bola vai para o lado errado.
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-green-400 font-bold flex items-center gap-2">
                                                        2. Finalizações
                                                        <ArrowRight className="w-4 h-4 opacity-50" />
                                                    </h4>
                                                    <p className="text-sm text-zinc-400">
                                                        O chute precisa ser muito bem calibrado. A direção do analógico e a força influenciam totalmente o resultado (pra fora ou na gaveta).
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-green-400 font-bold flex items-center gap-2">
                                                        3. Cruzamentos
                                                        <ArrowRight className="w-4 h-4 opacity-50" />
                                                    </h4>
                                                    <p className="text-sm text-zinc-400">
                                                        Nada de assistência. Mirou, cruzou. Uma pequena falha pode transformar um cruzamento perfeito em um passe para lateral.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Por que jogar */}
                                    <Card className="md:col-span-3 bg-gradient-to-r from-zinc-900 to-indigo-900/20 border-zinc-800">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg">Por que jogar no manual?</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <li className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                                    <Target className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                                                    <div>
                                                        <strong className="text-white block mb-1">Mais realismo</strong>
                                                        <span className="text-sm text-zinc-400">A partida parece futebol de verdade, onde skill importa mais que cartas.</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                                    <Settings className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                                                    <div>
                                                        <strong className="text-white block mb-1">Mais dificuldade</strong>
                                                        <span className="text-sm text-zinc-400">Exige aprendizado constante, paciência e muita prática. Curva de aprendizado alta.</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                                    <TrophyIcon className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                                                    <div>
                                                        <strong className="text-white block mb-1">Mais mérito</strong>
                                                        <span className="text-sm text-zinc-400">Cada gol é 100% construído por você, não "dado" por scripts ou assistências.</span>
                                                    </div>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* TAB: STEAM LINK */}
                        {activeSection === 'tutoriais' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                                {/* Intro Justification */}
                                <Card className="bg-indigo-900/10 border-indigo-500/30">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-indigo-400 text-xl font-bold">
                                            <Monitor className="w-6 h-6" />
                                            PORQUE MUDAMOS DO PARSEC PARA O STEAM LINK?
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-zinc-300 leading-relaxed">
                                        <p>
                                            Para um melhor desempenho e maior estabilidade dos jogos. Fizemos vários testes e para a grande maioria dos participantes, a melhora foi considerável.
                                            <span className="block mt-2 text-zinc-400 text-sm">
                                                *Quem não conseguir rodar, terá que continuar conectando pelo Parsec.
                                            </span>
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Step 1: Download */}
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-white">
                                            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 font-bold border border-zinc-700">1</div>
                                            Baixe e Instale
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <a
                                            href="https://media.steampowered.com/steamlink/windows/latest/SteamLink.zip"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                                        >
                                            <Download className="w-5 h-5" />
                                            Baixar Steam Link (Windows)
                                        </a>
                                        <p className="mt-2 text-sm text-zinc-500">
                                            Clique no botão acima para baixar o arquivo .zip oficial.
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Step 2: Config Gear */}
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-white">
                                            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 font-bold border border-zinc-700">2</div>
                                            Configuração Inicial
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-zinc-400">Abra o programa instalado e clique na <strong>engrenagem</strong> (Configurações).</p>
                                        <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden border border-zinc-700">
                                            <Image src="/sl1.png" alt="Passo 2 - Engrenagem" fill className="object-contain" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Step 3: Transmissão */}
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-white">
                                            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 font-bold border border-zinc-700">3</div>
                                            Ajustando a Transmissão
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <p className="text-zinc-400 mb-2">Clique em <strong>Transmissão</strong>:</p>
                                            <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden border border-zinc-700 w-full md:w-2/3">
                                                <Image src="/sl2.png" alt="Passo 3 - Transmissão" fill className="object-contain" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-zinc-400 mb-2">Depois clique em <strong>Personalizar</strong> (Opções avançadas):</p>
                                            <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden border border-zinc-700 w-full md:w-2/3">
                                                <Image src="/sl3.png" alt="Passo 3 - Personalizar" fill className="object-contain" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Step 4: Settings Detail */}
                                <Card className="bg-zinc-900/50 border-zinc-800 border-l-4 border-l-indigo-500">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-white">
                                            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 font-bold border border-zinc-700">4</div>
                                            Configuração Recomendada
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20 text-indigo-300 text-sm mb-4 flex gap-2 items-start">
                                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                            Inicialmente coloque todas as configurações IGUAIS a do print abaixo. Com o tempo, podemos ajustar para o seu caso específico.
                                        </div>
                                        <div className="relative aspect-[16/10] bg-black/50 rounded-lg overflow-hidden border border-zinc-700">
                                            <Image src="/sl4.png" alt="Passo 4 - Configurações Detalhadas" fill className="object-contain" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Step 5: Connect */}
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-white">
                                            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 font-bold border border-zinc-700">5</div>
                                            Conectando
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-zinc-400">Volte para a tela inicial e clique em <strong>Outro Computador</strong> para inserir o PIN fornecido pelo Host.</p>
                                        <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden border border-zinc-700">
                                            <Image src="/sl5.png" alt="Passo 5 - Conectar" fill className="object-contain" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Step 6: Disconnect */}
                                <Card className="bg-red-500/10 border-red-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-red-200">
                                            <Ban className="w-6 h-6" />
                                            Como Desconectar Corretamente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-zinc-300 font-medium">
                                            Para sair, segure a tecla <span className="bg-zinc-700 px-2 py-0.5 rounded text-white text-xs">ESC</span> até aparecer o menu.
                                            Clique em <strong>Parar Transmissão</strong>.
                                        </p>
                                        <div className="bg-black/40 p-3 rounded-lg border border-red-500/10 text-sm text-zinc-400">
                                            Isso evita fechar o jogo do adversário e perder as notas da partida!
                                        </div>
                                        <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden border border-zinc-700">
                                            <Image src="/sl6.png" alt="Passo 6 - Desconectar" fill className="object-contain" />
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>
                        )}

                        {/* TAB: TÉCNICOS (Antigo Suporte) */}
                        {activeSection === 'suporte' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <Card className="bg-indigo-900/10 border-indigo-500/30">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-indigo-400 text-xl">
                                            <Users className="w-6 h-6" />
                                            Lista de Técnicos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-zinc-400">
                                            Confira abaixo a lista de times e seus respectivos treinadores na temporada atual.
                                        </p>
                                    </CardContent>
                                </Card>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Serie A */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
                                            <div className="w-2 h-8 bg-green-500 rounded-full" />
                                            SÉRIE A
                                        </h3>
                                        <div className="space-y-2">
                                            {allTeams
                                                .filter(t => t.divisao === 'A')
                                                .map(team => (
                                                    <div key={team.id} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all">
                                                        <div className="relative w-10 h-10 flex-shrink-0">
                                                            {team.logo_url ? (
                                                                <Image
                                                                    src={team.logo_url}
                                                                    alt={team.name}
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-xs">
                                                                    {team.name.substring(0, 2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{team.name}</p>
                                                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                                                                <span className="text-indigo-400">@</span>
                                                                {team.profiles?.[0]?.coach_name || 'Sem técnico'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            {allTeams.filter(t => t.divisao === 'A').length === 0 && (
                                                <p className="text-zinc-500 italic">Nenhum time na Série A.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Serie B */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
                                            <div className="w-2 h-8 bg-yellow-500 rounded-full" />
                                            SÉRIE B
                                        </h3>
                                        <div className="space-y-2">
                                            {allTeams
                                                .filter(t => t.divisao === 'B')
                                                .map(team => (
                                                    <div key={team.id} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all">
                                                        <div className="relative w-10 h-10 flex-shrink-0">
                                                            {team.logo_url ? (
                                                                <Image
                                                                    src={team.logo_url}
                                                                    alt={team.name}
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-xs">
                                                                    {team.name.substring(0, 2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{team.name}</p>
                                                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                                                                <span className="text-indigo-400">@</span>
                                                                {team.profiles?.[0]?.coach_name || 'Sem técnico'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            {allTeams.filter(t => t.divisao === 'B').length === 0 && (
                                                <p className="text-zinc-500 italic">Nenhum time na Série B.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <RulesEditorModal
                            isOpen={isRulesEditorOpen}
                            onClose={() => setIsRulesEditorOpen(false)}
                            currentRules={organization?.rules || []}
                        />

                        {/* TAB: ATRIBUTOS */}
                        {activeSection === 'atributos' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <Card className="bg-indigo-900/10 border-indigo-500/30 mb-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-indigo-400 text-xl">
                                            <Activity className="w-6 h-6" />
                                            Glossário de Atributos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-zinc-400">
                                            Entenda o que cada atributo significa e como ele influencia no desempenho do jogador em campo.
                                        </p>
                                    </CardContent>
                                </Card>

                                <div className="grid gap-6">
                                    {/* Ofensivos */}
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg border-b border-zinc-800 pb-2">Habilidades Ofensivas e de Controle</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                { label: "Talento ofensivo", desc: "Indica a habilidade do jogador na hora de atacar." },
                                                { label: "Controle de bola", desc: "Indica a capacidade do jogador de controlar a bola em geral. Também afeta o domínio e as fintas." },
                                                { label: "Drible", desc: "Indica a capacidade do jogador de manter o controle da bola ao driblar em velocidade." },
                                                { label: "Condução firme", desc: "Indica a habilidade do jogador de mudar a direção ao driblar em baixa velocidade." },
                                                { label: "Passe rasteiro", desc: "Indica a precisão dos passes rasteiros do jogador." },
                                                { label: "Passe alto", desc: "Indica a precisão dos passes pelo alto do jogador." },
                                                { label: "Finalização", desc: "Indica a precisão do chute do jogador." },
                                                { label: "Cabeceio", desc: "Indica a precisão dos cabeceios do jogador." },
                                                { label: "Chute colocado", desc: "Indica a precisão do jogador em bolas paradas, incluindo cobranças de falta e pênalti." },
                                                { label: "Curva", desc: "Indica a quantidade de efeito que o jogador pode aplicar na bola." }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <span className="text-indigo-400 font-bold block">{item.label}</span>
                                                    <span className="text-zinc-400 text-sm">{item.desc}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Físicas */}
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg border-b border-zinc-800 pb-2">Habilidades Físicas e de Movimento</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                { label: "Velocidade", desc: "Indica a agilidade do jogador sem a bola." },
                                                { label: "Aceleração", desc: "Indica a rapidez com que o jogador atinge sua velocidade máxima." },
                                                { label: "Força do chute", desc: "Indica quanta força o jogador pode gerar ao chutar a bola." },
                                                { label: "Impulsão", desc: "Indica a impulsão do jogador." },
                                                { label: "Contato físico", desc: "Indica a capacidade do jogador de afastar adversários e manter o equilíbrio sob pressão física." },
                                                { label: "Equilíbrio", desc: "Indica a capacidade do jogador de evitar desarmes e se manter em pé ao se desequilibrar sob contato físico." },
                                                { label: "Resistência", desc: "Indica o nível de preparo do jogador. Valores altos significam menor desgaste durante a partida." }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <span className="text-indigo-400 font-bold block">{item.label}</span>
                                                    <span className="text-zinc-400 text-sm">{item.desc}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Defensivas */}
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg border-b border-zinc-800 pb-2">Habilidades Defensivas</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                { label: "Talento defensivo", desc: "Indica a habilidade do jogador na hora de defender." },
                                                { label: "Desarme", desc: "Indica o nível de proficiência do jogador em ganhar a bola do adversário." },
                                                { label: "Agressividade", desc: "Indica o nível de agressividade do jogador ao tentar desarmar um adversário." }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <span className="text-indigo-400 font-bold block">{item.label}</span>
                                                    <span className="text-zinc-400 text-sm">{item.desc}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Goleiro */}
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg border-b border-zinc-800 pb-2">Habilidades de Goleiro (GO)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                { label: "Talento de GO", desc: "Indica a velocidade com que o jogador reage à bola quando estiver defendendo o gol." },
                                                { label: "Firmeza do GO", desc: "Indica a habilidade do goleiro de agarrar a bola. Um valor mais alto significa que o goleiro pode agarrar chutes mais fortes." },
                                                { label: "Afast. de bola do GO", desc: "Indica a habilidade do goleiro de afastar a bola para áreas seguras." },
                                                { label: "Reflexos do GO", desc: "Indica a habilidade do goleiro para defender chutes a curta distância." },
                                                { label: "Alcance do GO", desc: "Indica o quanto do gol o goleiro consegue cobrir e o tamanho da área em que ele consegue fazer defesas." }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <span className="text-indigo-400 font-bold block">{item.label}</span>
                                                    <span className="text-zinc-400 text-sm">{item.desc}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Outros */}
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg border-b border-zinc-800 pb-2">Outros Atributos</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                { label: "Pior pé (frequência)", desc: "Indica a frequência com que o jogador usará o pior pé. O valor máximo é de 4." },
                                                { label: "Pior pé (precisão)", desc: "Indica a precisão do jogador com o pior pé. O valor máximo é de 4." },
                                                { label: "Forma física", desc: "Indica a habilidade do jogador de se manter em forma com o tempo. O valor máximo é de 8." },
                                                { label: "Resistência a lesão", desc: "Indica o nível de resistência do jogador a lesões. O valor máximo é de 3." }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <span className="text-indigo-400 font-bold block">{item.label}</span>
                                                    <span className="text-zinc-400 text-sm">{item.desc}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Chat Components */}
            {
                user && (
                    <>
                        <FloatingChatButton
                            currentUser={chatUser}
                            currentTeam={chatTeam}
                            unreadCount={unreadCount}
                            onOpenChat={() => setIsChatOpen(true)}
                        />

                        <ChatPopup
                            isOpen={isChatOpen}
                            onClose={() => setIsChatOpen(false)}
                            currentUser={chatUser}
                            currentTeam={chatTeam}
                        />
                    </>
                )
            }
            {
                isImageOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/90 p-4 flex items-center justify-center animate-in fade-in duration-200">
                        <Button
                            className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-2 h-10 w-10 z-10"
                            onClick={() => setIsImageOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
                            <Image
                                src="/config-controle.png"
                                alt="Configuração Fullscreen"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function TrophyIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}
