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
    divisao?: string | null;
  };
  totalTeams?: number;
}

export default function TeamRow({ team, totalTeams = 20 }: TeamRowProps) {
  
  // Lógica das bolinhas de últimos jogos (W/D/L)
  const getFormStyles = (result: string) => {
    const r = result ? result.toUpperCase() : '';

    if (r === 'V' || r === 'WIN' || r === 'W') {
      return { bg: "bg-green-500", letter: "W", title: "Vitória" };
    } 
    if (r === 'E' || r === 'DRAW') {
      return { bg: "bg-gray-500", letter: "D", title: "Empate" };
    } 
    if (r === 'D' || r === 'LOSS' || r === 'L') {
      return { bg: "bg-red-500", letter: "L", title: "Derrota" };
    }
    return { bg: "bg-gray-700", letter: "-", title: "N/A" };
  };

  // Lógica de cores da posição (Classificação)
  const getPositionColor = () => {
    const divisao = team.divisao || 'A'; 
    
    if (divisao === 'A') {
      // SÉRIE A (Exemplo padrão)
      if (team.position <= 4) return "bg-green-500/20 text-green-400"; // G4
      if (team.position >= 5 && team.position <= 9) return "bg-blue-500/20 text-blue-400"; // Sul-Americana
      if (team.position >= totalTeams - 3) return "bg-red-500/20 text-red-400"; // Z4
    } else if (divisao === 'B') {
      // SÉRIE B (Regras Customizadas)
      
      // 1º ao 3º -> Verde
      if (team.position <= 3) {
        return "bg-green-500/20 text-green-400";
      }
      
      // 4º ao 7º -> Laranja
      if (team.position >= 4 && team.position <= 7) {
        return "bg-orange-500/20 text-orange-400";
      }

      // 8º ao 14º -> Azul
      if (team.position >= 8 && team.position <= 14) {
        return "bg-blue-500/20 text-blue-400";
      }
      
      // Resto (incluindo Z4/Rebaixamento) -> Vermelho
      // Assumindo que "o resto" inclui o Z4, ou seja, do 15 para baixo.
      // Se quiser que apenas o Z4 seja vermelho e o meio (15-16) seja cinza, ajuste aqui.
      // Pelo pedido "o resto vermelho mesmo", vou colocar vermelho para tudo > 14.
      if (team.position > 14) {
        return "bg-red-500/20 text-red-400";
      }
    }
    
    // Fallback (Meio de tabela neutro)
    return "bg-gray-800 text-gray-300";
  };

  return (
    <tr className="hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 last:border-b-0">
      {/* Posição */}
      <td className="py-4 px-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getPositionColor()}`}>
          {team.position}
        </div>
      </td>
      
      {/* Nome do Time */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {team.logo_url ? (
            <div className="relative w-8 h-8 flex-shrink-0">
              <img
                src={team.logo_url}
                alt={`Logo ${team.name}`}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-300">{team.name.substring(0,2).toUpperCase()}</span>
            </div>
          )}
          <span className="font-medium text-white">{team.name}</span>
        </div>
      </td>
      
      {/* Pontos */}
      <td className="py-4 px-4 font-bold text-yellow-400 text-lg">{team.pontos}</td>
      
      {/* Jogos */}
      <td className="py-4 px-4 text-white text-center">{team.jogos}</td>
      
      {/* Vitórias */}
      <td className="py-4 px-4 text-green-400 text-center">{team.vitorias}</td>
      
      {/* Empates */}
      <td className="py-4 px-4 text-gray-400 text-center">{team.empates}</td>
      
      {/* Derrotas */}
      <td className="py-4 px-4 text-red-400 text-center">{team.derrotas}</td>
      
      {/* Gols */}
      <td className="py-4 px-4 text-gray-300 text-center hidden md:table-cell">{team.golsMarcados}</td>
      <td className="py-4 px-4 text-gray-300 text-center hidden md:table-cell">{team.golsSofridos}</td>
      
      {/* Saldo */}
      <td className={`py-4 px-4 font-medium text-center ${
        team.saldo > 0 ? "text-green-400" : team.saldo < 0 ? "text-red-400" : "text-gray-300"
      }`}>
        {team.saldo > 0 ? "+" : ""}{team.saldo}
      </td>
      
      {/* Últimos 5 jogos */}
      <td className="py-4 px-4">
        <div className="flex gap-1.5 justify-center md:justify-start">
          {team.ultimosJogos && team.ultimosJogos.length > 0 ? (
            team.ultimosJogos.slice(0, 5).map((result, index) => {
              const style = getFormStyles(result);
              return (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full ${style.bg} flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-white/10`}
                  title={style.title}
                >
                  {style.letter}
                </div>
              );
            })
          ) : (
            <span className="text-gray-600">-</span>
          )}
        </div>
      </td>
    </tr>
  );
}