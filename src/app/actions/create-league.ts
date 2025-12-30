'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
    leagueName: z.string().min(3, "O nome da liga deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "O endereço deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Slug inválido. Use apenas letras minúsculas, números e hífens."),
    gameType: z.enum(['EAFC', 'PES', 'NBA', 'REAL_SPORTS'], { errorMap: () => ({ message: "Selecione o tipo de jogo." }) }),
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

    const { error: orgError } = await adminSupabase.from('organizations').insert({
        name: leagueName,
        slug: slug,
        owner_id: userId,
        plan: plan,
        chosen_plan: plan,
        status: 'pending_setup', // Alterado para fluxo de aprovação/setup
        settings: {
            max_teams: 8,
            game_type: gameType // Saving game type
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
            const apiKey = process.env.RESEND_API_KEY
            console.log('[CreateLeague] Resend API Key presente:', !!apiKey)

            if (!apiKey) {
                console.error('[CreateLeague] ERRO: RESEND_API_KEY não configurada no .env')
            } else {
                const { Resend } = await import('resend')
                const resend = new Resend(apiKey)

                // Use configured domain or default Resend test domain
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

                const { data, error } = await resend.emails.send({
                    from: `Liga.On <${fromEmail}>`,
                    to: userEmail,
                    subject: `Bem-vindo ao Liga.On! Sua liga ${leagueName} foi criada.`,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h1>Sua liga está pronta! 🚀</h1>
                            <p>Olá,</p>
                            <p>A liga <strong>${leagueName}</strong> foi cadastrada e está aguardando ativação.</p>
                            <p>Status atual: <strong>Pendente de Configuração</strong></p>
                            <br />
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/acompanhar" style="background: #eab308; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                Acompanhar Solicitação
                            </a>
                        </div>
                    `
                })

                if (error) {
                    console.error('[CreateLeague] Erro retornado pelo Resend:', error)
                } else {
                    console.log('[CreateLeague] Email enviado com sucesso:', data)
                }
            }
        } catch (emailError) {
            console.error("Erro ao enviar email (Exception):", emailError)
            // Don't fail the creation if email fails
        }
    }

    redirect('/acompanhar')
}


