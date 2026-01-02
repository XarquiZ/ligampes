'use server'

import { createClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import PaymentReadyEmail from '@/components/emails/PaymentReadyEmail'
import LeagueActiveEmail from '@/components/emails/LeagueActiveEmail'
import { ReactElement } from 'react'
import { render } from '@react-email/components'
import { revalidatePath } from 'next/cache'

export async function approveLeagueAction(orgId: string, plan: string, userEmail: string, userName: string, leagueName: string, leagueSlug: string) {
    const supabase = await createClient()

    // 1. Verify Admin (Simple email check for now - REPLACE WITH YOUR REAL EMAIL)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autorizado.' }

    // 🔒 Security Check
    if (user.email !== 'wellinton.sbatista@gmail.com') return { success: false, message: 'Acesso negado. Apenas Super Admin.' }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        let emailHtml = ''
        let subject = ''
        let newStatus = ''

        // 2. Determine Logic based on Plan
        if (plan === 'free') {
            newStatus = 'active'
            subject = `⚽ Apito Inicial! A ${leagueName} está no ar.`

            const leagueUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${leagueSlug}`
            const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${leagueSlug}/login`

            emailHtml = await render(LeagueActiveEmail({
                userName,
                leagueName,
                leagueUrl,
                loginUrl
            }) as ReactElement)

        } else {
            // Paid plans (mensal/anual)
            newStatus = 'payment_required'
            subject = `🔓 A infraestrutura da ${leagueName} está pronta! (Libere o acesso)`

            // Link directly to payment or dashboard where payment button exists
            // Since status becomes 'payment_required', accessing /acompanhar will show the button
            const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/acompanhar`

            emailHtml = await render(PaymentReadyEmail({
                userName,
                leagueName,
                planName: plan === 'mensal' ? 'Pro Mensal' : 'Pro Anual',
                checkoutUrl
            }) as ReactElement)
        }

        // 3. Update Database
        const { error: dbError } = await supabase
            .from('organizations')
            .update({ status: newStatus })
            .eq('id', orgId)

        if (dbError) throw new Error(`Erro no banco: ${dbError.message}`)

        // 4. Send Email
        const { error: emailError } = await resend.emails.send({
            from: 'LIGA.ON <nao-responda@ligaon.com.br>',
            to: [userEmail],
            subject: subject,
            html: emailHtml
        })

        if (emailError) throw new Error(`Erro no email: ${emailError.message}`)

        revalidatePath('/admin')
        return { success: true, message: `Liga ${leagueName} aprovada com sucesso! (${newStatus})` }

    } catch (error: any) {
        console.error('Admin Action Error:', error)
        return { success: false, message: error.message }
    }
}
