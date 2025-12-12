"use client";

import { useState } from "react";
import JogosPassados from "./agenda/JogosPassados";
import ProximosJogos from "./agenda/ProximosJogos";
import GerarJogosButton from "./agenda/GerarJogosButton";

export default function Agenda() {
  const [activeView, setActiveView] = useState("proximos");

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-yellow-400">Agenda</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setActiveView("proximos")}
              className={`px-4 py-2 rounded transition-colors ${
                activeView === "proximos"
                  ? "bg-yellow-500 text-black font-semibold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Próximos Jogos
            </button>
            <button
              onClick={() => setActiveView("passados")}
              className={`px-4 py-2 rounded transition-colors ${
                activeView === "passados"
                  ? "bg-yellow-500 text-black font-semibold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Resultados
            </button>
          </div>
          
          <GerarJogosButton />
        </div>
      </div>

      <div className="mt-6">
        {activeView === "proximos" ? <ProximosJogos /> : <JogosPassados />}
      </div>
    </div>
  );
}