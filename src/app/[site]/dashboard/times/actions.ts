'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createTeamAction(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const logo_url = formData.get('logo_url') as string
    const balance = formData.get('balance') as string
    const divisao = formData.get('divisao') as string
    const organization_id = formData.get('organization_id') as string
    const site = formData.get('site') as string

    if (!name || !organization_id) {
        return { success: false, message: 'Nome e Organização são obrigatórios.' }
    }

    try {
        // Parse balance (remove currency formatting if needed)
        // input might be "R$ 150.000.000,00" -> Digits 15000000000 -> /100 -> 150000000
        const cleanBalance = balance ? (parseFloat(balance.replace(/[^\d]/g, '')) / 100) : 150000000

        const { data, error } = await supabase
            .from('teams')
            .insert({
                name,
                logo_url: logo_url || null,
                balance: cleanBalance, // DB default is 150M
                divisao,
                organization_id
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                return { success: false, message: 'Já existe um time com este nome nesta liga.' }
            }
            throw error
        }

        // Vincular Dono (se selecionado)
        const owner_id = formData.get('owner_id') as string
        if (owner_id && data) {
            // Atualiza o perfil do usuário para pertencer a este time
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ team_id: data.id })
                .eq('id', owner_id)
                .eq('organization_id', organization_id) // Segurança extra

            if (profileError) {
                console.error('Error linking owner:', profileError)
                // Não falha a criação do time, mas avisa
                return { success: true, message: 'Time criado, mas erro ao vincular dono: ' + profileError.message }
            }
        }

        revalidatePath(`/${site}/dashboard/times`)
        return { success: true, message: 'Time criado com sucesso!' }

    } catch (error: any) {
        console.error('Error creating team:', error)
        return { success: false, message: 'Erro ao criar time: ' + error.message }
    }
}

export async function updateTeamAction(formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const logo_url = formData.get('logo_url') as string
    const balance = formData.get('balance') as string
    const divisao = formData.get('divisao') as string
    const organization_id = formData.get('organization_id') as string
    const site = formData.get('site') as string
    const owner_id = formData.get('owner_id') as string

    if (!id || !name) {
        return { success: false, message: 'ID e Nome são obrigatórios.' }
    }

    try {
        const cleanBalance = balance ? (parseFloat(balance.replace(/[^\d]/g, '')) / 100) : 0

        const { error } = await supabase
            .from('teams')
            .update({
                name,
                logo_url: logo_url || null,
                balance: cleanBalance,
                divisao
            })
            .eq('id', id)

        if (error) {
            if (error.code === '23505') {
                return { success: false, message: 'Já existe um time com este nome nesta liga.' }
            }
            throw error
        }

        // Link Owner if selected
        if (owner_id && owner_id !== 'none') {
            await supabase
                .from('profiles')
                .update({ team_id: id })
                .eq('id', owner_id)
                .eq('organization_id', organization_id)
        }

        revalidatePath(`/${site}/dashboard/times`)
        return { success: true, message: 'Time atualizado com sucesso!' }
    } catch (error: any) {
        console.error('Error updating team:', error)
        return { success: false, message: 'Erro ao atualizar time: ' + error.message }
    }
}

export async function deleteTeamAction(teamId: string, organizationId: string, site: string) {
    const supabase = await createClient()

    if (!teamId || !organizationId) {
        return { success: false, message: 'ID do time ou organização inválidos.' }
    }

    try {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId)
            .eq('organization_id', organizationId)

        if (error) throw error

        revalidatePath(`/${site}/dashboard/times`)
        return { success: true, message: 'Time excluído com sucesso!' }
    } catch (error: any) {
        console.error('Error deleting team:', error)
        return { success: false, message: 'Erro ao excluir time: ' + error.message }
    }
}
