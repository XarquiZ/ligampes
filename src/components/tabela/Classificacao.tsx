"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SerieATable from "./tables/SerieATable";
import SerieBTable from "./tables/SerieBTable";

export default function Classificacao() {
  const [activeDivision, setActiveDivision] = useState("serieA");

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-yellow-500/20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">Classificação</h2>
          <p className="text-gray-400 text-sm">
            Ordenação: Pontos → Vitórias → Saldo de Gols → Gols Feitos
          </p>
        </div>

        <Tabs
          value={activeDivision}
          onValueChange={setActiveDivision}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-gray-900">
            <TabsTrigger
              value="serieA"
              className="text-white data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              Série A
            </TabsTrigger>
            <TabsTrigger
              value="serieB"
              className="text-white data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              Série B
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto">
        {activeDivision === "serieA" ? <SerieATable /> : <SerieBTable />}
      </div>
    </div>
  );
}