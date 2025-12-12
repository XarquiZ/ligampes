"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import Image from "next/image";

interface Assistente {
  id: string;
  nome: string;
  time: string;
  logo_url?: string;
  assistencias: number;
  jogos: number;
  gols: number;
  media: number;
  foto?: string;
}

export default function Assistencias() {
  const [assistentes, setAssistentes] = useState<Assistente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataAtualizacao, setDataAtualizacao] = useState<string>('');
  const [divisaoAtiva, setDivisaoAtiva] = useState<"A" | "B">("A");

  const fetchAssistencias = async (divisao: "A" | "B") => {
    try {
      setLoading(true);
      
      // Primeiro, precisamos buscar os times da divisão selecionada
      const { data: timesDivisao, error: timesError } = await supabase
        .from('teams')
        .select('id, name, divisao')
        .eq('divisao', divisao);

      if (timesError) throw timesError;

      if (timesDivisao && timesDivisao.length > 0) {
        const teamIds = timesDivisao.map(time => time.id);
        
        const { data: playerStats, error: statsError } = await supabase
          .from('player_stats')
          .select('*')
          .gt('assistencias', 0)
          .in('team_id', teamIds)
          .order('assistencias', { ascending: false })
          .limit(10);

        if (statsError) throw statsError;

        if (playerStats && playerStats.length > 0) {
          const playerIds = playerStats.map(stat => stat.player_id);
          const { data: players, error: playersError } = await supabase
            .from('players')
            .select('id, name, photo_url')
            .in('id', playerIds);

          if (playersError) throw playersError;

          // Buscar informações completas dos times
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo_url, divisao')
            .in('id', teamIds);

          if (teamsError) throw teamsError;

          const playersMap = new Map(players?.map(p => [p.id, p]) || []);
          const teamsMap = new Map(teams?.map(t => [t.id, t]) || []);

          const assistentesFormatados = playerStats.map(stat => {
            const player = playersMap.get(stat.player_id);
            const team = teamsMap.get(stat.team_id);
            const media = stat.jogos > 0 ? stat.assistencias / stat.jogos : 0;
            
            return {
              id: stat.player_id,
              nome: player?.name || stat.player_name || 'Jogador',
              time: team?.name || 'Time',
              logo_url: team?.logo_url,
              assistencias: stat.assistencias || 0,
              jogos: stat.jogos || 0,
              gols: stat.gols || 0,
              media: media,
              foto: player?.photo_url
            };
          })
          .filter(assistente => assistente.assistencias > 0)
          .sort((a, b) => {
            if (b.assistencias !== a.assistencias) return b.assistencias - a.assistencias;
            return b.media - a.media;
          });

          setAssistentes(assistentesFormatados);
        } else {
          // Se não houver dados, usar array vazio
          setAssistentes([]);
        }
      } else {
        // Se não houver times na divisão, usar array vazio
        setAssistentes([]);
      }

      setDataAtualizacao(new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));

    } catch (error) {
      console.error('Erro ao buscar assistências:', error);
      
      // Fallback para dados de exemplo baseado na divisão
      const dadosExemplo = {
        A: [
          { id: "1", nome: "Ronaldo Assis", time: "Time A", assistencias: 10, jogos: 20, gols: 5, media: 0.50 },
          { id: "2", nome: "Fabio Passador", time: "Time B", assistencias: 9, jogos: 19, gols: 3, media: 0.47 },
          { id: "3", nome: "Lucas Criador", time: "Time C", assistencias: 8, jogos: 20, gols: 2, media: 0.40 },
          { id: "4", nome: "Mateus Vision", time: "Time D", assistencias: 7, jogos: 18, gols: 4, media: 0.39 },
          { id: "5", nome: "Thiago Magico", time: "Time E", assistencias: 6, jogos: 20, gols: 1, media: 0.30 },
          { id: "6", nome: "Diego Armador", time: "Time F", assistencias: 6, jogos: 19, gols: 3, media: 0.32 },
          { id: "7", nome: "Bruno Cerebro", time: "Time G", assistencias: 5, jogos: 17, gols: 2, media: 0.29 },
          { id: "8", nome: "Guilherme Mestre", time: "Time H", assistencias: 5, jogos: 20, gols: 0, media: 0.25 },
        ],
        B: [
          { id: "9", nome: "Marcos Conector", time: "Time I", assistencias: 8, jogos: 18, gols: 2, media: 0.44 },
          { id: "10", nome: "Eduardo Criativo", time: "Time J", assistencias: 7, jogos: 19, gols: 4, media: 0.37 },
          { id: "11", nome: "Vitor Assistente", time: "Time K", assistencias: 6, jogos: 17, gols: 1, media: 0.35 },
          { id: "12", nome: "Roberto Maestro", time: "Time L", assistencias: 5, jogos: 18, gols: 3, media: 0.28 },
          { id: "13", nome: "Paulo Distribuidor", time: "Time M", assistencias: 5, jogos: 16, gols: 2, media: 0.31 },
          { id: "14", nome: "Leonardo Visionário", time: "Time N", assistencias: 4, jogos: 19, gols: 1, media: 0.21 },
          { id: "15", nome: "André Criador", time: "Time O", assistencias: 4, jogos: 17, gols: 0, media: 0.24 },
          { id: "16", nome: "Fernando Passador", time: "Time P", assistencias: 3, jogos: 20, gols: 2, media: 0.15 },
        ]
      };

      setAssistentes(dadosExemplo[divisao]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistencias(divisaoAtiva);
  }, [divisaoAtiva]);

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            <h3 className="text-2xl font-bold text-blue-400">
              Líder de Assistências
            </h3>
          </div>
          
          {/* Seletor de Divisão no Loading State */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <div className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700 text-gray-400">
                Série A
              </div>
              <div className="px-4 py-2 text-sm font-medium rounded-md text-gray-400">
                Série B
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Carregando...
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
              </div>
              <div className="h-8 bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getPositionClasses = (index: number) => {
    switch(index) {
      case 0: // Primeiro lugar - Ouro
        return {
          bg: "bg-gradient-to-r from-yellow-500/10 to-yellow-600/5",
          border: "border-l-4 border-yellow-500",
          positionBg: "bg-gradient-to-br from-yellow-500 to-yellow-600",
          positionText: "text-yellow-900 font-bold",
          assistText: "text-yellow-400",
          icon: "🥇"
        };
      case 1: // Segundo lugar - Prata
        return {
          bg: "bg-gradient-to-r from-gray-700/20 to-gray-800/10",
          border: "border-l-4 border-gray-400",
          positionBg: "bg-gradient-to-br from-gray-400 to-gray-500",
          positionText: "text-gray-900 font-bold",
          assistText: "text-gray-300",
          icon: "🥈"
        };
      case 2: // Terceiro lugar - Bronze
        return {
          bg: "bg-gradient-to-r from-amber-900/15 to-amber-800/10",
          border: "border-l-4 border-amber-700",
          positionBg: "bg-gradient-to-br from-amber-600 to-amber-700",
          positionText: "text-amber-100 font-bold",
          assistText: "text-amber-400",
          icon: "🥉"
        };
      default: // Demais posições
        return {
          bg: "bg-gray-800/30",
          border: "border-l-4 border-gray-700",
          positionBg: "bg-gray-800",
          positionText: "text-gray-300",
          assistText: "text-blue-400",
          icon: ""
        };
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-xl p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
          <h3 className="text-2xl font-bold text-blue-400">
            Líder de Assistências
          </h3>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Seletor de Divisão */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setDivisaoAtiva("A")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  divisaoAtiva === "A"
                    ? "bg-yellow-500 text-black font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Série A
              </button>
              <button
                onClick={() => setDivisaoAtiva("B")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  divisaoAtiva === "B"
                    ? "bg-yellow-500 text-black font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Série B
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Lista de jogadores */}
      <div className="space-y-3">
        {assistentes.length > 0 ? (
          assistentes.map((assistente, index) => {
            const classes = getPositionClasses(index);
            
            return (
              <div 
                key={assistente.id} 
                className={`${classes.bg} ${classes.border} rounded-lg p-4 hover:bg-gray-800/40 transition-colors`}
              >
                <div className="flex items-center justify-between">
                  {/* Lado esquerdo - Posição e Informações */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Posição */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${classes.positionBg} ${classes.positionText}`}>
                      {index < 3 ? classes.icon : index + 1}
                    </div>

                    {/* Foto do jogador */}
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600 overflow-hidden">
                      {assistente.foto ? (
                        <img 
                          src={assistente.foto} 
                          alt={assistente.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <span class="font-bold text-gray-300">
                                ${assistente.nome.charAt(0)}
                              </span>
                            `;
                          }}
                        />
                      ) : (
                        <span className="font-bold text-gray-300">
                          {assistente.nome.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Nome e Time */}
                    <div>
                      <div className="font-bold text-white">{assistente.nome}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {assistente.logo_url ? (
                          <div className="relative w-4 h-4">
                            <Image
                              src={assistente.logo_url}
                              alt={`Logo do ${assistente.time}`}
                              width={16}
                              height={16}
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-300">
                              {assistente.time.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span>{assistente.time}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-800 rounded-full">
                          {divisaoAtiva === "A" ? "Série A" : "Série B"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lado direito - Estatísticas */}
                  <div className="flex items-center gap-8">
                    {/* Assistências */}
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${classes.assistText}`}>
                        {assistente.assistencias}
                      </div>
                      <div className="text-xs text-gray-400">assistências</div>
                    </div>

                    {/* Jogos e Média */}
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Jogos</div>
                        <div className="font-medium text-white">{assistente.jogos}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Média</div>
                        <div className="font-medium text-white">{assistente.media.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg">Nenhum assistente encontrado para a {divisaoAtiva === "A" ? "Série A" : "Série B"}</p>
            <p className="text-sm mt-2">Os dados serão exibidos quando houver estatísticas disponíveis</p>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-8 pt-6 border-t border-gray-700/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-400">
            <span className="text-blue-400 font-semibold">Fonte:</span> Tabela player_stats (assistencias)
            {assistentes.length > 0 && (
              <span className="ml-2 text-green-400">
                • {assistentes.length} jogadores
              </span>
            )}
            <span className="ml-2">• Divisão: {divisaoAtiva === "A" ? "Série A" : "Série B"}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
              <span className="text-xs text-gray-400">1º Lugar</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"></div>
              <span className="text-xs text-gray-400">2º Lugar</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700"></div>
              <span className="text-xs text-gray-400">3º Lugar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}