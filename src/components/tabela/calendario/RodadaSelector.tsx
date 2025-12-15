"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RodadaSelectorProps {
  rodada: number;
  setRodada: (rodada: number) => void;
  rodadasDisponiveis: number[];
  maxRodadas: number;
}

export default function RodadaSelector({
  rodada,
  setRodada,
  rodadasDisponiveis,
  maxRodadas,
}: RodadaSelectorProps) {
  const handlePrevious = () => {
    if (rodada > 1) {
      setRodada(rodada - 1);
    }
  };

  const handleNext = () => {
    if (rodada < maxRodadas) {
      setRodada(rodada + 1);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={rodada <= 1}
        className="border-zinc-600 text-zinc-400 hover:text-white disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="w-32">
        <Select value={rodada.toString()} onValueChange={(value) => setRodada(parseInt(value))}>
          <SelectTrigger className="border-zinc-600 bg-zinc-900 text-white">
            <SelectValue>Rodada {rodada}</SelectValue>
          </SelectTrigger>
          <SelectContent className="border-zinc-600 bg-zinc-900">
            {rodadasDisponiveis.map((r) => (
              <SelectItem 
                key={r} 
                value={r.toString()}
                className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
              >
                Rodada {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={rodada >= maxRodadas}
        className="border-zinc-600 text-zinc-400 hover:text-white disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}