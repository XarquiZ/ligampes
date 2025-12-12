import Image from "next/image";

interface TeamRowProps {
  team: {
    id: string;
    name: string;
    position: number;
    pontos: number;
    jogos: number;
    vitorias: number;
    empates: number;
    derrotas: number;
    golsMarcados: number;
    golsSofridos: number;
    saldo: number;
    ultimosJogos: string[];
    logo_url: string | null;
    divisao?: string | null; // Adicionado para identificar a divisão
  };
  totalTeams?: number;
}

export default function TeamRow({ team, totalTeams = 20 }: TeamRowProps) {
  const getFormColor = (result: string) => {
    switch (result) {
      case "win": return "bg-green-500";
      case "draw": return "bg-gray-500";
      case "loss": return "bg-red-500";
      default: return "bg-gray-700";
    }
  };

  // Determina a cor da posição baseada na classificação e divisão
  const getPositionColor = () => {
    const divisao = team.divisao || 'A'; // Default para Série A se não especificado
    
    if (divisao === 'A') {
      // REGRAS PARA SÉRIE A
      // Libertadores: posições 1-6
      if (team.position <= 4) {
        return "bg-green-500/20 text-green-400";
      }
      // Sul-Americana: posições 7-12
      if (team.position >= 5 && team.position <= 9) {
        return "bg-blue-500/20 text-blue-400";
      }
      // Zona de rebaixamento: últimos 4 times
      if (team.position >= totalTeams - 3) {
        return "bg-red-500/20 text-red-400";
      }
    } else if (divisao === 'B') {
      // REGRAS PARA SÉRIE B
      // Promoção direta para Série A: posições 1-4
      if (team.position <= 3) {
        return "bg-green-500/20 text-green-400";
      }
      // Playoff de promoção: posições 5-8
      if (team.position >= 4 && team.position <= 7) {
        return "bg-orange-500/20 text-orange-400";
      }
        // Playoff de promoção: posições 5-8
        if (team.position >= 8 && team.position <= 14) {
            return "bg-blue-500/20 text-blue-400";
          }
      // Rebaixamento para Série C: últimos 4 times
      if (team.position >= totalTeams - 3) {
        return "bg-red-500/20 text-red-400";
      }
    }
    
    // Meio da tabela (para ambas as divisões)
    return "bg-gray-800 text-gray-300";
  };

  return (
    <tr className="hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 last:border-b-0">
      {/* Posição */}
      <td className="py-4 px-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPositionColor()}`}>
          {team.position}
        </div>
      </td>
      
      {/* Nome do Time */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {/* Logo do time */}
          {team.logo_url ? (
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src={team.logo_url}
                alt={`Logo do ${team.name}`}
                fill
                className="object-contain"
                sizes="32px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            // Placeholder se não houver logo
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-300">{team.name.charAt(0)}</span>
            </div>
          )}
          <span className="font-medium text-white">{team.name}</span>
        </div>
      </td>
      
      {/* Pontos */}
      <td className="py-4 px-4 font-bold text-yellow-400">{team.pontos}</td>
      
      {/* Jogos */}
      <td className="py-4 px-4 text-white">{team.jogos}</td>
      
      {/* Vitórias */}
      <td className="py-4 px-4 text-green-400">{team.vitorias}</td>
      
      {/* Empates */}
      <td className="py-4 px-4 text-yellow-400">{team.empates}</td>
      
      {/* Derrotas */}
      <td className="py-4 px-4 text-red-400">{team.derrotas}</td>
      
      {/* Gols Marcados */}
      <td className="py-4 px-4 text-white">{team.golsMarcados}</td>
      
      {/* Gols Sofridos */}
      <td className="py-4 px-4 text-white">{team.golsSofridos}</td>
      
      {/* Saldo de Gols */}
      <td className={`py-4 px-4 font-medium ${
        team.saldo > 0 ? "text-green-400" : team.saldo < 0 ? "text-red-400" : "text-gray-300"
      }`}>
        {team.saldo > 0 ? "+" : ""}{team.saldo}
      </td>
      
      {/* Últimos 5 jogos */}
      <td className="py-4 px-4">
        <div className="flex gap-1">
          {team.ultimosJogos.map((result, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${getFormColor(result)}`}
              title={result === "win" ? "Vitória" : result === "draw" ? "Empate" : "Derrota"}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}