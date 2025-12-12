"use client";

import { useState } from "react";

interface JogoPassado {
  id: number;
  data: Date;
  rodada: number;
  timeCasa: string;
  timeFora: string;
  placarCasa: number;
  placarFora: number;
  golsCasa: string[];
  golsFora: string[];
  estadio: string;
  finalizado: boolean;
}

export default function JogosPassados() {
  const [rodadaAtiva, setRodadaAtiva] = useState(1);
  
  const jogosPassados: JogoPassado[] = [
    {
      id: 1,
      data: new Date(2024, 2, 15),
      rodada: 1,
      timeCasa: "Time A",
      timeFora: "Time B",
      placarCasa: 2,
      placarFora: 1,
      golsCasa: ["João Silva", "Carlos Santos"],
      golsFora: ["Miguel Oliveira"],
      estadio: "Estádio Central",
      finalizado: true
    },
    // ... mais jogos
  ];

  const rodadas = [1, 2, 3, 4, 5];

  return (
    <div className="bg-gray-900/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-yellow-400">Resultados dos Jogos</h3>
        <div className="text-sm text-gray-400">Somente administradores podem editar</div>
      </div>

      {/* Seletor de Rodada */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {rodadas.map((rodada) => (
            <button
              key={rodada}
              onClick={() => setRodadaAtiva(rodada)}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                rodadaAtiva === rodada
                  ? "bg-yellow-500 text-black font-semibold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Rodada {rodada}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Jogos */}
      <div className="space-y-4">
        {jogosPassados
          .filter(jogo => jogo.rodada === rodadaAtiva)
          .map((jogo) => (
            <div 
              key={jogo.id} 
              className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/50 transition-colors"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Cabeçalho do Jogo */}
                <div className="text-center md:text-left">
                  <div className="text-sm text-gray-400 mb-1">
                    {jogo.data.toLocaleDateString('pt-BR')} • {jogo.estadio}
                  </div>
                  <div className="text-sm text-yellow-400 font-semibold">
                    Rodada {jogo.rodada}
                  </div>
                </div>

                {/* Times e Placar */}
                <div className="flex items-center justify-between w-full md:w-auto">
                  <div className="flex-1 text-right">
                    <div className="font-bold">{jogo.timeCasa}</div>
                    <div className="text-sm text-gray-400">Casa</div>
                  </div>
                  
                  <div className="mx-6">
                    <div className="text-3xl font-bold">
                      <span className="text-white">{jogo.placarCasa}</span>
                      <span className="mx-2 text-gray-500">-</span>
                      <span className="text-white">{jogo.placarFora}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">FINAL</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold">{jogo.timeFora}</div>
                    <div className="text-sm text-gray-400">Fora</div>
                  </div>
                </div>

                {/* Botão de Edição (Admin) */}
                <button className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Estatísticas
                </button>
              </div>

              {/* Detalhes dos Gols */}
              {(jogo.golsCasa.length > 0 || jogo.golsFora.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Gols (Casa)</div>
                      <div className="space-y-1">
                        {jogo.golsCasa.map((gol, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{gol}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Gols (Fora)</div>
                      <div className="space-y-1">
                        {jogo.golsFora.map((gol, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{gol}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Mensagem quando não há jogos */}
      {jogosPassados.filter(jogo => jogo.rodada === rodadaAtiva).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p>Nenhum jogo encontrado para a rodada {rodadaAtiva}</p>
        </div>
      )}
    </div>
  );
}