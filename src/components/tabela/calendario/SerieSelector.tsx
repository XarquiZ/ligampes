"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SerieSelectorProps {
  serie: 'A' | 'B';
  setSerie: (serie: 'A' | 'B') => void;
}

export default function SerieSelector({ serie, setSerie }: SerieSelectorProps) {
  return (
    <div className="flex space-x-2">
      <Button
        variant={serie === 'A' ? "default" : "outline"}
        onClick={() => setSerie('A')}
        className={cn(
          "transition-all duration-200",
          serie === 'A' 
            ? "bg-gradient-to-r from-yellow-600 to-yellow-700 border-yellow-600 text-white" 
            : "border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400"
        )}
      >
        Série A
      </Button>
      <Button
        variant={serie === 'B' ? "default" : "outline"}
        onClick={() => setSerie('B')}
        className={cn(
          "transition-all duration-200",
          serie === 'B' 
            ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white" 
            : "border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400"
        )}
      >
        Série B
      </Button>
    </div>
  );
}