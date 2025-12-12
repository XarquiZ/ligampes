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
  }, []);

  const fetchTeamsWithStats = async () => {
    try {
      setLoading(true);
      
      // Buscar times da divisão A
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, logo_url, divisao')
        .eq('divisao', 'A')
        .order('name');

      if (teamsError) {
        console.error("Erro ao buscar times:", teamsError);
        return;
      }
      
      if (!teamsData || teamsData.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      // Buscar estatísticas para esses times
      const teamIds = teamsData.map(team => team.id);
      const { data: statsData } = await supabase
        .from('team_stats')
        .select('*')
        .in('team_id', teamIds);

      // Criar um mapa de estatísticas por team_id
      const statsMap = new Map();
      if (statsData) {
        statsData.forEach(stat => {
          statsMap.set(stat.team_id, stat);
        });
      }

      // Combinar os dados
      const teamsWithStats: Team[] = teamsData
        .map((team) => {
          const stats = statsMap.get(team.id);
          
          return {
            id: team.id,
            name: team.name,
            position: 0, // Será calculado após ordenação
            pontos: stats?.pontos || 0,
            jogos: stats?.jogos || 0,
            vitorias: stats?.vitorias || 0,
            empates: stats?.empates || 0,
            derrotas: stats?.derrotas || 0,
            golsMarcados: stats?.gols_marcados || 0,
            golsSofridos: stats?.gols_sofridos || 0,
            saldo: stats?.saldo || 0,
            ultimosJogos: stats?.ultimos_jogos || ["draw", "draw", "draw", "draw", "draw"],
            logo_url: team.logo_url,
            divisao: team.divisao
          };
        })
        // ORDENAÇÃO COM CRITÉRIOS DE DESEMPATE CORRETOS:
        // 1. Pontos → 2. Vitórias → 3. Saldo → 4. Gols Marcados
        .sort((a, b) => {
          // 1º Critério: Pontos
          if (b.pontos !== a.pontos) return b.pontos - a.pontos;
          
          // 2º Critério: Vitórias
          if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
          
          // 3º Critério: Saldo de Gols
          if (b.saldo !== a.saldo) return b.saldo - a.saldo;
          
          // 4º Critério: Gols Marcados
          if (b.golsMarcados !== a.golsMarcados) return b.golsMarcados - a.golsMarcados;
          
          // 5º Critério: Nome (ordem alfabética)
          return a.name.localeCompare(b.name);
        })
        // Atribuir posições finais
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
      <div className="bg-gray-900/70 rounded-xl overflow-hidden p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <div className="text-yellow-400">Carregando tabela da Série A...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/70 rounded-xl overflow-hidden">
      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-yellow-500/10 border-b border-yellow-500/20">
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[60px]">Pos</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[200px]">Time</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[70px]">PTS</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[50px]">PJ</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[50px]">V</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[50px]">E</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[50px]">D</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[50px]">GM</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[50px]">GS</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[50px]">SG</th>
              <th className="text-left py-4 px-4 text-yellow-400 font-semibold min-w-[100px]">Últimas 5</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-500">
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

      {/* Legenda */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500/20 rounded-full border border-green-500"></div>
              <span>Segunda Fase - Copa Parsec (1º-4º)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500/20 rounded-full border border-red-500"></div>
              <span>Rebaixamento (últimos 3)</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Total de times: {teams.length}
          </div>
        </div>
      </div>
    </div>
  );
}