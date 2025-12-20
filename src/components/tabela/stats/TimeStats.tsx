"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import Image from "next/image";

interface TimeStat {
  id: number;
  nome: string;
  golsFeitos: number;
  golsSofridos: number;
  saldo: number;
  posseMedia: number | null;
  finalizacoes: number | null;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  team_id?: string;
  logo_url?: string;
  divisao?: string;
  pontos?: number;
}

export default function TimeStats() {
  const [timesDivisaoA, setTimesDivisaoA] = useState<TimeStat[]>([]);
  const [timesDivisaoB, setTimesDivisaoB] = useState<TimeStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [divisaoAtiva, setDivisaoAtiva] = useState<"A" | "B">("A");
  const [sortBy, setSortBy] = useState<keyof TimeStat>("golsFeitos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Buscar dados do Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Buscar apenas times com divisão A ou B (ignorar null)
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url, divisao')
          .in('divisao', ['A', 'B'])
          .order('name');

        if (teamsError) {
          console.error('Erro ao buscar times:', teamsError);
          throw teamsError;
        }

        if (teamsData && teamsData.length > 0) {
          // Buscar estatísticas apenas para times com divisão
          const teamIds = teamsData.map(team => team.id);
          const { data: teamStats, error: statsError } = await supabase
            .from('team_stats')
            .select('*')
            .in('team_id', teamIds);

          const statsMap = new Map();
          if (teamStats) {
            teamStats.forEach(stat => {
              if (stat.team_id) {
                statsMap.set(stat.team_id, stat);
              }
            });
          }

          // Separar times por divisão (apenas A e B)
          const divisaoA: TimeStat[] = [];
          const divisaoB: TimeStat[] = [];
          let idCounter = 1;

          teamsData.forEach((team) => {
            const stat = statsMap.get(team.id);
            const timeStat: TimeStat = {
              id: idCounter++,
              nome: team.name || `Time ${idCounter}`,
              golsFeitos: stat?.gols_marcados || 0,
              golsSofridos: stat?.gols_sofridos || 0,
              saldo: (stat?.gols_marcados || 0) - (stat?.gols_sofridos || 0),
              posseMedia: stat?.posse_media || null,
              finalizacoes: stat?.finalizacoes || null,
              cartoesAmarelos: 0,
              cartoesVermelhos: 0,
              pontos: stat?.pontos || 0,
              team_id: team.id,
              logo_url: team.logo_url,
              divisao: team.divisao
            };

            // Classificar por divisão (apenas A ou B)
            if (team.divisao === 'B') {
              divisaoB.push(timeStat);
            } else if (team.divisao === 'A') {
              divisaoA.push(timeStat);
            }
            // Times com null são ignorados
          });

          setTimesDivisaoA(divisaoA);
          setTimesDivisaoB(divisaoB);
        } else {
          // Fallback se não houver times com divisão
          setTimesDivisaoA([]);
          setTimesDivisaoB([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);

        // Fallback com dados de exemplo (apenas times com divisão)
        const divisaoAExemplo = [
          {
            id: 1,
            nome: "Time A",
            golsFeitos: 42,
            golsSofridos: 18,
            saldo: 24,
            posseMedia: null,
            finalizacoes: null,
            cartoesAmarelos: 25,
            cartoesVermelhos: 1,
            logo_url: undefined,
            divisao: 'A'
          },
          {
            id: 2,
            nome: "Time B",
            golsFeitos: 35,
            golsSofridos: 22,
            saldo: 13,
            posseMedia: null,
            finalizacoes: null,
            cartoesAmarelos: 32,
            cartoesVermelhos: 2,
            logo_url: undefined,
            divisao: 'A'
          },
        ];

        const divisaoBExemplo = [
          {
            id: 3,
            nome: "Time C",
            golsFeitos: 28,
            golsSofridos: 23,
            saldo: 5,
            posseMedia: null,
            finalizacoes: null,
            cartoesAmarelos: 19,
            cartoesVermelhos: 1,
            logo_url: undefined,
            divisao: 'B'
          },
          {
            id: 4,
            nome: "Time D",
            golsFeitos: 27,
            golsSofridos: 24,
            saldo: 3,
            posseMedia: null,
            finalizacoes: null,
            cartoesAmarelos: 35,
            cartoesVermelhos: 3,
            logo_url: undefined,
            divisao: 'B'
          },
        ];

        setTimesDivisaoA(divisaoAExemplo);
        setTimesDivisaoB(divisaoBExemplo);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (column: keyof TimeStat) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortIcon = (column: keyof TimeStat) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Ordenar os times da divisão ativa
  const timesAtivos = divisaoAtiva === "A" ? timesDivisaoA : timesDivisaoB;
  const sortedTimes = [...timesAtivos].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === null || bValue === null) {
      return 0;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6">
        <div className="text-center text-yellow-400">
          Carregando dados dos times...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <div className="w-2 h-6 bg-green-500 rounded-full"></div>
            Estatísticas dos Times - Divisão {divisaoAtiva}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Seletor de Divisão */}
          <div className="flex items-center gap-2">
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

          {/* Botões de Ordenação */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSort("golsFeitos")}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${sortBy === "golsFeitos"
                  ? "bg-yellow-500 text-black font-semibold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
            >
              GF {sortIcon("golsFeitos")}
            </button>
            <button
              onClick={() => handleSort("saldo")}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${sortBy === "saldo"
                  ? "bg-yellow-500 text-black font-semibold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
            >
              Saldo {sortIcon("saldo")}
            </button>
            <button
              onClick={() => handleSort("posseMedia")}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${sortBy === "posseMedia"
                  ? "bg-yellow-500 text-black font-semibold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
            >
              Posse {sortIcon("posseMedia")}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full md:min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold min-w-[200px]">Time</th>
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold">GF</th>
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold">GS</th>
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold">Saldo</th>
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold hidden md:table-cell">Posse</th>
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold hidden md:table-cell">Finalizações</th>
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold hidden md:table-cell">CA</th>
              <th className="text-left py-3 px-4 text-yellow-400 font-semibold hidden md:table-cell">CV</th>
            </tr>
          </thead>
          <tbody>
            {sortedTimes.length > 0 ? (
              sortedTimes.map((time) => (
                <tr
                  key={time.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-[180px]">
                      {time.logo_url ? (
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={time.logo_url}
                            alt={`Logo do ${time.nome}`}
                            width={32}
                            height={32}
                            className="object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-gray-300">
                            {time.nome.charAt(0)}
                          </span>
                        </div>
                      )}
                      {/* Nome do time em branco com espaço garantido */}
                      <div className="font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {time.nome}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xl font-bold text-green-400">
                      {time.golsFeitos}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xl font-bold text-red-400">
                      {time.golsSofridos}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`text-xl font-bold ${time.saldo > 0 ? "text-green-400" : time.saldo < 0 ? "text-red-400" : "text-gray-300"
                      }`}>
                      {time.saldo > 0 ? "+" : ""}{time.saldo}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {time.posseMedia !== null ? (
                      <div className="flex items-center gap-3">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${time.posseMedia}%` }}
                          ></div>
                        </div>
                        <span className="text-white whitespace-nowrap">{time.posseMedia}%</span>
                      </div>
                    ) : (
                      <div className="text-gray-500">-</div>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {time.finalizacoes !== null ? (
                      <div className="text-white">{time.finalizacoes}</div>
                    ) : (
                      <div className="text-gray-500">-</div>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-sm">
                        {time.cartoesAmarelos}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-sm">
                        {time.cartoesVermelhos}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 px-4 text-center text-gray-500">
                  Nenhum time encontrado na Divisão {divisaoAtiva}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-yellow-500/20">
        <div className="text-sm text-gray-400">

          <span className="text-yellow-400 font-semibold">Legenda:</span> GF = Gols Feitos • GS = Gols Sofridos • CA = Cartões Amarelos • CV = Cartões Vermelhos
        </div>
      </div>
    </div>
  );
}