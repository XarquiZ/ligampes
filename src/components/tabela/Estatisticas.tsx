"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Artilharia from "./stats/Artilharia";
import Assistencias from "./stats/Assistencias";
import TimeStats from "./stats/TimeStats";
import PorPosicao from "./stats/PorPosicao"; // NOVO IMPORT

export default function Estatisticas() {
  const [activeTab, setActiveTab] = useState("artilharia");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabConfig = {
    artilharia: { label: "Artilharia" },
    assistencias: { label: "Líder de Assistências" },
    posicao: { label: "Por Posição" },
    times: { label: "Estatísticas dos Times" }
  };

  const ActiveTabLabel = tabConfig[activeTab as keyof typeof tabConfig]?.label;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-yellow-500/20">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4 md:mb-6">Estatísticas</h2>

      {/* Mobile Dropdown Selector */}
      <div className="relative w-full mb-6 md:hidden">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-xl font-bold"
        >
          <span>{ActiveTabLabel}</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {Object.entries(tabConfig).map(([key, config]) => {
                if (key === activeTab) return null;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium"
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Desktop Tabs (Hidden on mobile) */}
      <div className="hidden md:flex space-x-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(tabConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === key
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-900 text-gray-300 hover:bg-gray-700"
              }`}
          >
            {config.label}
          </button>
        ))}
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