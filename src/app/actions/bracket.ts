'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// Helper to shuffle array
function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

export async function clearCupAction(organizationId: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('organization_id', organizationId)
            .eq('competition', 'Copa')

        if (error) throw error

        revalidatePath('/dashboard/tabela')
        return { success: true, message: 'Copa limpa com sucesso!' }
    } catch (error: any) {
        console.error('Error clearing cup:', error)
        return { success: false, message: 'Erro ao limpar copa: ' + error.message }
    }
}

export async function createCupAction(teamIds: string[], organizationId: string) {
    const supabase = await createClient()

    if (!teamIds || teamIds.length < 2) {
        return { success: false, message: 'Selecione pelo menos 2 times.' }
    }

    try {
        // 1. Limpar copa existente
        await supabase
            .from('matches')
            .delete()
            .eq('organization_id', organizationId)
            .eq('competition', 'Copa')

        // 2. Definir estrutura e Byes
        const shuffledTeams = shuffle([...teamIds])
        const totalTeams = shuffledTeams.length

        let round1Matches = []

        // Lógica para 24 times (8 Byes + 16 jogam)
        if (totalTeams === 24) {
            // 8 Byes (auto-win)
            const byeTeams = shuffledTeams.slice(0, 8)
            const playTeams = shuffledTeams.slice(8) // 16 times

            // Criar matches de Bye (já finalizados)
            for (const teamId of byeTeams) {
                round1Matches.push({
                    organization_id: organizationId,
                    home_team_id: teamId,
                    away_team_id: null, // Bye
                    round: 1,
                    competition: 'Copa',
                    divisao: 'A', // Default
                    status: 'finished',
                    home_score: 1, // Simbólico
                    away_score: 0,
                    date: new Date().toISOString(),
                    time: '19:00'
                })
            }

            // Criar matches jogáveis (8 jogos para 16 times)
            for (let i = 0; i < playTeams.length; i += 2) {
                round1Matches.push({
                    organization_id: organizationId,
                    home_team_id: playTeams[i],
                    away_team_id: playTeams[i + 1],
                    round: 1,
                    competition: 'Copa',
                    divisao: 'A',
                    status: 'scheduled',
                    date: new Date().toISOString(),
                    time: '20:00'
                })
            }
        }
        // Lógica Padrão (2, 4, 8, 16)
        else {
            // Aceita 2, 4, 8, 16 apenas (ou números pares genéricos se quiser arriscar)
            // Vamos assumir pairing simples
            for (let i = 0; i < totalTeams; i += 2) {
                round1Matches.push({
                    organization_id: organizationId,
                    home_team_id: shuffledTeams[i],
                    away_team_id: shuffledTeams[i + 1] || null, // Safety, should be even
                    round: 1,
                    competition: 'Copa',
                    divisao: 'A',
                    status: 'scheduled',
                    date: new Date().toISOString(),
                    time: '20:00'
                })
            }
        }

        // 3. Inserir no banco
        const { error } = await supabase.from('matches').insert(round1Matches)

        if (error) throw error

        revalidatePath('/dashboard/tabela')
        return { success: true, message: 'Copa criada com sucesso!' }

    } catch (error: any) {
        console.error('Error creating cup:', error)
        return { success: false, message: 'Erro ao criar copa: ' + error.message }
    }
}

export async function advanceCupRoundAction(currentRound: number, organizationId: string) {
    const supabase = await createClient()

    try {
        // 1. Buscar jogos da rodada atual
        const { data: matches, error } = await supabase
            .from('matches')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('competition', 'Copa')
            .eq('round', currentRound)
            .order('created_at', { ascending: true }) // Importante manter ordem de criação/bracket

        if (error || !matches || matches.length === 0) {
            return { success: false, message: 'Rodada não encontrada.' }
        }

        // 2. Validar se todos terminaram
        const allFinished = matches.every(m => m.status === 'finished')
        if (!allFinished) {
            return { success: false, message: 'Todos os jogos da rodada atual precisam ser finalizados.' }
        }

        // 3. Determinar vencedores
        const winners = matches.map(m => {
            if (!m.away_team_id) return m.home_team_id // Bye winner
            if ((m.home_score || 0) > (m.away_score || 0)) return m.home_team_id
            if ((m.away_score || 0) > (m.home_score || 0)) return m.away_team_id

            // Empate? Definir critério ou erro
            // Na copa, empate exige pênaltis na vida real. Aqui assumimos que user definiu um vencedor no placar ou criar feature de penaltis depois.
            // Por enquanto, home ganha no empate (fallback ruim, mas evita crash)
            return m.home_team_id
        })

        if (winners.length < 2) {
            return { success: false, message: 'Campeonato finalizado! Temos um campeão.' }
        }

        // 4. Criar próxima rodada
        const nextRoundMatches = []
        for (let i = 0; i < winners.length; i += 2) {
            nextRoundMatches.push({
                organization_id: organizationId,
                home_team_id: winners[i],
                away_team_id: winners[i + 1],
                round: currentRound + 1,
                competition: 'Copa',
                divisao: 'A',
                status: 'scheduled',
                date: new Date().toISOString(),
                time: '20:00'
            })
        }

        const { error: insertError } = await supabase.from('matches').insert(nextRoundMatches)
        if (insertError) throw insertError

        revalidatePath('/dashboard/tabela')
        return { success: true, message: `Fase ${currentRound + 1} gerada com sucesso!` }

    } catch (error: any) {
        console.error('Error advancing round:', error)
        return { success: false, message: 'Erro ao avançar fase: ' + error.message }
    }
}
