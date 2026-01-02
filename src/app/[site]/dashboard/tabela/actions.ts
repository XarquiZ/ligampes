'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

interface GenerateMatchesParams {
    organizationId: string
    division: string
    mode: 'ida' | 'ida_volta'
    clearExisting?: boolean
}

export async function generateMatchesAction({ organizationId, division, mode, clearExisting }: GenerateMatchesParams) {
    const supabase = await createClient()

    if (!organizationId) {
        return { success: false, message: 'Organização não identificada.' }
    }

    try {
        // 1. Limpar existentes se solicitado
        if (clearExisting) {
            const { error: deleteError } = await supabase
                .from('matches')
                .delete()
                .eq('organization_id', organizationId)
                .eq('divisao', division)

            if (deleteError) {
                throw new Error('Erro ao limpar partidas existentes: ' + deleteError.message)
            }
        }

        // 2. Buscar times
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('divisao', division)

        if (teamsError || !teams || teams.length < 2) {
            return { success: false, message: 'Número insuficiente de times para gerar partidas (mínimo 2).' }
        }

        const teamIds = teams.map(t => t.id)

        // Algoritmo Round-Robin
        // Se impar, adicionar nulo (bye)
        if (teamIds.length % 2 !== 0) {
            teamIds.push(null) // null indica "folga"
        }

        const numTeams = teamIds.length
        const numRounds = numTeams - 1
        const halfSize = numTeams / 2

        let matchesToInsert: any[] = []

        const teamList = [...teamIds] // Cópia para rotação

        for (let round = 1; round <= numRounds; round++) {
            for (let i = 0; i < halfSize; i++) {
                const teamA = teamList[i]
                const teamB = teamList[numTeams - 1 - i]

                if (teamA && teamB) {
                    // Alternar mando de campo rudimentar para balancear (opcional, aqui faremos fixo ou alternado por rodada)
                    // Uma forma comum é rodada impar: primeiro joga em casa, rodada par: segundo joga em casa
                    // Mas no round robin circular padrão, o mando precisa de uma logica especifica pra ser perfeito.
                    // Vamos simplificar: quem está na primeira metade do array joga em casa, exceto ajuste fino.

                    let home = teamA
                    let away = teamB

                    // Alternância simples baseada na rodada para variar mandos
                    if (round % 2 === 0) {
                        home = teamB
                        away = teamA
                    }

                    // Exceção do pivô (primeiro elemento) para balancear melhor mandos do time fixo
                    // O elemento index 0 nunca roda.
                    if (i === 0 && round % 2 === 0) {
                        // Inverter logica padrao pro pivo
                        home = teamA
                        away = teamB
                    }


                    matchesToInsert.push({
                        date: new Date().toISOString().split('T')[0], // Data placeholder
                        time: '20:00', // Hora placeholder
                        home_team_id: home,
                        away_team_id: away,
                        round: round,
                        divisao: division,
                        status: 'scheduled',
                        organization_id: organizationId,
                        stadium: 'Estádio Virtual Parsec',
                        competition: 'Liga'
                    })
                }
            }

            // Rotacionar array (mantendo o primeiro fixo)
            // [FIXO, b, c, d, e, f] -> [FIXO, f, b, c, d, e]
            const first = teamList[0]
            const last = teamList.pop()
            if (last) teamList.splice(1, 0, last)
        }

        // 4. Se Ida e Volta
        if (mode === 'ida_volta') {
            const returnLegMatches = matchesToInsert.map(m => ({
                ...m,
                round: m.round + numRounds, // Continua contagem
                home_team_id: m.away_team_id, // Inverte mando
                away_team_id: m.home_team_id
            }))
            matchesToInsert = [...matchesToInsert, ...returnLegMatches]
        }

        // 5. Inserir no banco
        // Inserir em lotes se for muito grande, mas pra campeonatos normais < 1000 jogos é ok num batch só geralmente
        const { error: insertError } = await supabase
            .from('matches')
            .insert(matchesToInsert)

        if (insertError) {
            throw new Error('Erro ao inserir partidas: ' + insertError.message)
        }

        revalidatePath(`/dashboard/tabela`) // Revalidate generico, o client side ja cuida de atualizar
        return { success: true, message: `${matchesToInsert.length} partidas geradas com sucesso!` }

    } catch (error: any) {
        console.error('Erro ao gerar partidas:', error)
        return { success: false, message: 'Erro interno: ' + error.message }
    }
}
