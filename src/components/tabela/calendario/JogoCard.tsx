"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Edit, Youtube, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminMatchModal from "./AdminMatchModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface JogoCardProps {
  jogo: {
    id: string;
    data: string;
    hora: string;
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
    rodada: number;
    status: 'agendado' | 'em_andamento' | 'finalizado';
    placar_casa?: number;
    placar_fora?: number;
    video_url?: string;
    stadium?: string; // Novo campo para o estádio
    divisao: 'A' | 'B';
  };
}

import { useOrganization } from "@/contexts/OrganizationContext";

// Cache global para evitar N requisições (uma por card)
const adminCheckCache = new Map<string, Promise<boolean>>();

export default function JogoCard({ jogo }: JogoCardProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const dataFormatada = format(new Date(jogo.data), "dd 'de' MMMM", { locale: ptBR });

  // Verificar se o usuário é admin com CACHE
  useEffect(() => {
    if (!user || !organization?.id) {
      setIsAdmin(false);
      return;
    }

    const cacheKey = `${user.id}-${organization.id}`;

    const verifyAdmin = async () => {
      // Se já temos o resultado para este usuário em memória, usamos imediatamente
      if (adminCheckCache.has(cacheKey)) {
        const cachedPromise = adminCheckCache.get(cacheKey);
        if (cachedPromise) {
          const isUserAdmin = await cachedPromise;
          setIsAdmin(isUserAdmin);
          return;
        }
      }

      // Se não, criamos a promessa e salvamos no cache
      const checkPromise = (async (): Promise<boolean> => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .eq('organization_id', organization.id)
            .single();

          if (!error && data) {
            return data.role === 'admin';
          }
          return false;
        } catch {
          return false;
        }
      })();

      adminCheckCache.set(cacheKey, checkPromise);

      const result = await checkPromise;
      setIsAdmin(result);
    };

    verifyAdmin();
  }, [user, organization?.id]);

  const getStatusColor = () => {
    switch (jogo.status) {
      case 'agendado':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'em_andamento':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'finalizado':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const getStatusText = () => {
    switch (jogo.status) {
      case 'agendado':
        return 'Agendado';
      case 'em_andamento':
        return 'Ao Vivo';
      case 'finalizado':
        return 'Finalizado';
      default:
        return 'Agendado';
    }
  };

  const handleWatchGame = () => {
    if (jogo.video_url) {
      window.open(jogo.video_url, '_blank');
    }
  };

  return (
    <>
      <Card className="bg-white/5 border-white/10 hover:border-yellow-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-600/10 relative group">
        {/* Botão de edição para admin */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdminModalOpen(true);
            }}
            className="absolute top-2 right-2 z-20 h-8 w-8 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Editar partida (Admin)"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        <CardContent className="p-4">
          {/* Status e rodada */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-yellow-600 bg-yellow-600/10 px-2 py-1 rounded">
              Rodada {jogo.rodada}
            </span>
            <span className={cn(
              "text-xs font-semibold px-2 py-1 rounded border",
              getStatusColor()
            )}>
              {getStatusText()}
            </span>
          </div>

          {/* Data e hora */}
          <div className="text-center mb-6">
            <div className="text-sm text-zinc-400">
              {dataFormatada}
            </div>
            <div className="text-lg font-bold text-white">
              {jogo.hora}
            </div>
          </div>

          {/* Times e placar */}
          <div className="flex items-center justify-between relative">
            {/* Time da casa */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative h-12 w-12 mb-2">
                {jogo.time_casa.logo_url ? (
                  <Image
                    src={jogo.time_casa.logo_url}
                    alt={jogo.time_casa.name}
                    fill
                    sizes="(max-width: 768px) 48px, 48px"
                    className="object-contain"
                  />
                ) : (
                  <div className="h-full w-full bg-zinc-800 rounded-full flex items-center justify-center">
                    <span className="text-xs">{jogo.time_casa.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-center text-white truncate w-full">
                {jogo.time_casa.name}
              </span>
            </div>

            {/* Placar */}
            <div className="flex flex-col items-center w-1/3 z-10">
              <div className="text-2xl font-bold text-white mb-1">
                {jogo.status === 'agendado' ? 'VS' : `${jogo.placar_casa || 0} - ${jogo.placar_fora || 0}`}
              </div>
              {jogo.status === 'finalizado' && (
                <div className="text-xs text-zinc-400">
                  Fim de jogo
                </div>
              )}
            </div>

            {/* Time visitante */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative h-12 w-12 mb-2">
                {jogo.time_fora.logo_url ? (
                  <Image
                    src={jogo.time_fora.logo_url}
                    alt={jogo.time_fora.name}
                    fill
                    sizes="(max-width: 768px) 48px, 48px"
                    className="object-contain"
                  />
                ) : (
                  <div className="h-full w-full bg-zinc-800 rounded-full flex items-center justify-center">
                    <span className="text-xs">{jogo.time_fora.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-center text-white truncate w-full">
                {jogo.time_fora.name}
              </span>
            </div>
          </div>

          {/* Área do Rodapé: Local e Botão de Vídeo */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center justify-center gap-2">
            <div className="text-xs text-zinc-400 text-center">
              {/* Usando o estádio do jogo se disponível, caso contrário usa o padrão */}
              {jogo.stadium || "Estádio Virtual Parsec"}
            </div>

            {/* Botão de Assistir */}
            {jogo.video_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWatchGame}
                className="h-8 gap-2 border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 w-full mt-1"
              >
                <Youtube className="w-4 h-4" />
                Assistir Partida
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Admin */}
      {isAdmin && (
        <AdminMatchModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          match={{
            ...jogo,
            date: jogo.data,
            time: jogo.hora,
            round: jogo.rodada,
            divisao: jogo.divisao,
            status: jogo.status === 'agendado' ? 'scheduled' :
              jogo.status === 'em_andamento' ? 'in_progress' : 'finished',
            home_score: jogo.placar_casa,
            away_score: jogo.placar_fora,
            home_team_id: jogo.time_casa.id,
            away_team_id: jogo.time_fora.id,
            time_casa: jogo.time_casa,
            time_fora: jogo.time_fora,
            video_url: jogo.video_url,
            stadium: jogo.stadium // Passando o estádio para edição
          }}
          currentUser={{
            id: user?.id || '',
            role: 'admin'
          }}
        />
      )}
    </>
  );
}