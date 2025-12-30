import { Resend } from 'resend';
import WelcomeEmail from '@/components/emails/WelcomeEmail';
import { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, userName: string, leagueName: string, plan: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('Resend API Key missing. Skipping email.');
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'LIGA.ON <onboarding@resend.dev>',
            to: [to],
            // Log for debug
            // react: WelcomeEmail({ userName, leagueName, plan }) as ReactElement,

            subject: 'Bem-vindo ao LIGA.ON: O setup do seu servidor começou ⚙️',
            react: WelcomeEmail({ userName, leagueName, plan }) as ReactElement,
        });

        if (error) {
            console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
            return { success: false, error };
        }

        console.log('✅ Email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending email:', err);
        return { success: false, error: err };
    }
}
