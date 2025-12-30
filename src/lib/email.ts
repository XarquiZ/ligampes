import { Resend } from 'resend';
import WelcomeEmail from '@/components/emails/WelcomeEmail';
import { ReactElement } from 'react';
import { render } from '@react-email/components';

export async function sendWelcomeEmail(to: string, userName: string, leagueName: string, plan: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('Resend API Key missing. Skipping email.');
        return { success: false, error: 'MISSING_RESEND_KEY' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const emailHtml = await render(WelcomeEmail({ userName, leagueName, plan }) as ReactElement);

        const { data, error } = await resend.emails.send({
            from: 'LIGA.ON <nao-responda@ligaon.com.br>',
            to: [to],
            subject: 'Bem-vindo ao LIGA.ON: O setup do seu servidor começou ⚙️',
            html: emailHtml,
        });

        if (error) {
            console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
            return { success: false, error };
        }

        console.log('✅ Email sent successfully:', data);
        return { success: true, data };
    } catch (err: any) {
        console.error('Exception sending email:', err);
        return {
            success: false,
            error: { message: err.message, name: err.name, stack: err.stack }
        };
    }
}
