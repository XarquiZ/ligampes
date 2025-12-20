"use client";

import { useState, useEffect } from "react";
import TeamRow from "./TeamRow";
import { supabase } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  position: number;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsMarcados: number;
  golsSofridos: number;
  saldo: number;
  ultimosJogos: string[];
  logo_url: string | null;
  divisao: string | null;
}

export default function SerieATable() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamsWithStats();

    // Listener para atualizar automaticamente quando o modal salva
    const handleMatchUpdate = () => {
      fetchTeamsWithStats();
    };

    window.addEventListener('match-updated', handleMatchUpdate);
    return () => window.removeEventListener('match-updated', handleMatchUpdate);
  }, []);

  const fetchTeamsWithStats = async () => {
    try {
      setLoading(true);

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, logo_url, divisao')
        .eq('divisao', 'A')
        .order('name');

      if (teamsError) throw teamsError;

      if (!teamsData || teamsData.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const teamIds = teamsData.map(team => team.id);

      const { data: statsData } = await supabase
        .from('team_stats')
        .select('*')
        .in('team_id', teamIds);

      const statsMap = new Map();
      if (statsData) {
        statsData.forEach(stat => statsMap.set(stat.team_id, stat));
      }

      const teamsWithStats: Team[] = teamsData
        .map((team) => {
          const stats = statsMap.get(team.id);
          return {
            id: team.id,
            name: team.name,
            position: 0,
            pontos: stats?.pontos || 0,
            jogos: stats?.jogos || 0,
            vitorias: stats?.vitorias || 0,
            empates: stats?.empates || 0,
            derrotas: stats?.derrotas || 0,
            golsMarcados: stats?.gols_marcados || 0,
            golsSofridos: stats?.gols_sofridos || 0,
            saldo: stats?.saldo || 0,
            ultimosJogos: stats?.ultimos_jogos || [],
            logo_url: team.logo_url,
            divisao: team.divisao
          };
        })
        .sort((a, b) => {
          if (b.pontos !== a.pontos) return b.pontos - a.pontos;
          if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
          if (b.saldo !== a.saldo) return b.saldo - a.saldo;
          if (b.golsMarcados !== a.golsMarcados) return b.golsMarcados - a.golsMarcados;
          return a.name.localeCompare(b.name);
        })
        .map((team, index) => ({
          ...team,
          position: index + 1
        }));

      setTeams(teamsWithStats);

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/70 rounded-xl overflow-hidden p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <div className="text-yellow-400">Carregando tabela da Série A...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/70 rounded-xl overflow-hidden shadow-lg border border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full md:min-w-[800px]">
          <thead>
            <tr className="bg-yellow-500/10 border-b border-yellow-500/20 text-sm uppercase tracking-wider">
              <th className="text-left py-4 px-2 md:px-4 text-yellow-400 font-semibold min-w-[40px] md:min-w-[60px]">Pos</th>
              <th className="text-left py-4 px-2 md:px-4 text-yellow-400 font-semibold min-w-[150px] md:min-w-[200px]">Time</th>
              <th className="text-left py-4 px-2 md:px-4 text-yellow-400 font-semibold min-w-[40px] md:min-w-[70px]">PTS</th>
              <th className="text-center py-4 px-2 md:px-4 text-yellow-400 font-semibold min-w-[30px] md:min-w-[50px]">PJ</th>
              <th className="text-center py-4 px-4 text-yellow-400 font-semibold min-w-[50px] hidden md:table-cell">V</th>
              <th className="text-center py-4 px-4 text-yellow-400 font-semibold min-w-[50px] hidden md:table-cell">E</th>
              <th className="text-center py-4 px-4 text-yellow-400 font-semibold min-w-[50px] hidden md:table-cell">D</th>
              <th className="text-center py-4 px-4 text-yellow-400 font-semibold min-w-[50px] hidden md:table-cell">GM</th>
              <th className="text-center py-4 px-4 text-yellow-400 font-semibold min-w-[50px] hidden md:table-cell">GS</th>
              <th className="text-center py-4 px-2 md:px-4 text-yellow-400 font-semibold min-w-[30px] md:min-w-[50px]">SG</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[120px] hidden md:table-cell">Últimas 5</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 md:hidden">
                  Nenhum time encontrado na divisão A
                </td>
                <td colSpan={11} className="py-8 text-center text-gray-500 hidden md:table-cell">
                  Nenhum time encontrado na divisão A
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <TeamRow key={team.id} team={team} totalTeams={teams.length} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legenda Original */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-800">
        <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/20 rounded-full border border-green-500"></div>
            <span>Vantagem Parsec Cup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/20 rounded-full border border-red-500"></div>
            <span>Zona de Rebaixamento</span>
          </div>
        </div>
      </div>
    </div>
  );
}