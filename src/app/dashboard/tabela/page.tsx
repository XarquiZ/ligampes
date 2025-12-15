"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import FloatingChatButton from "@/components/FloatingChatButton";
import ChatPopup from "@/components/ChatPopup";
import Classificacao from "@/components/tabela/Classificacao";
import Estatisticas from "@/components/tabela/Estatisticas";
import CopaParsec from "@/components/tabela/CopaParsec";
import Calendario from "@/components/tabela/Calendario"; // NOVA IMPORT
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabelas";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, loading: authLoading } = useAuth();
  // Estados do usuário
  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // Estados do chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar dados do usuário para o Sidebar
  useEffect(() => {
    if (authLoading || !user) return;

    const loadUserData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
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
  }, [authLoading, user])

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
      <Sidebar user={user!} profile={profile} team={team} />

      {/* Conteúdo Principal */}
      <div className="flex-1 transition-all duration-300 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            {/* Header - IGUAL AO DA PÁGINA SALDO */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div>
                <h1 className="text-3xl lg:text-5xl font-black text-white mb-2">TABELA E ESTATÍSTICAS</h1>
                <p className="text-zinc-400 text-sm lg:text-lg">
                  Acompanhe a classificação, estatísticas e agenda dos campeonatos
                </p>
              </div>
            </div>

            {/* Conteúdo da Tabela - ATUALIZADO COM NOVA ABA */}
            <Card className="bg-white/5 border-white/10 p-4 lg:p-6">
              <Tabs defaultValue="classificacao" className="w-full">
                <TabsList className="grid grid-cols-4 mb-8 bg-zinc-800/50 border border-zinc-600 p-1 rounded-lg">
                  <TabsTrigger 
                    value="classificacao" 
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors"
                  >
                    Classificação
                  </TabsTrigger>
                  <TabsTrigger 
                    value="estatisticas"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors"
                  >
                    Estatísticas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="calendario"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors"
                  >
                    Calendário
                  </TabsTrigger>
                  <TabsTrigger 
                    value="copa"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-colors"
                  >
                    Copa Parsec
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