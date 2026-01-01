"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Trophy, BarChart2, Calendar, Crown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import FloatingChatButton from "@/components/FloatingChatButton";
import ChatPopup from "@/components/Chatpopup";
import Classificacao from "@/components/tabela/Classificacao";
import Estatisticas from "@/components/tabela/Estatisticas";
import CopaParsec from "@/components/tabela/CopaParsec";
import Calendario from "@/components/tabela/Calendario"; // NOVA IMPORT
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabelas";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { cn } from "@/lib/utils";

// Interface de usuário
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

// Interface de perfil
interface Profile {
  coach_name?: string;
  role?: string;
  team_id?: string;
}

// Interface de time
interface Team {
  id: string;
  name: string;
  logo_url?: string;
}

export default function TabelaPage() {
  const { organization } = useOrganization();
  const { user, loading: authLoading } = useAuth();
  // Estados do usuário
  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // Estados do chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Tab State & Config
  const [activeTab, setActiveTab] = useState("classificacao");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabConfig = {
    classificacao: {
      label: "Classificação",
      icon: Trophy,
      color: "yellow-500",
      bgColor: "bg-yellow-500",
      textColor: "text-black"
    },
    estatisticas: {
      label: "Estatísticas",
      icon: BarChart2,
      color: "yellow-500",
      bgColor: "bg-yellow-500",
      textColor: "text-black"
    },
    calendario: {
      label: "Calendário",
      icon: Calendar,
      color: "yellow-500",
      bgColor: "bg-yellow-500",
      textColor: "text-black"
    },
    copa: {
      label: "Copa Parsec",
      icon: Crown,
      color: "yellow-500",
      bgColor: "bg-yellow-500",
      textColor: "text-black"
    }
  };

  // Carregar dados do usuário para o Sidebar
  useEffect(() => {
    if (authLoading || !user) return;

    const loadUserData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
          .eq('organization_id', organization?.id)
          .single()

        if (!profileError) {
          setProfile(profileData)
          setTeam(profileData?.teams || null)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadUserData()
  }, [authLoading, user, organization?.id])

  // Carregar contagem de mensagens não lidas
  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCount = async () => {
      try {
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        if (!conversations?.length) {
          setUnreadCount(0)
          return
        }

        const conversationIds = conversations.map(conv => conv.id)

        const { count } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('read', false)
          .neq('sender_id', user.id)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Erro ao carregar contagem de mensagens:', error)
      }
    }

    loadUnreadCount()

    // Subscription para atualizar em tempo real
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages'
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          // Carregar dados adicionais se necessário
          setLoading(false);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user]);

  // Preparar dados para o chat
  const currentUserForChat = user ? {
    id: user.id,
    name: profile?.coach_name || user.user_metadata?.full_name || user.email || "Usuário",
    email: user.email || "",
    role: profile?.role,
  } : {
    id: "",
    name: "Usuário",
    email: "",
    role: "coach"
  };

  const currentTeamForChat = team ? {
    id: team.id,
    name: team.name,
    logo_url: team.logo_url
  } : {
    id: "",
    name: "Sem time",
    logo_url: undefined
  };

  // Função para atualizar dados
  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Recarregar dados se necessário
      console.log("Atualizando dados da tabela...");
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar user={user!} profile={profile} team={team} organizationId={organization?.id} />

      {/* Conteúdo Principal */}
      <div className="flex-1 transition-all duration-300 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white p-0 lg:p-6">
          <div className="p-4 pt-24 md:p-6 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase tracking-tight">
                  Tabela e Estatísticas
                </h1>
                <p className="text-zinc-400 text-sm lg:text-lg">
                  Acompanhe a classificação, estatísticas e agenda dos campeonatos
                </p>
              </div>
            </div>

            {/* Conteúdo da Tabela - ATUALIZADO COM NOVA ABA */}
            {/* Conteúdo da Tabela - ATUALIZADO COM NOVA ABA */}
            <Card className="bg-white/5 border-white/10 p-4 lg:p-6">

              {/* Mobile Dropdown Selector (Using SectionSwitch style) */}
              <div className="relative w-full mb-6 md:hidden">
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    'w-full justify-between rounded-xl border border-zinc-700 h-14',
                    tabConfig[activeTab as keyof typeof tabConfig].bgColor,
                    tabConfig[activeTab as keyof typeof tabConfig].textColor
                  )}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = tabConfig[activeTab as keyof typeof tabConfig].icon;
                      return <Icon className="w-5 h-5" />;
                    })()}
                    <span className="font-bold text-lg">{tabConfig[activeTab as keyof typeof tabConfig].label}</span>
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
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {Object.entries(tabConfig).map(([key, config]) => {
                        if (key === activeTab) return null;
                        const Icon = config.icon;
                        return (
                          <Button
                            key={key}
                            variant="ghost"
                            size="lg"
                            onClick={() => {
                              setActiveTab(key);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full justify-start h-14 rounded-none border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            <Icon className="w-5 h-5 mr-3 text-yellow-500" />
                            <span className="font-bold">{config.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="hidden md:grid grid-cols-4 h-auto mb-6 md:mb-8 bg-zinc-800/50 border border-zinc-600 p-1 rounded-lg gap-1 md:gap-0">
                  <TabsTrigger
                    value="classificacao"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Classificação
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="estatisticas"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors py-3"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4" />
                      Estatísticas
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendario"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Calendário
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="copa"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Copa Parsec
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="classificacao">
                  <Classificacao />
                </TabsContent>

                <TabsContent value="estatisticas">
                  <Estatisticas />
                </TabsContent>

                <TabsContent value="calendario">
                  <Calendario />
                </TabsContent>

                <TabsContent value="copa">
                  <CopaParsec />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Chat Components */}
        {user && team && (
          <>
            <FloatingChatButton
              currentUser={currentUserForChat}
              currentTeam={currentTeamForChat}
              unreadCount={unreadCount}
              onOpenChat={() => setIsChatOpen(true)}
            />

            <ChatPopup
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              currentUser={currentUserForChat}
              currentTeam={currentTeamForChat}
            />
          </>
        )}
      </div>
    </div>
  );
}