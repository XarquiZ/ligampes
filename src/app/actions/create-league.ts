'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
    leagueName: z.string().min(3, "O nome da liga deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "O endereço deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Slug inválido. Use apenas letras minúsculas, números e hífens."),
    gameType: z.enum(['EAFC', 'PES', 'NBA', 'REAL_SPORTS']),
    plan: z.enum(['free', 'mensal', 'anual']).default('free'),
})

const RESERVED_SLUGS = [
    'login', 'criar', 'acompanhar', 'sucesso', 'admin', 'api', '_next', 'static', 'dashboard', 'settings', 'config', 'public', 'assets'
]

export async function createLeagueAction(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const data = {
        leagueName: formData.get('leagueName'),
        slug: formData.get('slug'),
        gameType: formData.get('gameType'),
        plan: formData.get('plan'),
    }

    const validatedFields = schema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Erro na validação dos campos.',
        }
    }

    const { leagueName, slug, gameType, plan } = validatedFields.data

    if (RESERVED_SLUGS.includes(slug)) {
        return {
            message: "Este endereço é reservado pelo sistema. Por favor, escolha outro."
        }
    }

    // Check if user is logged in
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
        return {
            message: "Você precisa fazer login para criar uma liga."
        }
    }

    const userId = currentUser.id
    const userEmail = currentUser.email

    // 2. Create Organization with Free Plan Limits and Game Type
    // use createAdminClient to bypass RLS since the user is just created and might not have a session in this context yet
    const { createAdminClient } = await import('@/lib/supabase-server')
    const adminSupabase = await createAdminClient()

    // Determine Price ID if paid plan
    let priceId = null
    if (plan === 'mensal') priceId = process.env.STRIPE_PRICE_ID_MONTHLY
    if (plan === 'anual') priceId = process.env.STRIPE_PRICE_ID_YEARLY

    const { error: orgError } = await adminSupabase.from('organizations').insert({
        name: leagueName,
        slug: slug,
        owner_id: userId,
        plan: plan,
        chosen_plan: plan,
        price_id: priceId,
        status: plan === 'free' ? 'pending_setup' : 'payment_required',
        settings: {
            max_teams: 8,
            game_type: gameType
        }
    })

    if (orgError) {
        console.error("Erro ao criar organização:", orgError)
        return {
            message: 'Erro ao criar a liga. Tente outro nome ou slug.'
        }
    }

    // 3. Send Confirmation Email
    if (userEmail) {
        try {
            const { sendWelcomeEmail } = await import('@/lib/email')
            // Using "Gestor" as fallback name since we might not have full name yet
            await sendWelcomeEmail(userEmail, "Gestor", String(leagueName), String(plan))
        } catch (emailError) {
            console.error("Erro ao enviar email (Exception):", emailError)
        }
    }

    redirect('/acompanhar')
}


