"use server"

import { redirect } from "next/navigation"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia", // Use latest or appropriate version
})

export async function createCheckoutSession(orgId: string, plan: string) {
    const supabase = await createClient()

    // 1. Get Organization details
    const { data: org } = await supabase
        .from("organizations")
        .select("id, name, owner_id, email:users(email)") // Assuming relation or direct email is not on org
        .eq("id", orgId)
        .single()

    // Note: If email is not directly on org, we might need to fetch user separately or assume user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("User not authenticated")
    }

    // 2. Define Prices (You should move this to env or DB in production)
    // These are example IDs. You must replace them with your actual Stripe Price IDs.
    const PRICES = {
        mensal: process.env.STRIPE_PRICE_ID_MONTHLY || "price_monthly_placeholder",
        anual: process.env.STRIPE_PRICE_ID_YEARLY || "price_yearly_placeholder",
    }

    const priceId = PRICES[plan as keyof typeof PRICES]

    if (!priceId) {
        throw new Error("Invalid plan selected")
    }

    // 3. Create Session
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        customer_email: user.email,
        metadata: {
            organization_id: orgId,
            plan_choice: plan,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`, // Or stay on the page
    })

    // 4. Return URL (or Redirect)
    if (session.url) {
        redirect(session.url)
    }
}
