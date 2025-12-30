'use server'

import { redirect } from "next/navigation"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: "2024-12-18.acacia" as any,
})

export async function createCheckoutSession(organizationId: string) {
    const supabase = await createClient()

    // 1. Get Organization details
    const { data: org, error } = await supabase
        .from("organizations")
        .select("id, name, plan, price_id, owner_id")
        .eq("id", organizationId)
        .single()

    if (error || !org) {
        throw new Error("Organização não encontrada.")
    }

    // 2. Validate Plan
    if (org.plan === 'free') {
        throw new Error("Planos gratuitos não precisam de checkout.")
    }

    if (!org.price_id) {
        // Fallback or Error if price_id missing
        throw new Error("Configuração de preço inválida para este plano.")
    }

    // 3. Get User Email (owner)
    // Needs access to user email. If the current user is owner, use auth.getUser().
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado.")

    // 4. Create Session
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: org.price_id,
                quantity: 1,
            },
        ],
        customer_email: user.email,
        metadata: {
            organization_id: organizationId,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?canceled=true`,
    })

    if (session.url) {
        redirect(session.url)
    }
}
