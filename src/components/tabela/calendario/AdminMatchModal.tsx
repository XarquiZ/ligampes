"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Trophy, Timer, AlertCircle, RefreshCw, Youtube, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  team_id: string;
  position: string;
  overall: number;
  photo_url?: string;
}

interface PlayerStats {
  id?: string;
  player_id: string;
  match_id: string;
  team_id: string;
  goals: number | string; // Permitir string temporariamente para edição
  assists: number | string;
  yellow_cards: number | string;
  red_cards: number | string;
  rating: number | string;
  player?: Player;
  played: boolean;
}

interface Team {
  id: string;
  name: string;
  logo_url?: string;
}

interface Match {
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
  video_url?: string;
  possession_home?: number;
  possession_away?: number;
  shots_home?: number;
  shots_away?: number;
  shots_on_target_home?: number;
  shots_on_target_away?: number;
  corners_home?: number;
  corners_away?: number;
  fouls_home?: number;
  fouls_away?: number;
  time_casa: Team;
  time_fora: Team;
}

interface AdminMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  currentUser: {
    id: string;
    role?: string;
  };
}

const TeamLogo = ({ url, name, size = "md" }: { url?: string, name: string, size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-20 h-20" };
  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 shadow-sm shrink-0`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-contain p-1" onError={(e) => e.currentTarget.style.display = 'none'} />
      ) : (
        <span className="text-zinc-500 font-bold text-xs">{name.substring(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
};

const PlayerAvatar = ({ url, name }: { url?: string, name: string }) => {
  return (
    <div className="w-10 h-10 relative flex items-center justify-center bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 shrink-0">
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
      ) : (
        <span className="text-zinc-500 font-bold text-xs">{name.substring(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
};

export default function AdminMatchModal({ isOpen, onClose, match, currentUser }: AdminMatchModalProps) {
  const [saving, setSaving] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'match' | 'home_players' | 'away_players'>('match');
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [matchData, setMatchData] = useState({
    home_score: match.home_score ?? 0,
    away_score: match.away_score ?? 0,
    status: match.status,
    video_url: match.video_url || '',
    possession_home: match.possession_home ?? 50,
    possession_away: match.possession_away ?? 50,
    shots_home: match.shots_home ?? 0,
    shots_away: match.shots_away ?? 0,
    shots_on_target_home: match.shots_on_target_home ?? 0,
    shots_on_target_away: match.shots_on_target_away ?? 0,
    corners_home: match.corners_home ?? 0,
    corners_away: match.corners_away ?? 0,
    fouls_home: match.fouls_home ?? 0,
    fouls_away: match.fouls_away ?? 0,
  });

  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [homePlayerStats, setHomePlayerStats] = useState<PlayerStats[]>([]);
  const [awayPlayerStats, setAwayPlayerStats] = useState<PlayerStats[]>([]);

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    const loadPlayersAndStats = async () => {
      setLoadingPlayers(true);
      try {
        const [{ data: homeData }, { data: awayData }] = await Promise.all([
          supabase.from('players').select('*').eq('team_id', match.home_team_id).order('overall', { ascending: false }),
          supabase.from('players').select('*').eq('team_id', match.away_team_id).order('overall', { ascending: false })
        ]);

        setHomePlayers(homeData || []);
        setAwayPlayers(awayData || []);

        const { data: existingStats } = await supabase
          .from('player_match_stats')
          .select('*, player:player_id(*)')
          .eq('match_id', match.id);

        const prepareStats = (players: Player[], teamId: string) => {
          const teamExistingStats = (existingStats || []).filter(s => s.team_id === teamId);

          return players.map(player => {
            const existing = teamExistingStats.find(s => s.player_id === player.id);
            if (existing) {
              return {
                ...existing,
                player: existing.player as Player,
                played: true,
                goals: existing.goals ?? 0,
                assists: existing.assists ?? 0,
                yellow_cards: existing.yellow_cards ?? 0,
                red_cards: existing.red_cards ?? 0,
                rating: existing.rating ?? 6.0
              };
            }
            return {
              player_id: player.id,
              match_id: match.id,
              team_id: teamId,
              goals: 0,
              assists: 0,
              yellow_cards: 0,
              red_cards: 0,
              rating: 6.0,
              player,
              played: false // Padrão: Não jogou
            };
          });
        };

        setHomePlayerStats(prepareStats(homeData || [], match.home_team_id));
        setAwayPlayerStats(prepareStats(awayData || [], match.away_team_id));

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar jogadores');
      } finally {
        setLoadingPlayers(false);
      }
    };

    loadPlayersAndStats();
  }, [isOpen, match.id, match.home_team_id, match.away_team_id, isAdmin]);

  const handleMatchDataChange = (field: string, value: any) => {
    setMatchData(prev => {
      // Se for campo de texto (status ou video_url), usa o valor direto
      if (field === 'status' || field === 'video_url') {
        return { ...prev, [field]: value };
      }

      // Se for numérico, converte e valida
      const safeValue = value === '' ? 0 : (isNaN(Number(value)) ? 0 : Number(value));
      const newData = { ...prev, [field]: safeValue };

      // Atualização automática de posse de bola
      if (field === 'possession_home') newData.possession_away = 100 - safeValue;
      if (field === 'possession_away') newData.possession_home = 100 - safeValue;

      return newData;
    });
  };

  const handlePlayerStatChange = (team: 'home' | 'away', playerId: string, field: string, value: any) => {
    const setStats = team === 'home' ? setHomePlayerStats : setAwayPlayerStats;

    if (field === 'played') {
      setStats(prev => prev.map(stat =>
        stat.player_id === playerId ? { ...stat, played: value } : stat
      ));
      return;
    }

    if (value === '') {
      setStats(prev => prev.map(stat =>
        stat.player_id === playerId ? { ...stat, [field]: '' } : stat
      ));
      return;
    }

    let numValue = Number(value);
    if (isNaN(numValue)) return;

    if (field === 'rating') {
      numValue = Math.max(0, Math.min(9.99, numValue));
    } else if (field === 'yellow_cards') {
      numValue = Math.max(0, Math.min(2, numValue));
    } else if (field === 'red_cards') {
      numValue = Math.max(0, Math.min(1, numValue));
    } else {
      numValue = Math.max(0, numValue);
    }

    setStats(prev => prev.map(stat => {
      if (stat.player_id !== playerId) return stat;

      // Auto-mark as played if modifying a stat (excluding played toggle itself which is handled above)
      // and checking if the value corresponds to active participation (e.g. > 0 goals/cards/rating change)
      // Actually, simply touching a stat implies they might have played.
      // But let's be strict: if value is effectively 0/empty, we don't force 'played=true' unless it was already true?
      // User asked: "conforme eu for aplicando os stats eu ativar"

      const updates: any = { [field]: numValue };
      if (!stat.played) {
        updates.played = true;
      }
      return { ...stat, ...updates };
    }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const recalculateTeamStats = async (teamId: string) => {
    const { data: matches } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score, status, shots_home, shots_away, possession_home, possession_away')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .eq('status', 'finished')
      .order('date', { ascending: false });

    if (!matches) return;

    let stats = {
      pontos: 0,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      gols_marcados: 0,
      gols_sofridos: 0,
      ultimos_jogos: [] as string[],
      posse_total: 0,
      finalizacoes: 0
    };

    matches.forEach(m => {
      stats.jogos++;

      const isHome = m.home_team_id === teamId;
      const myScore = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const opponentScore = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);

      const myShots = isHome ? (m.shots_home ?? 0) : (m.shots_away ?? 0);
      const myPossession = isHome ? (m.possession_home ?? 50) : (m.possession_away ?? 50);

      stats.gols_marcados += myScore;
      stats.gols_sofridos += opponentScore;
      stats.finalizacoes += myShots;
      stats.posse_total += myPossession;

      let resultChar = '';
      if (myScore > opponentScore) {
        stats.vitorias++;
        stats.pontos += 3;
        resultChar = 'V';
      } else if (myScore === opponentScore) {
        stats.empates++;
        stats.pontos += 1;
        resultChar = 'E';
      } else {
        stats.derrotas++;
        resultChar = 'D';
      }

      if (stats.ultimos_jogos.length < 5) {
        stats.ultimos_jogos.unshift(resultChar);
      }
    });

    const posse_media = stats.jogos > 0 ? Number((stats.posse_total / stats.jogos).toFixed(2)) : 0;

    const { error } = await supabase
      .from('team_stats')
      .upsert({
        team_id: teamId,
        pontos: stats.pontos,
        jogos: stats.jogos,
        vitorias: stats.vitorias,
        empates: stats.empates,
        derrotas: stats.derrotas,
        gols_marcados: stats.gols_marcados,
        gols_sofridos: stats.gols_sofridos,
        ultimos_jogos: stats.ultimos_jogos,
        posse_media: posse_media,
        finalizacoes: stats.finalizacoes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id' });

    if (error) console.error(`Erro ao atualizar stats do time ${teamId}:`, error);
  };

  const recalculatePlayerStats = async (playerId: string, teamId: string, playerName: string) => {
    const { data: stats } = await supabase
      .from('player_match_stats')
      .select('goals, assists, yellow_cards, red_cards, rating')
      .eq('player_id', playerId)
      .eq('team_id', teamId);

    if (!stats) return;

    let agg = {
      gols: 0,
      assistencias: 0,
      cartoes_amarelos: 0,
      cartoes_vermelhos: 0,
      jogos: 0,
      total_rating: 0,
      avg_rating: 0
    };

    stats.forEach(s => {
      agg.jogos++;
      agg.gols += s.goals || 0;
      agg.assistencias += s.assists || 0;
      agg.cartoes_amarelos += s.yellow_cards || 0;
      agg.cartoes_vermelhos += s.red_cards || 0;
      agg.total_rating += Number(s.rating) || 0;
    });

    if (agg.jogos > 0) {
      const average = agg.total_rating / agg.jogos;
      let safeAvg = isFinite(average) ? Number(average.toFixed(2)) : 0;
      safeAvg = Math.min(9.99, safeAvg);
      agg.avg_rating = safeAvg;
    } else {
      agg.avg_rating = 0;
    }

    const { error } = await supabase
      .from('player_stats')
      .upsert({
        player_id: playerId,
        team_id: teamId,
        player_name: playerName,
        gols: agg.gols,
        assistencias: agg.assistencias,
        cartoes_amarelos: agg.cartoes_amarelos,
        cartoes_vermelhos: agg.cartoes_vermelhos,
        jogos: agg.jogos,
        total_rating: agg.total_rating,
        avg_rating: agg.avg_rating,
        updated_at: new Date().toISOString()
      }, { onConflict: 'player_id, team_id' });

    if (error) console.error(`Erro ao atualizar stats do jogador ${playerName}:`, error);
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    setSaving(true);
    setLoadingPhase("Salvando partida...");

    try {
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          ...matchData,
          updated_at: new Date().toISOString()
        })
        .eq('id', match.id);

      if (matchError) throw matchError;

      if (matchData.status === 'finished') {
        setLoadingPhase("Salvando estatísticas dos jogadores...");

        const allPlayerStats = [...homePlayerStats, ...awayPlayerStats];

        const matchStatsPromises = allPlayerStats.map(async (stat) => {
          if (!stat.played) {
            if (stat.id) {
              return supabase.from('player_match_stats').delete().eq('id', stat.id);
            }
            return Promise.resolve();
          }

          const goals = stat.goals === '' ? 0 : Number(stat.goals);
          const assists = stat.assists === '' ? 0 : Number(stat.assists);
          const yellow = stat.yellow_cards === '' ? 0 : Number(stat.yellow_cards);
          const red = stat.red_cards === '' ? 0 : Number(stat.red_cards);
          const ratingVal = stat.rating === '' ? 6.0 : Number(stat.rating);

          const safeRating = Math.min(9.99, Math.max(0, ratingVal));

          const statData = {
            player_id: stat.player_id,
            match_id: stat.match_id,
            team_id: stat.team_id,
            goals: goals,
            assists: assists,
            yellow_cards: yellow,
            red_cards: red,
            rating: safeRating,
            updated_at: new Date().toISOString()
          };

          return supabase.from('player_match_stats').upsert(statData, {
            onConflict: 'player_id,match_id'
          });
        });

        await Promise.all(matchStatsPromises);

        setLoadingPhase("Atualizando estatísticas gerais...");
        await new Promise(resolve => setTimeout(resolve, 500));

        const playerAggPromises = allPlayerStats.map(stat =>
          recalculatePlayerStats(stat.player_id, stat.team_id, stat.player?.name || 'Unknown')
        );
        await Promise.all(playerAggPromises);

        setLoadingPhase("Atualizando tabelas e classificações...");
        await Promise.all([
          recalculateTeamStats(match.home_team_id),
          recalculateTeamStats(match.away_team_id)
        ]);
      }

      toast.success('Partida e estatísticas atualizadas com sucesso!');

      setTimeout(() => {
        onClose();
        window.dispatchEvent(new Event('match-updated'));
      }, 1000);

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(`Erro: ${error.message || 'Falha ao salvar'}`);
    } finally {
      setSaving(false);
      setLoadingPhase("");
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-full sm:max-w-5xl h-[100dvh] sm:h-[90vh] flex flex-col p-0 bg-zinc-950 border-zinc-800 text-white overflow-hidden" aria-describedby="match-modal-description">
        <DialogDescription id="match-modal-description" className="sr-only">
          Janela de edição de detalhes da partida, incluindo placar e estatísticas dos jogadores.
        </DialogDescription>

        {/* CABEÇALHO DO PLACAR (MINIMIZADO) */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0 shadow-xl z-10 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Timer className="w-5 h-5 text-yellow-500" />
            Gerenciar Partida
          </DialogTitle>
        </div>

        {/* NAVEGAÇÃO */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 gap-6 text-sm font-medium shrink-0 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('match')}
            className={`py-4 border-b-2 transition-all duration-200 ${activeTab === 'match' ? 'border-yellow-500 text-yellow-500 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Estatísticas da Partida
          </button>
          <button
            onClick={() => setActiveTab('home_players')}
            className={`py-4 border-b-2 transition-all duration-200 ${activeTab === 'home_players' ? 'border-yellow-500 text-yellow-500 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Jogadores {match.time_casa.name}
          </button>
          <button
            onClick={() => setActiveTab('away_players')}
            className={`py-4 border-b-2 transition-all duration-200 ${activeTab === 'away_players' ? 'border-yellow-500 text-yellow-500 font-bold' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Jogadores {match.time_fora.name}
          </button>
        </div>

        {/* CONTEÚDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto bg-zinc-950/50 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

          {/* ABA 1: ESTATÍSTICAS DO JOGO */}
          {activeTab === 'match' && (
            <div className="max-w-3xl mx-auto space-y-8 p-6 animate-in fade-in duration-300">

              {/* PLACAR E STATUS (MOVIDO DO HEADER) */}
              <div className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/50 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Status da Partida</h3>
                  <div className="flex items-center gap-2">
                    <Select
                      value={matchData.status}
                      onValueChange={(value: any) => handleMatchDataChange('status', value)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs border-zinc-700 bg-zinc-800 focus:ring-yellow-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-800">
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="finished">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Score Board */}
                <div className="flex items-center justify-center gap-4 md:gap-16">
                  {/* Time da Casa */}
                  <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3">
                    <TeamLogo url={match.time_casa.logo_url} name={match.time_casa.name} size="md" />
                    <span className="font-bold text-sm md:text-lg text-center leading-tight tracking-tight line-clamp-2">{match.time_casa.name}</span>
                  </div>

                  {/* Placar Central */}
                  <div className="flex items-center gap-2 md:gap-4 shrink-0 bg-black/40 p-2 md:p-4 rounded-xl border border-zinc-800 backdrop-blur-sm shadow-inner">
                    <Input
                      type="number"
                      min="0"
                      value={matchData.home_score}
                      onChange={(e) => handleMatchDataChange('home_score', e.target.value)}
                      onFocus={handleFocus}
                      className="w-12 h-10 md:w-16 md:h-14 text-2xl md:text-4xl font-bold text-center border-zinc-700 bg-zinc-900 focus:border-yellow-500 focus:ring-yellow-500/20 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xl md:text-2xl text-zinc-600 font-light">X</span>
                    <Input
                      type="number"
                      min="0"
                      value={matchData.away_score}
                      onChange={(e) => handleMatchDataChange('away_score', e.target.value)}
                      onFocus={handleFocus}
                      className="w-12 h-10 md:w-16 md:h-14 text-2xl md:text-4xl font-bold text-center border-zinc-700 bg-zinc-900 focus:border-yellow-500 focus:ring-yellow-500/20 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Time Visitante */}
                  <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3">
                    <TeamLogo url={match.time_fora.logo_url} name={match.time_fora.name} size="md" />
                    <span className="font-bold text-sm md:text-lg text-center leading-tight tracking-tight line-clamp-2">{match.time_fora.name}</span>
                  </div>
                </div>

                {/* Link Transmissão */}
                <div className="flex justify-center w-full pt-2 border-t border-zinc-800/50">
                  <div className="w-full max-w-lg relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Youtube className="h-4 w-4 text-red-500/70 group-focus-within:text-red-500 transition-colors" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Link da transmissão (YouTube)"
                      value={matchData.video_url}
                      onChange={(e) => handleMatchDataChange('video_url', e.target.value)}
                      className="pl-9 h-9 bg-zinc-900/50 border-zinc-700 text-sm text-center focus:text-left transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Barra de Posse */}
              <div className="space-y-3 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50">
                <div className="flex justify-between text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Posse de Bola</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-24">
                    <Input
                      type="number"
                      value={matchData.possession_home}
                      onChange={(e) => handleMatchDataChange('possession_home', e.target.value)}
                      onFocus={handleFocus}
                      className="text-right pr-8 border-zinc-700 bg-zinc-900 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">%</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="bg-gradient-to-r from-yellow-700 to-yellow-500 h-full transition-all duration-500 ease-out"
                      style={{ width: `${matchData.possession_home}%` }}
                    />
                    <div className="bg-zinc-700 h-full flex-1 transition-all duration-500" />
                  </div>
                  <div className="relative w-24">
                    <Input
                      type="number"
                      value={matchData.possession_away}
                      onChange={(e) => handleMatchDataChange('possession_away', e.target.value)}
                      onFocus={handleFocus}
                      className="pl-4 border-zinc-700 bg-zinc-900 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">%</span>
                  </div>
                </div>
              </div>

              {/* Grid de Stats */}
              <div className="grid grid-cols-1 gap-4 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/50">
                {[
                  { label: "Finalizações", keyHome: "shots_home", keyAway: "shots_away" },
                  { label: "No Gol", keyHome: "shots_on_target_home", keyAway: "shots_on_target_away" },
                  { label: "Escanteios", keyHome: "corners_home", keyAway: "corners_away" },
                  { label: "Faltas", keyHome: "fouls_home", keyAway: "fouls_away" },
                ].map((stat, i) => (
                  <div key={stat.label} className={`grid grid-cols-3 items-center gap-4 py-2 ${i !== 3 ? 'border-b border-zinc-800/50' : ''}`}>
                    <Input
                      type="number"
                      min="0"
                      value={(matchData as any)[stat.keyHome]}
                      onChange={(e) => handleMatchDataChange(stat.keyHome, e.target.value)}
                      onFocus={handleFocus}
                      className="text-center border-zinc-700 bg-zinc-800 focus:border-yellow-500 h-10 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Label className="text-center text-zinc-400 uppercase text-xs font-bold tracking-widest">
                      {stat.label}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={(matchData as any)[stat.keyAway]}
                      onChange={(e) => handleMatchDataChange(stat.keyAway, e.target.value)}
                      onFocus={handleFocus}
                      className="text-center border-zinc-700 bg-zinc-800 focus:border-yellow-500 h-10 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 2 & 3: JOGADORES */}
          {(activeTab === 'home_players' || activeTab === 'away_players') && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              {loadingPlayers ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-zinc-500 p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
                  <p>Carregando elenco e estatísticas...</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <div className="min-w-[800px]">
                      {/* Cabeçalho Fixo - Corrigido */}
                      <div className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800 shadow-lg px-6 py-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          <div className="col-span-4 pl-2">Jogador</div>
                          <div className="col-span-1 text-center">Gols</div>
                          <div className="col-span-1 text-center">Assis</div>
                          <div className="col-span-2 text-center">Cartões</div>
                          <div className="col-span-2 text-center">Nota</div>
                          <div className="col-span-2 text-center">Status</div>
                        </div>
                      </div>

                      {/* Lista com scroll */}
                      <div className="p-6 space-y-2">
                        {(activeTab === 'home_players' ? homePlayerStats : awayPlayerStats).map((stat) => (
                          <div
                            key={`${stat.team_id}-${stat.player_id}`}
                            className={cn(
                              "grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg border transition-all duration-200",
                              stat.played
                                ? "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800"
                                : "bg-zinc-950 border-zinc-900 opacity-60"
                            )}
                          >
                            {/* Avatar e Nome */}
                            <div className="col-span-4 flex items-center gap-3">
                              <PlayerAvatar url={stat.player?.photo_url} name={stat.player?.name || "?"} />
                              <div className="flex flex-col overflow-hidden">
                                <span className={cn("font-medium text-sm truncate", stat.played ? "text-zinc-200" : "text-zinc-500")} title={stat.player?.name}>
                                  {stat.player?.name}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-[10px] uppercase font-bold tracking-wider">
                                    {stat.player?.position}
                                  </span>
                                  <span className="text-[10px]">OVR: {stat.player?.overall}</span>
                                </div>
                              </div>
                            </div>

                            {/* Inputs de Stats */}
                            <div className="col-span-1">
                              <Input
                                type="number"
                                min="0"
                                value={stat.goals}
                                disabled={!stat.played}
                                onChange={(e) => handlePlayerStatChange(activeTab === 'home_players' ? 'home' : 'away', stat.player_id, 'goals', e.target.value)}
                                onFocus={handleFocus}
                                className={cn(
                                  "h-9 text-center px-0 border-zinc-800 bg-zinc-950 focus:border-green-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                  Number(stat.goals) > 0 && stat.played ? 'text-green-500 font-bold bg-green-950/20 border-green-900/50' : ''
                                )}
                              />
                            </div>

                            <div className="col-span-1">
                              <Input
                                type="number"
                                min="0"
                                value={stat.assists}
                                disabled={!stat.played}
                                onChange={(e) => handlePlayerStatChange(activeTab === 'home_players' ? 'home' : 'away', stat.player_id, 'assists', e.target.value)}
                                onFocus={handleFocus}
                                className={cn(
                                  "h-9 text-center px-0 border-zinc-800 bg-zinc-950 focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                  Number(stat.assists) > 0 && stat.played ? 'text-blue-500 font-bold bg-blue-950/20 border-blue-900/50' : ''
                                )}
                              />
                            </div>

                            <div className="col-span-2 flex gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="2"
                                value={stat.yellow_cards}
                                placeholder="0"
                                disabled={!stat.played}
                                onChange={(e) => handlePlayerStatChange(activeTab === 'home_players' ? 'home' : 'away', stat.player_id, 'yellow_cards', e.target.value)}
                                onFocus={handleFocus}
                                className={cn(
                                  "h-9 text-center px-0 border-zinc-800 bg-zinc-950 focus:border-yellow-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                  Number(stat.yellow_cards) > 0 && stat.played ? 'text-yellow-500 font-bold bg-yellow-950/20 border-yellow-900/50' : ''
                                )}
                              />
                              <Input
                                type="number"
                                min="0"
                                max="1"
                                value={stat.red_cards}
                                placeholder="0"
                                disabled={!stat.played}
                                onChange={(e) => handlePlayerStatChange(activeTab === 'home_players' ? 'home' : 'away', stat.player_id, 'red_cards', e.target.value)}
                                onFocus={handleFocus}
                                className={cn(
                                  "h-9 text-center px-0 border-zinc-800 bg-zinc-950 focus:border-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                  Number(stat.red_cards) > 0 && stat.played ? 'text-red-500 font-bold bg-red-950/20 border-red-900/50' : ''
                                )}
                              />
                            </div>

                            <div className="col-span-2 pl-2">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="9.99"
                                value={stat.rating}
                                disabled={!stat.played}
                                onChange={(e) => handlePlayerStatChange(activeTab === 'home_players' ? 'home' : 'away', stat.player_id, 'rating', e.target.value)}
                                onFocus={handleFocus}
                                className={cn(
                                  "h-9 text-center font-bold border-zinc-800 bg-zinc-950 focus:border-yellow-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                  stat.played && Number(stat.rating) >= 8.0 ? 'text-green-500 border-green-900/30' :
                                    stat.played && Number(stat.rating) >= 6.0 ? 'text-yellow-500 border-yellow-900/30' :
                                      stat.played ? 'text-red-500 border-red-900/30' : ''
                                )}
                              />
                            </div>

                            {/* Coluna de Ações / Status Jogou */}
                            <div className="col-span-2 flex justify-center items-center gap-2">
                              {stat.played ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlayerStatChange(activeTab === 'home_players' ? 'home' : 'away', stat.player_id, 'played', false)}
                                  className="h-8 w-8 p-0 text-green-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="Jogou (Clique para marcar como não jogou)"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlayerStatChange(activeTab === 'home_players' ? 'home' : 'away', stat.player_id, 'played', true)}
                                  className="h-8 w-8 p-0 text-zinc-600 hover:text-green-500 hover:bg-green-500/10 transition-colors"
                                  title="Não jogou (Clique para marcar como jogou)"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              )}

                              {stat.played && Number(stat.rating) >= 9.0 && <Trophy className="w-4 h-4 text-yellow-500 animate-pulse ml-1" />}
                              {stat.played && Number(stat.goals) >= 3 && <div className="text-[10px] bg-zinc-800 px-1 rounded border border-zinc-700">HAT</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ FIXO */}
        <DialogFooter className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            {saving && <span className="animate-pulse text-yellow-500">{loadingPhase}</span>}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-600 hover:bg-yellow-700 text-white min-w-[160px] shadow-lg shadow-yellow-900/20"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Tudo
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}