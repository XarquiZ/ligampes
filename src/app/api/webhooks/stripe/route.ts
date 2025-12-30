import { headers } from "next/headers"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
    const body = await req.text()
    const sig = (await headers()).get("stripe-signature") as string

    let event: Stripe.Event

    try {
        if (!endpointSecret) throw new Error("Missing Stripe Webhook Secret")
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: any) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabase = await createAdminClient()

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.organization_id

        if (orgId) {
            // Unlock the organization
            await supabase
                .from("organizations")
                .update({
                    status: "active",
                    // Optionally store subscription ID: subscription_id: session.subscription
                })
                .eq("id", orgId)
        }
    }

    return new Response(null, { status: 200 })
}
