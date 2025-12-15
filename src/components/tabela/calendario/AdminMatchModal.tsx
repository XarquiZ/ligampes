"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  team_id: string;
  position: string;
  overall: number;
}

interface PlayerStats {
  id?: string;
  player_id: string;
  match_id: string;
  team_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  rating: number;
  player?: Player;
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

export default function AdminMatchModal({ isOpen, onClose, match, currentUser }: AdminMatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [matchData, setMatchData] = useState({
    home_score: match.home_score || 0,
    away_score: match.away_score || 0,
    status: match.status,
    possession_home: match.possession_home || 50,
    possession_away: match.possession_away || 50,
    shots_home: match.shots_home || 0,
    shots_away: match.shots_away || 0,
    shots_on_target_home: match.shots_on_target_home || 0,
    shots_on_target_away: match.shots_on_target_away || 0,
    corners_home: match.corners_home || 0,
    corners_away: match.corners_away || 0,
    fouls_home: match.fouls_home || 0,
    fouls_away: match.fouls_away || 0,
  });

  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [homePlayerStats, setHomePlayerStats] = useState<PlayerStats[]>([]);
  const [awayPlayerStats, setAwayPlayerStats] = useState<PlayerStats[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Verificar se usuário é admin
  const isAdmin = currentUser.role === 'admin';

  // Carregar jogadores dos times
  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    const loadPlayers = async () => {
      setLoadingPlayers(true);
      try {
        // Carregar jogadores do time da casa
        const { data: homePlayersData } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', match.home_team_id)
          .order('overall', { ascending: false });

        // Carregar jogadores do time visitante
        const { data: awayPlayersData } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', match.away_team_id)
          .order('overall', { ascending: false });

        // Carregar estatísticas existentes
        const { data: existingStats } = await supabase
          .from('player_match_stats')
          .select('*, player:player_id(*)')
          .eq('match_id', match.id);

        setHomePlayers(homePlayersData || []);
        setAwayPlayers(awayPlayersData || []);

        // Separar estatísticas por time
        const homeStats = (existingStats || [])
          .filter(stat => stat.team_id === match.home_team_id)
          .map(stat => ({
            ...stat,
            player: stat.player as Player
          }));

        const awayStats = (existingStats || [])
          .filter(stat => stat.team_id === match.away_team_id)
          .map(stat => ({
            ...stat,
            player: stat.player as Player
          }));

        setHomePlayerStats(homeStats);
        setAwayPlayerStats(awayStats);

        // Inicializar estatísticas para jogadores que ainda não têm
        homePlayersData?.forEach(player => {
          if (!homeStats.find(stat => stat.player_id === player.id)) {
            setHomePlayerStats(prev => [...prev, {
              player_id: player.id,
              match_id: match.id,
              team_id: match.home_team_id,
              goals: 0,
              assists: 0,
              yellow_cards: 0,
              red_cards: 0,
              rating: 6.0,
              player
            }]);
          }
        });

        awayPlayersData?.forEach(player => {
          if (!awayStats.find(stat => stat.player_id === player.id)) {
            setAwayPlayerStats(prev => [...prev, {
              player_id: player.id,
              match_id: match.id,
              team_id: match.away_team_id,
              goals: 0,
              assists: 0,
              yellow_cards: 0,
              red_cards: 0,
              rating: 6.0,
              player
            }]);
          }
        });

      } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        toast.error('Erro ao carregar jogadores');
      } finally {
        setLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, [isOpen, match.id, match.home_team_id, match.away_team_id, isAdmin]);

  const handleMatchDataChange = (field: string, value: any) => {
    setMatchData(prev => ({ ...prev, [field]: value }));
    
    // Atualizar automaticamente a posse do outro time
    if (field === 'possession_home') {
      setMatchData(prev => ({ 
        ...prev, 
        possession_home: value,
        possession_away: 100 - value 
      }));
    } else if (field === 'possession_away') {
      setMatchData(prev => ({ 
        ...prev, 
        possession_away: value,
        possession_home: 100 - value 
      }));
    }
  };

  const handlePlayerStatChange = (team: 'home' | 'away', playerId: string, field: string, value: number) => {
    const setStats = team === 'home' ? setHomePlayerStats : setAwayPlayerStats;
    
    // Validações específicas por campo
    let validatedValue = value;
    
    if (field === 'rating') {
      // Rating entre 0 e 9.99 (numeric(3,2) no banco)
      validatedValue = Math.max(0, Math.min(9.99, value));
      validatedValue = Math.round(validatedValue * 100) / 100; // Arredondar para 2 casas decimais
    } else if (field === 'yellow_cards') {
      validatedValue = Math.max(0, Math.min(2, value));
    } else if (field === 'red_cards') {
      validatedValue = Math.max(0, Math.min(1, value));
    } else if (field === 'goals' || field === 'assists') {
      validatedValue = Math.max(0, value);
    }
    
    setStats(prev => prev.map(stat => 
      stat.player_id === playerId 
        ? { ...stat, [field]: validatedValue }
        : stat
    ));
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar partidas');
      return;
    }
  
    console.log('=== INICIANDO SAVE ===');
    console.log('Partida ID:', match.id);
    console.log('Dados do match:', matchData);
  
    setSaving(true);
    try {
      // 1. Atualizar dados da partida
      const { data: matchUpdateData, error: matchError } = await supabase
        .from('matches')
        .update({
          home_score: matchData.home_score,
          away_score: matchData.away_score,
          status: matchData.status,
          possession_home: matchData.possession_home,
          possession_away: matchData.possession_away,
          shots_home: matchData.shots_home,
          shots_away: matchData.shots_away,
          shots_on_target_home: matchData.shots_on_target_home,
          shots_on_target_away: matchData.shots_on_target_away,
          corners_home: matchData.corners_home,
          corners_away: matchData.corners_away,
          fouls_home: matchData.fouls_home,
          fouls_away: matchData.fouls_away,
          updated_at: new Date().toISOString()
        })
        .eq('id', match.id)
        .select();
  
      if (matchError) {
        console.error('Erro ao atualizar match:', matchError);
        throw matchError;
      }
  
      console.log('✅ Match atualizado:', matchUpdateData);
  
      // 2. Salvar estatísticas dos jogadores (apenas se a partida está finalizada)
      if (matchData.status === 'finished') {
        const allPlayerStats = [...homePlayerStats, ...awayPlayerStats];
        console.log('Salvando estatísticas de jogadores:', allPlayerStats.length);
        
        for (const stat of allPlayerStats) {
          // Validar rating
          const safeRating = Math.max(0, Math.min(9.99, stat.rating || 6.0));
          const safeRatingRounded = Math.round(safeRating * 100) / 100;
          
          // Verificar se já existe estatística para este jogador nesta partida
          if (stat.id) {
            // Atualizar existente
            const { error } = await supabase
              .from('player_match_stats')
              .update({
                goals: stat.goals || 0,
                assists: stat.assists || 0,
                yellow_cards: stat.yellow_cards || 0,
                red_cards: stat.red_cards || 0,
                rating: safeRatingRounded,
                updated_at: new Date().toISOString()
              })
              .eq('id', stat.id);

            if (error) {
              console.error('Erro ao atualizar stat do jogador:', error);
            }
          } else {
            // Inserir nova
            const { error } = await supabase
              .from('player_match_stats')
              .insert({
                player_id: stat.player_id,
                match_id: stat.match_id,
                team_id: stat.team_id,
                goals: stat.goals || 0,
                assists: stat.assists || 0,
                yellow_cards: stat.yellow_cards || 0,
                red_cards: stat.red_cards || 0,
                rating: safeRatingRounded
              });

            if (error) {
              console.error('Erro ao inserir stat do jogador:', error);
            }
          }
        }
      }
  
      toast.success('Partida atualizada com sucesso!');
      
      // Fechar modal após 1.5 segundos para ver o toast
      setTimeout(() => {
        onClose();
        window.dispatchEvent(new CustomEvent('match-updated'));
      }, 1500);
  
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast.error(`Erro: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Acesso Restrito</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Apenas administradores podem editar informações da partida.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-zinc-400">
              Você não tem permissão para editar esta partida.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Editar Partida: {match.time_casa.name} vs {match.time_fora.name}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Rodada {match.round} - {match.divisao === 'A' ? 'Série A' : 'Série B'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Placar e Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-zinc-800/50 rounded-lg">
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Status da Partida</Label>
                <Select 
                  value={matchData.status} 
                  onValueChange={(value: any) => handleMatchDataChange('status', value)}
                >
                  <SelectTrigger className="border-zinc-600 bg-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-600 bg-zinc-800">
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">Gols {match.time_casa.name}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={matchData.home_score}
                    onChange={(e) => handleMatchDataChange('home_score', parseInt(e.target.value) || 0)}
                    className="border-zinc-600 bg-zinc-800"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Gols {match.time_fora.name}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={matchData.away_score}
                    onChange={(e) => handleMatchDataChange('away_score', parseInt(e.target.value) || 0)}
                    className="border-zinc-600 bg-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Estatísticas do Time - Posse e Finalizações */}
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Posse de Bola (%)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={matchData.possession_home}
                      onChange={(e) => handleMatchDataChange('possession_home', parseInt(e.target.value) || 50)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                    <p className="text-xs text-zinc-500 mt-1">{match.time_casa.name}</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={matchData.possession_away}
                      onChange={(e) => handleMatchDataChange('possession_away', parseInt(e.target.value) || 50)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                    <p className="text-xs text-zinc-500 mt-1">{match.time_fora.name}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-zinc-300">Finalizações no Gol</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={matchData.shots_on_target_home}
                      onChange={(e) => handleMatchDataChange('shots_on_target_home', parseInt(e.target.value) || 0)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={matchData.shots_on_target_away}
                      onChange={(e) => handleMatchDataChange('shots_on_target_away', parseInt(e.target.value) || 0)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Outras Estatísticas */}
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Faltas</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={matchData.fouls_home}
                      onChange={(e) => handleMatchDataChange('fouls_home', parseInt(e.target.value) || 0)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={matchData.fouls_away}
                      onChange={(e) => handleMatchDataChange('fouls_away', parseInt(e.target.value) || 0)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-zinc-300">Escanteios</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={matchData.corners_home}
                      onChange={(e) => handleMatchDataChange('corners_home', parseInt(e.target.value) || 0)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={matchData.corners_away}
                      onChange={(e) => handleMatchDataChange('corners_away', parseInt(e.target.value) || 0)}
                      className="border-zinc-600 bg-zinc-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas dos Jogadores */}
          {loadingPlayers ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
              <span className="ml-2">Carregando jogadores...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time da Casa */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                  {match.time_casa.name} - Jogadores
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {homePlayerStats.map((stat, index) => (
                    <div 
                      key={`home-${stat.player_id}-${index}-${stat.match_id}`} 
                      className="p-3 bg-zinc-800/50 rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{stat.player?.name}</span>
                        <span className="text-sm text-zinc-400">Overall: {stat.player?.overall}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div>
                          <Label className="text-xs text-zinc-400">Gols</Label>
                          <Input
                            type="number"
                            min="0"
                            value={stat.goals}
                            onChange={(e) => handlePlayerStatChange('home', stat.player_id, 'goals', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Assist.</Label>
                          <Input
                            type="number"
                            min="0"
                            value={stat.assists}
                            onChange={(e) => handlePlayerStatChange('home', stat.player_id, 'assists', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Amarelo</Label>
                          <Input
                            type="number"
                            min="0"
                            max="2"
                            value={stat.yellow_cards}
                            onChange={(e) => handlePlayerStatChange('home', stat.player_id, 'yellow_cards', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Vermelho</Label>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            value={stat.red_cards}
                            onChange={(e) => handlePlayerStatChange('home', stat.player_id, 'red_cards', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Nota</Label>
                          <Input
                            type="number"
                            min="0"
                            max="9.99"
                            step="0.1"
                            value={stat.rating}
                            onChange={(e) => handlePlayerStatChange('home', stat.player_id, 'rating', parseFloat(e.target.value) || 6.0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Visitante */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                  {match.time_fora.name} - Jogadores
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {awayPlayerStats.map((stat, index) => (
                    <div 
                      key={`away-${stat.player_id}-${index}-${stat.match_id}`} 
                      className="p-3 bg-zinc-800/50 rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{stat.player?.name}</span>
                        <span className="text-sm text-zinc-400">Overall: {stat.player?.overall}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div>
                          <Label className="text-xs text-zinc-400">Gols</Label>
                          <Input
                            type="number"
                            min="0"
                            value={stat.goals}
                            onChange={(e) => handlePlayerStatChange('away', stat.player_id, 'goals', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Assist.</Label>
                          <Input
                            type="number"
                            min="0"
                            value={stat.assists}
                            onChange={(e) => handlePlayerStatChange('away', stat.player_id, 'assists', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Amarelo</Label>
                          <Input
                            type="number"
                            min="0"
                            max="2"
                            value={stat.yellow_cards}
                            onChange={(e) => handlePlayerStatChange('away', stat.player_id, 'yellow_cards', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Vermelho</Label>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            value={stat.red_cards}
                            onChange={(e) => handlePlayerStatChange('away', stat.player_id, 'red_cards', parseInt(e.target.value) || 0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Nota</Label>
                          <Input
                            type="number"
                            min="0"
                            max="9.99"
                            step="0.1"
                            value={stat.rating}
                            onChange={(e) => handlePlayerStatChange('away', stat.player_id, 'rating', parseFloat(e.target.value) || 6.0)}
                            className="h-8 border-zinc-600 bg-zinc-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="border-zinc-600 text-zinc-300 hover:text-white"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Partida
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}