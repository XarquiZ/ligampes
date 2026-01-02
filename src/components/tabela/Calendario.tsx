"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import JogoCard from "./calendario/JogoCard";
import SerieSelector from "./calendario/SerieSelector";
import RodadaSelector from "./calendario/RodadaSelector";
import GenerateMatchesDialog from "./GenerateMatchesDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabelas";
import { Trophy, Crown, Calendar as CalendarIcon } from "lucide-react";

interface Jogo {
  id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  round: number;
  divisao: 'A' | 'B';
  status: 'scheduled' | 'in_progress' | 'finished';
  home_score?: number;
  away_score?: number;
  stadium?: string;
  time_casa: {
    id: string;
    name: string;
    logo_url?: string;
  };
  time_fora: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

import { useAuth } from "@/hooks/useAuth";

export default function Calendario() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [serie, setSerie] = useState<'A' | 'B'>('A');
  const [rodada, setRodada] = useState<number>(1);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rodadasDisponiveis, setRodadasDisponiveis] = useState<number[]>([1]);
  const [maxRodadas, setMaxRodadas] = useState<number>(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("liga");

  // Verificar se é admin
  useEffect(() => {
    if (!user || !organization?.id) return;

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('organization_id', organization.id)
        .single();

      if (!error && data && data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user, organization?.id]);

  // Função para carregar jogos (definida fora para ser reutilizada)
  const loadJogos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('matches')
        .select(`
          *,
          time_casa:home_team_id(id, name, logo_url),
          time_fora:away_team_id(id, name, logo_url)
        `)
        .eq('organization_id', organization?.id)
        .eq('round', rodada)

      if (activeTab === 'liga') {
        query = query.eq('divisao', serie).neq('competition', 'Copa')
      } else {
        query = query.eq('competition', 'Copa')
      }

      const { data: jogosData, error } = await query
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setJogos(jogosData || []);
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar rodadas disponíveis para a série - Defined outside to be reused
  const loadRodadasDisponiveis = async () => {
    try {
      let query = supabase
        .from('matches')
        .select('round')
        .eq('organization_id', organization?.id)

      if (activeTab === 'liga') {
        query = query.eq('divisao', serie).neq('competition', 'Copa')
      } else {
        query = query.eq('competition', 'Copa')
      }

      const { data, error } = await query.order('round', { ascending: true });

      if (error) throw error;

      // Extrair rodadas únicas
      const rodadasUnicas = Array.from(new Set(data?.map(match => match.round) || []))
        .sort((a, b) => a - b);

      setRodadasDisponiveis(rodadasUnicas);
      setMaxRodadas(rodadasUnicas.length > 0 ? Math.max(...rodadasUnicas) : 1);

      // Se a rodada atual não existir nas disponíveis, ajustar para a primeira
      if (rodadasUnicas.length > 0 && !rodadasUnicas.includes(rodada) && rodadasUnicas.includes(1)) {
        // Only reset if current round is invalid. 
        // Prefer keeping current round if valid, or default to 1 if available
        // Logic adjustment: If newly generated, we might want to stay on 1 or go to 1. 
        // But if we are on round 1 and produce 10 rounds, we stay on round 1 which is fine.
      }
    } catch (error) {
      console.error('Erro ao carregar rodadas disponíveis:', error);
    }
  };

  // Carregar rodadas disponíveis inicialmente e quando mudar série
  useEffect(() => {
    if (organization?.id) {
      loadRodadasDisponiveis();
    }
  }, [serie, organization?.id, activeTab]);

  // Carregar jogos baseado na série e rodada selecionada
  useEffect(() => {
    if (organization?.id) {
      loadJogos();
    }
  }, [serie, rodada, organization?.id, activeTab]);

  // Quando mudar a série, resetar para a primeira rodada disponível
  // This logic is slightly redundant with loadRodadasDisponiveis internal check but keeps it explicit
  useEffect(() => {
    if (rodadasDisponiveis.length > 0 && !rodadasDisponiveis.includes(rodada)) {
      setRodada(rodadasDisponiveis[0]);
    }
  }, [serie, rodadasDisponiveis]);

  // Listener para atualizar quando uma partida for editada
  useEffect(() => {
    const handleMatchUpdated = () => {
      console.log('Partida atualizada, recarregando dados...');
      loadRodadasDisponiveis(); // Recarregar rodadas (pra pegar novas se geradas)
      loadJogos();
    };

    window.addEventListener('match-updated', handleMatchUpdated);

    return () => {
      window.removeEventListener('match-updated', handleMatchUpdated);
    };
  }, [serie, rodada]);

  // Função para converter status do banco para português
  const getStatusTraduzido = (status: string): 'agendado' | 'em_andamento' | 'finalizado' => {
    switch (status) {
      case 'scheduled':
        return 'agendado';
      case 'in_progress':
        return 'em_andamento';
      case 'finished':
        return 'finalizado';
      default:
        return 'agendado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com seletores */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Calendário de Jogos</h2>
          <p className="text-zinc-400">
            Acompanhe os jogos da {serie === 'A' ? 'Série A' : 'Série B'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {isAdmin && activeTab === 'liga' && <GenerateMatchesDialog />}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-zinc-800/50 border border-zinc-600 p-1">
              <TabsTrigger value="liga" className="text-white data-[state=active]:bg-green-600">
                <Trophy className="w-4 h-4 mr-2" />
                Liga
              </TabsTrigger>
              <TabsTrigger value="copa" className="text-white data-[state=active]:bg-yellow-600">
                <Crown className="w-4 h-4 mr-2" />
                Copa
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'liga' && <SerieSelector serie={serie} setSerie={setSerie} />}

          <RodadaSelector
            rodada={rodada}
            setRodada={setRodada}
            rodadasDisponiveis={rodadasDisponiveis}
            maxRodadas={maxRodadas}
          />
        </div>
      </div>

      {/* Lista de jogos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
          <span className="ml-2 text-white">Carregando jogos...</span>
        </div>
      ) : jogos.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <p className="text-zinc-400">
              Nenhum jogo encontrado para a Rodada {rodada} da {serie === 'A' ? 'Série A' : 'Série B'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jogos.map((jogo) => (
            <JogoCard
              key={jogo.id}
              jogo={{
                ...jogo,
                data: jogo.date,
                hora: jogo.time,
                rodada: jogo.round,
                divisao: jogo.divisao,
                status: getStatusTraduzido(jogo.status),
                placar_casa: jogo.home_score,
                placar_fora: jogo.away_score,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}