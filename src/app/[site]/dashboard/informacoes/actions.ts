'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateOrganizationRules(organizationId: string, rules: any[]) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('organizations')
            .update({ rules: rules })
            .eq('id', organizationId)

        if (error) {
            console.error('Erro ao atualizar regras:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[site]/dashboard/informacoes', 'page')
        return { success: true }
    } catch (error) {
        console.error('Erro inesperado ao atualizar regras:', error)
        return { success: false, error: 'Erro inesperado' }
    }
}
