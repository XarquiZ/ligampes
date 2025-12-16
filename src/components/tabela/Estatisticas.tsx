"use client";

import { useState } from "react";
import Artilharia from "./stats/Artilharia";
import Assistencias from "./stats/Assistencias";
import TimeStats from "./stats/TimeStats";
import PorPosicao from "./stats/PorPosicao"; // NOVO IMPORT

export default function Estatisticas() {
  const [activeTab, setActiveTab] = useState("artilharia");

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">Estatísticas</h2>
      
      <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("artilharia")}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "artilharia"
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-900 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Artilharia
        </button>
        <button
          onClick={() => setActiveTab("assistencias")}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "assistencias"
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-900 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Líder de Assistências
        </button>
                <button
          onClick={() => setActiveTab("posicao")}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "posicao"
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-900 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Por Posição
        </button>
        <button
          onClick={() => setActiveTab("times")}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "times"
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-900 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Estatísticas dos Times
        </button>

      </div>

      <div className="mt-6">
        {activeTab === "artilharia" && <Artilharia />}
        {activeTab === "assistencias" && <Assistencias />}
        {activeTab === "posicao" && <PorPosicao />}
        {activeTab === "times" && <TimeStats />}
        
      </div>
    </div>
  );
}