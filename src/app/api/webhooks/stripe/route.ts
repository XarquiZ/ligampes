import { headers } from "next/headers"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase-server"
import { Resend } from 'resend'

// Remove top-level initialization to prevent build failures when env vars are missing
// const stripe = new Stripe(...) 

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
    const body = await req.text()
    const sig = (await headers()).get("stripe-signature") as string

    // Initialize Stripe lazily inside the handler
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("Missing STRIPE_SECRET_KEY")
        return new Response("Server Configuration Error: Missing Stripe Key", { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia" as any,
    })

    let event: Stripe.Event

    try {
        if (!endpointSecret) throw new Error("Missing Stripe Webhook Secret")
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabase = await createAdminClient()

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.organization_id

        if (orgId) {
            console.log(`[Stripe Webhook] Activating Organization: ${orgId}`)

            // Activate Organization
            const { error } = await supabase
                .from("organizations")
                .update({
                    status: "active",
                    // subscription_id: session.subscription // Warning: Ensure this column exists. If not, maybe store in settings?
                    // Safe approach if column might be missing: 
                    subscription_id: session.subscription as string
                })
                .eq("id", orgId)

            if (error) {
                console.error(`[Stripe Webhook] Failed to activate org: ${error.message}`)
            } else {
                // Optional: Send Confirmation Email
                // ...
            }
        }
    }

    return new Response(null, { status: 200 })
}
