"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import Image from "next/image";

import { ChevronDown } from "lucide-react";

interface JogadorRating {
  id: string;
  player_id: string;
  nome: string;
  posicao: string;
  time: string;
  logo_url?: string;
  avg_rating: number;
  total_rating: number;
  jogos: number;
  foto?: string;
  gols?: number;
  assistencias?: number;
}

// Definição das posições
const POSITIONS = ['GO', 'ZC', 'LE', 'LD', 'VOL', 'MLG', 'MAT', 'MLE', 'MLD', 'PTE', 'PTD', 'SA', 'CA'];

// Mapeamento de nomes completos das posições (apenas para exibição no cabeçalho)
const POSITION_NAMES: Record<string, string> = {
  'GO': 'Goleiro',
  'ZC': 'Zagueiro Central',
  'LE': 'Lateral Esquerdo',
  'LD': 'Lateral Direito',
  'VOL': 'Volante',
  'MLG': 'Meia de Ligação',
  'MAT': 'Meia Atacante',
  'MLE': 'Meia Esquerdo',
  'MLD': 'Meia Direito',
  'PTE': 'Ponta Esquerda',
  'PTD': 'Ponta Direita',
  'SA': 'Segundo Atacante',
  'CA': 'Centroavante'
};

export default function PorPosicao() {
  const { organization } = useOrganization();
  const [jogadores, setJogadores] = useState<JogadorRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisaoAtiva, setDivisaoAtiva] = useState<"A" | "B">("A");
  const [posicaoAtiva, setPosicaoAtiva] = useState<string>("GO");
  const [jogadoresPorPosicao, setJogadoresPorPosicao] = useState<JogadorRating[]>([]);
  const [isSerieDropdownOpen, setIsSerieDropdownOpen] = useState(false);
  const [isPosicaoDropdownOpen, setIsPosicaoDropdownOpen] = useState(false);

  // Buscar jogadores com melhor avg_rating
  const fetchMelhoresPorPosicao = async (divisao: "A" | "B") => {
    try {
      setLoading(true);

      // Primeiro, buscar os times da divisão selecionada
      const { data: timesDivisao, error: timesError } = await supabase
        .from('teams')
        .select('id, name, divisao')
        .eq('divisao', divisao)
        .eq('organization_id', organization?.id);

      if (timesError) throw timesError;

      if (timesDivisao && timesDivisao.length > 0) {
        const teamIds = timesDivisao.map(time => time.id);

        // Buscar as estatísticas dos jogadores
        const { data: playerStats, error: statsError } = await supabase
          .from('player_stats')
          .select('*')
          .gt('avg_rating', 0) // Somente jogadores com rating
          .gt('jogos', 0) // Somente jogadores que jogaram
          .in('team_id', teamIds)
          .order('avg_rating', { ascending: false });

        if (statsError) throw statsError;

        if (playerStats && playerStats.length > 0) {
          const playerIds = playerStats.map(stat => stat.player_id);

          // Buscar informações dos jogadores
          const { data: players, error: playersError } = await supabase
            .from('players')
            .select('id, name, photo_url, position')
            .in('id', playerIds);

          if (playersError) throw playersError;

          // Buscar informações completas dos times
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .in('id', teamIds);

          if (teamsError) throw teamsError;

          const playersMap = new Map(players?.map(p => [p.id, p]) || []);
          const teamsMap = new Map(teams?.map(t => [t.id, t]) || []);

          // Formatar os dados
          const jogadoresFormatados: JogadorRating[] = playerStats.map(stat => {
            const player = playersMap.get(stat.player_id);
            const team = teamsMap.get(stat.team_id);

            return {
              id: stat.id,
              player_id: stat.player_id,
              nome: player?.name || 'Jogador',
              posicao: player?.position || 'GO',
              time: team?.name || 'Time',
              logo_url: team?.logo_url,
              avg_rating: parseFloat(stat.avg_rating?.toString() || '0'),
              total_rating: parseFloat(stat.total_rating?.toString() || '0'),
              jogos: stat.jogos || 0,
              gols: stat.gols || 0,
              assistencias: stat.assistencias || 0,
              foto: player?.photo_url
            };
          });

          // Filtrar apenas jogadores com posições válidas
          const jogadoresValidos = jogadoresFormatados.filter(j =>
            j.posicao && POSITIONS.includes(j.posicao)
          );

          setJogadores(jogadoresValidos);
          filtrarPorPosicao(jogadoresValidos, posicaoAtiva);
        } else {
          setJogadores([]);
          setJogadoresPorPosicao([]);
        }
      } else {
        setJogadores([]);
        setJogadoresPorPosicao([]);
      }

    } catch (error) {
      console.error('Erro ao buscar jogadores por posição:', error);

      // Fallback para dados de exemplo
      const dadosExemplo = criarDadosExemplo(divisao);
      setJogadores(dadosExemplo);
      filtrarPorPosicao(dadosExemplo, posicaoAtiva);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar dados de exemplo
  const criarDadosExemplo = (divisao: "A" | "B"): JogadorRating[] => {
    const timesDivisao = divisao === "A"
      ? ['Time A', 'Time B', 'Time C', 'Time D', 'Time E', 'Time F', 'Time G', 'Time H']
      : ['Time I', 'Time J', 'Time K', 'Time L', 'Time M', 'Time N', 'Time O', 'Time P'];

    const dados: JogadorRating[] = [];

    // Criar 3-5 jogadores por posição
    POSITIONS.forEach(posicao => {
      const qtdJogadores = Math.floor(Math.random() * 3) + 3; // 3-5 jogadores

      for (let i = 0; i < qtdJogadores; i++) {
        const timeIndex = Math.floor(Math.random() * timesDivisao.length);
        const jogos = Math.floor(Math.random() * 10) + 15; // 15-24 jogos
        const avgRating = 6 + Math.random() * 3; // 6.0-9.0
        const totalRating = avgRating * jogos;

        dados.push({
          id: `${posicao}-${i}-${divisao}`,
          player_id: `player-${posicao}-${i}`,
          nome: `Jogador ${posicao} ${i + 1}`,
          posicao: posicao,
          time: timesDivisao[timeIndex],
          avg_rating: parseFloat(avgRating.toFixed(2)),
          total_rating: parseFloat(totalRating.toFixed(2)),
          jogos: jogos,
          gols: posicao.includes('A') || posicao.includes('T') ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 3),
          assistencias: posicao.includes('M') || posicao.includes('P') ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3),
          foto: undefined
        });
      }
    });

    return dados;
  };

  // Filtrar jogadores por posição
  const filtrarPorPosicao = (jogadoresLista: JogadorRating[], posicao: string) => {
    const filtrados = jogadoresLista
      .filter(j => j.posicao === posicao)
      .sort((a, b) => {
        // Ordenar por avg_rating, depois por jogos, depois por total_rating
        if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
        if (b.jogos !== a.jogos) return b.jogos - a.jogos;
        return b.total_rating - a.total_rating;
      })
      .slice(0, 10); // Pegar os 10 melhores

    setJogadoresPorPosicao(filtrados);
  };

  // Efeito para buscar dados quando a divisão muda
  useEffect(() => {
    if (organization?.id) {
      fetchMelhoresPorPosicao(divisaoAtiva);
    }
  }, [divisaoAtiva, organization?.id]);

  // Efeito para filtrar quando a posição muda
  useEffect(() => {
    if (jogadores.length > 0) {
      filtrarPorPosicao(jogadores, posicaoAtiva);
    }
  }, [posicaoAtiva, jogadores]);

  const getRatingColor = (rating: number) => {
    if (rating >= 8.0) return "text-green-400";
    if (rating >= 7.0) return "text-yellow-400";
    if (rating >= 6.0) return "text-orange-400";
    return "text-red-400";
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 8.0) return "bg-green-500/20";
    if (rating >= 7.0) return "bg-yellow-500/20";
    if (rating >= 6.0) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  const getPositionClasses = (index: number) => {
    switch (index) {
      case 0: // Primeiro lugar - Ouro
        return {
          bg: "bg-gradient-to-r from-yellow-500/10 to-yellow-600/5",
          border: "border-l-4 border-yellow-500",
          positionBg: "bg-gradient-to-br from-yellow-500 to-yellow-600",
          positionText: "text-yellow-900 font-bold",
          ratingText: "text-yellow-400",
          icon: "🥇"
        };
      case 1: // Segundo lugar - Prata
        return {
          bg: "bg-gradient-to-r from-gray-700/20 to-gray-800/10",
          border: "border-l-4 border-gray-400",
          positionBg: "bg-gradient-to-br from-gray-400 to-gray-500",
          positionText: "text-gray-900 font-bold",
          ratingText: "text-gray-300",
          icon: "🥈"
        };
      case 2: // Terceiro lugar - Bronze
        return {
          bg: "bg-gradient-to-r from-amber-900/15 to-amber-800/10",
          border: "border-l-4 border-amber-700",
          positionBg: "bg-gradient-to-br from-amber-600 to-amber-700",
          positionText: "text-amber-100 font-bold",
          ratingText: "text-amber-400",
          icon: "🥉"
        };
      default: // Demais posições
        return {
          bg: "bg-gray-800/30",
          border: "border-l-4 border-gray-700",
          positionBg: "bg-gray-800",
          positionText: "text-gray-300",
          ratingText: "text-yellow-400",
          icon: ""
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-4 md:p-6">
        {/* Cabeçalho Loading */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-yellow-500 rounded-full"></div>
            <h3 className="text-2xl font-bold text-yellow-400">
              Melhores por Posição
            </h3>
          </div>

          {/* Seletor de Divisão Loading */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <div className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700 text-gray-400">
                Série A
              </div>
              <div className="px-4 py-2 text-sm font-medium rounded-md text-gray-400">
                Série B
              </div>
            </div>
          </div>
        </div>

        {/* Filtro de Posições Loading */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {POSITIONS.slice(0, 5).map((pos, i) => (
              <div key={i} className="px-3 py-1.5 bg-gray-800 rounded-lg text-gray-400 text-sm animate-pulse">
                {pos}
              </div>
            ))}
          </div>
        </div>

        {/* Lista Loading */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
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

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-yellow-500 rounded-full"></div>
          <div>
            <h3 className="text-2xl font-bold text-yellow-400">
              Melhores por Posição
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Jogadores com melhor average rating em cada posição
            </p>
          </div>
        </div>

        {/* Seletor de Divisão */}
        <div className="flex items-center gap-4">
          {/* Mobile Dropdown */}
          <div className="relative md:hidden">
            <button
              onClick={() => setIsSerieDropdownOpen(!isSerieDropdownOpen)}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium border border-gray-700"
            >
              <span>{divisaoAtiva === "A" ? "Série A" : "Série B"}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isSerieDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSerieDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSerieDropdownOpen(false)} />
                <div className="absolute top-full right-0 mt-2 z-50 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                  <button
                    onClick={() => {
                      setDivisaoAtiva("A");
                      setIsSerieDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${divisaoAtiva === "A" ? "text-yellow-500 font-bold" : "text-gray-300"}`}
                  >
                    Série A
                  </button>
                  <button
                    onClick={() => {
                      setDivisaoAtiva("B");
                      setIsSerieDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${divisaoAtiva === "B" ? "text-yellow-500 font-bold" : "text-gray-300"}`}
                  >
                    Série B
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setDivisaoAtiva("A")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${divisaoAtiva === "A"
                  ? "bg-yellow-500 text-black font-semibold"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
              >
                Série A
              </button>
              <button
                onClick={() => setDivisaoAtiva("B")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${divisaoAtiva === "B"
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

      {/* Filtro de Posições */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Selecione a Posição</h4>

        {/* Mobile Dropdown */}
        <div className="relative md:hidden w-full">
          <button
            onClick={() => setIsPosicaoDropdownOpen(!isPosicaoDropdownOpen)}
            className="w-full flex items-center justify-between bg-gray-800 text-white px-4 py-3 rounded-lg font-medium border border-gray-700"
          >
            <span className="flex items-center gap-2">
              <span className="text-yellow-500 font-bold">{posicaoAtiva}</span>
              <span className="text-gray-400">- {POSITION_NAMES[posicaoAtiva]}</span>
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isPosicaoDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPosicaoDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPosicaoDropdownOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => {
                      setPosicaoAtiva(pos);
                      setIsPosicaoDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-700 last:border-0 hover:bg-gray-700 transition-colors flex items-center justify-between ${posicaoAtiva === pos ? "bg-gray-700/50" : ""
                      }`}
                  >
                    <span className={`font-medium ${posicaoAtiva === pos ? "text-yellow-500" : "text-white"}`}>
                      {pos}
                    </span>
                    <span className="text-sm text-gray-400">
                      {POSITION_NAMES[pos]}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desktop Scrollable List */}
        <div className="hidden md:flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosicaoAtiva(pos)}
              className={`px-4 py-3 rounded-lg transition-all whitespace-nowrap font-medium text-lg ${posicaoAtiva === pos
                ? "bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/30"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Informações da Posição Ativa */}
      <div className="mb-8 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/30 rounded-xl border border-gray-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold text-white">
              {POSITION_NAMES[posicaoAtiva] || posicaoAtiva} ({posicaoAtiva})
            </h4>
            <p className="text-gray-400 text-sm mt-1">
              {jogadoresPorPosicao.length} jogadores com estatísticas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg text-lg font-bold ${getRatingBgColor(
              jogadoresPorPosicao[0]?.avg_rating || 0
            )} ${getRatingColor(jogadoresPorPosicao[0]?.avg_rating || 0)}`}>
              Melhor: {jogadoresPorPosicao[0]?.avg_rating?.toFixed(2) || "N/A"}
            </div>
            <div className="text-sm text-gray-400">
              {divisaoAtiva === "A" ? "Série A" : "Série B"}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de jogadores */}
      <div className="space-y-3">
        {jogadoresPorPosicao.length > 0 ? (
          jogadoresPorPosicao.map((jogador, index) => {
            const classes = getPositionClasses(index);

            return (
              <div
                key={jogador.id}
                className={`${classes.bg} ${classes.border} rounded-lg p-4 hover:bg-gray-800/40 transition-all duration-200 hover:scale-[1.005]`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Lado esquerdo - Posição e Informações */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Posição */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${classes.positionBg} ${classes.positionText}`}>
                      {index < 3 ? classes.icon : index + 1}
                    </div>

                    {/* Foto do jogador */}
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600 overflow-hidden">
                      {jogador.foto ? (
                        <img
                          src={jogador.foto}
                          alt={jogador.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <span class="font-bold text-gray-300">
                                ${jogador.nome.charAt(0)}
                              </span>
                            `;
                          }}
                        />
                      ) : (
                        <span className="font-bold text-gray-300">
                          {jogador.nome.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Nome, Time e Posição */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-white text-lg">{jogador.nome}</div>
                        <span className="text-xs px-2 py-1 bg-gray-800 rounded-full font-medium">
                          {jogador.posicao}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mt-1">
                        <div className="flex items-center gap-2">
                          {jogador.logo_url ? (
                            <div className="relative w-4 h-4">
                              <Image
                                src={jogador.logo_url}
                                alt={`Logo do ${jogador.time}`}
                                width={16}
                                height={16}
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-300">
                                {jogador.time.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span>{jogador.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lado direito - Estatísticas */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-8 w-full md:w-auto">
                    {/* Average Rating (Destaque) */}
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getRatingColor(jogador.avg_rating)}`}>
                        {jogador.avg_rating.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">avg rating</div>
                    </div>

                    {/* Outras Estatísticas */}
                    <div className="flex gap-2 md:gap-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Jogos</div>
                        <div className="font-medium text-white">{jogador.jogos}</div>
                      </div>
                      {(jogador.gols && jogador.gols > 0) && (
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Gols</div>
                          <div className="font-medium text-white">{jogador.gols}</div>
                        </div>
                      )}
                      {(jogador.assistencias && jogador.assistencias > 0) && (
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Assist.</div>
                          <div className="font-medium text-white">{jogador.assistencias}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg">Nenhum jogador encontrado para a posição {posicaoAtiva}</p>
            <p className="text-sm mt-2">
              {divisaoAtiva === "A" ? "Série A" : "Série B"} - {POSITION_NAMES[posicaoAtiva] || posicaoAtiva}
            </p>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-8 pt-6 border-t border-gray-700/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-400">
            {jogadoresPorPosicao.length > 0 && (
              <>
                <span className="text-green-400">
                  {jogadoresPorPosicao.length} jogadores •
                </span>
                <span className="ml-2">
                  Posição: <span className="text-yellow-400">{posicaoAtiva}</span>
                </span>
                <span className="ml-2">
                  • Divisão: <span className="text-yellow-400">{divisaoAtiva === "A" ? "Série A" : "Série B"}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-400">Rating ≥ 8.0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-400">Rating ≥ 7.0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-400">Rating ≥ 6.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}