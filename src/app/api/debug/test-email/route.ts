import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to') // ?to=email@example.com

    if (!to) {
        return NextResponse.json({
            error: 'Falta o parâmetro ?to=seuemail@example.com',
            env_check: {
                has_resend_key: !!process.env.RESEND_API_KEY,
                key_prefix: process.env.RESEND_API_KEY?.substring(0, 5) || 'none'
            }
        }, { status: 400 })
    }

    const key = process.env.RESEND_API_KEY
    if (!key) return NextResponse.json({ error: 'CRÍTICO: RESEND_API_KEY não encontrada nas variáveis de ambiente!' }, { status: 500 })

    const resend = new Resend(key)

    try {
        console.log(`[Debug] Enviando para ${to}...`)

        const { data, error } = await resend.emails.send({
            from: 'LIGA.ON <nao-responda@ligaon.com.br>',
            to: [to],
            // react: null, // Send raw html for safety
            subject: 'Teste de Debug LIGA.ON 🔍',
            html: `
                <h1>Teste de Envio</h1>
                <p>Se você está lendo isso, a configuração do Resend está 100% correta!</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            `
        })

        if (error) {
            console.error('[Debug] Erro Resend:', error)
            return NextResponse.json({ success: false, error }, { status: 400 })
        }

        console.log('[Debug] Sucesso:', data)
        return NextResponse.json({ success: true, data })

    } catch (e: any) {
        console.error('[Debug] Exception:', e)
        return NextResponse.json({ success: false, message: e.message, stack: e.stack }, { status: 500 })
    }
}
