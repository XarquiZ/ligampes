"use client";

import { useState } from "react";

export default function GerarJogosButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMatches = async () => {
    setIsGenerating(true);
    // Aqui você implementaria a chamada para sua API
    try {
      const response = await fetch("/api/generate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        alert("Jogos gerados com sucesso!");
      } else {
        throw new Error("Erro ao gerar jogos");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao gerar jogos");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerateMatches}
      disabled={isGenerating}
      className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isGenerating ? (
        <>
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          Gerando...
        </>
      ) : (
        "Gerar Jogos"
      )}
    </button>
  );
}