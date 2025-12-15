export interface Jogo {
    id: string;
    data: string;
    hora: string;
    time_casa_id: string;
    time_fora_id: string;
    rodada: number;
    serie: 'A' | 'B';
    status: 'agendado' | 'em_andamento' | 'finalizado';
    placar_casa?: number;
    placar_fora?: number;
    time_casa: {
      id: string;
      name: string;
      logo_url?: string;
    };
    time_fora: {
      id: string;
      name: string;
      logo_url?: string;
    };
  }
  
  export interface Campeonato {
    id: string;
    nome: string;
    serie: 'A' | 'B';
    total_rodadas: number;
    temporada: string;
  }