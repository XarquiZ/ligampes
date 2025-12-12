"use client";

import { useState } from "react";

interface ProximoJogo {
  id: number;
  data: Date;
  hora: string;
  rodada: number;
  timeCasa: string;
  timeFora: string;
  estadio: string;
  divisao: "SERIE_A" | "SERIE_B";
}

export default function ProximosJogos() {
  const [divisaoAtiva, setDivisaoAtiva] = useState<"SERIE_A" | "SERIE_B">("SERIE_A");
  
  const proximosJogos: ProximoJogo[] = [
    {
      id: 1,
      data: new Date(2024, 2, 20),
      hora: "16:00",
      rodada: 6,
      timeCasa: "Time A",
      timeFora: "Time C",
      estadio: "Estádio Central",
      divisao: "SERIE_A"
    },
    {
      id: 2,
      data: new Date(2024, 2, 21),
      hora: "19:30",
      rodada: 6,
      timeCasa: "Time B",
      timeFora: "Time D",
      estadio: "Estádio Municipal",
      divisao: "SERIE_A"
    },
    {
      id: 3,
      data: new Date(2024, 2, 22),
      hora: "20:00",
      rodada: 3,
      timeCasa: "Time Série B 1",
      timeFora: "Time Série B 3",
      estadio: "Arena B",
      divisao: "SERIE_B"
    },
  ];

  const jogosFiltrados = proximosJogos.filter(jogo => jogo.divisao === divisaoAtiva);

  return (
    <div className="bg-gray-900/50 rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-yellow-400">Próximos Jogos</h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setDivisaoAtiva("SERIE_A")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              divisaoAtiva === "SERIE_A"
                ? "bg-yellow-500 text-black font-semibold"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Série A
          </button>
          <button
            onClick={() => setDivisaoAtiva("SERIE_B")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              divisaoAtiva === "SERIE_B"
                ? "bg-yellow-500 text-black font-semibold"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Série B
          </button>
        </div>
      </div>

      {/* Cards de Próximos Jogos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jogosFiltrados.map((jogo) => (
          <div 
            key={jogo.id} 
            className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/50 transition-colors group"
          >
            {/* Cabeçalho do Card */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {jogo.data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </div>
                <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  Rodada {jogo.rodada}
                </div>
              </div>
              <div className="text-lg font-bold text-yellow-400 mt-1">
                {jogo.hora} • {jogo.estadio}
              </div>
            </div>

            {/* Times */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                  <span className="font-medium">{jogo.timeCasa}</span>
                </div>
                <div className="text-sm text-gray-400">Casa</div>
              </div>
              
              <div className="text-center text-gray-500 text-sm">VS</div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                  <span className="font-medium">{jogo.timeFora}</span>
                </div>
                <div className="text-sm text-gray-400">Fora</div>
              </div>
            </div>

            {/* Botão de Ação */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <button className="w-full px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 group-hover:bg-yellow-500/10 group-hover:text-yellow-400 group-hover:border-yellow-500/30 border border-transparent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem quando não há jogos */}
      {jogosFiltrados.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg mb-2">Nenhum jogo agendado</p>
          <p className="text-sm">Use o botão "Gerar Jogos" para criar o calendário</p>
        </div>
      )}

      {/* Informação sobre geração de jogos */}
      <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-yellow-400 mb-1">Sobre a geração de jogos</div>
            <p className="text-sm text-gray-400">
              O sistema garante que todos os times se enfrentem 2 vezes (ida e volta), 
              considerando apenas times da mesma divisão. A tabela 'teams' deve ter a 
              coluna 'divisao' preenchida para funcionar corretamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}