"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import JogoCard from "./calendario/JogoCard";
import SerieSelector from "./calendario/SerieSelector";
import RodadaSelector from "./calendario/RodadaSelector";

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

export default function Calendario() {
  const [serie, setSerie] = useState<'A' | 'B'>('A');
  const [rodada, setRodada] = useState<number>(1);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rodadasDisponiveis, setRodadasDisponiveis] = useState<number[]>([1]);
  const [maxRodadas, setMaxRodadas] = useState<number>(1);

  // Função para carregar jogos (definida fora para ser reutilizada)
  const loadJogos = async () => {
    setLoading(true);
    try {
      const { data: jogosData, error } = await supabase
        .from('matches')
        .select(`
          *,
          time_casa:home_team_id(id, name, logo_url),
          time_fora:away_team_id(id, name, logo_url)
        `)
        .eq('divisao', serie)
        .eq('round', rodada)
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

  // Carregar rodadas disponíveis para a série
  useEffect(() => {
    const loadRodadasDisponiveis = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('round')
          .eq('divisao', serie)
          .order('round', { ascending: true });

        if (error) throw error;

        // Extrair rodadas únicas
        const rodadasUnicas = Array.from(new Set(data?.map(match => match.round) || []))
          .sort((a, b) => a - b);

        setRodadasDisponiveis(rodadasUnicas);
        setMaxRodadas(rodadasUnicas.length > 0 ? Math.max(...rodadasUnicas) : 1);

        // Se a rodada atual não existir nas disponíveis, ajustar para a primeira
        if (rodadasUnicas.length > 0 && !rodadasUnicas.includes(rodada)) {
          setRodada(rodadasUnicas[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar rodadas disponíveis:', error);
      }
    };

    loadRodadasDisponiveis();
  }, [serie, rodada]);

  // Carregar jogos baseado na série e rodada selecionada
  useEffect(() => {
    loadJogos();
  }, [serie, rodada]);

  // Quando mudar a série, resetar para a primeira rodada disponível
  useEffect(() => {
    if (rodadasDisponiveis.length > 0) {
      setRodada(rodadasDisponiveis[0]);
    }
  }, [serie]);

  // Listener para atualizar quando uma partida for editada
  useEffect(() => {
    const handleMatchUpdated = () => {
      console.log('Partida atualizada, recarregando dados...');
      loadJogos(); // Agora loadJogos está definida
    };

    window.addEventListener('match-updated', handleMatchUpdated);

    return () => {
      window.removeEventListener('match-updated', handleMatchUpdated);
    };
  }, [serie, rodada]); // loadJogos não precisa estar nas dependências

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

        <div className="flex flex-wrap gap-4">
          <SerieSelector serie={serie} setSerie={setSerie} />
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
                serie: jogo.divisao,
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