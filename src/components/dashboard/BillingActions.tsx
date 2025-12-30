'use client'

import { Button } from "@/components/ui/button"
import { createCheckoutSession } from "@/app/actions/stripe-checkout"
import { Loader2, CreditCard } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface BillingActionsProps {
    orgId: string
    plan: string
}

export function PayButton({ orgId, plan }: BillingActionsProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handlePayment() {
        try {
            setIsLoading(true)
            await createCheckoutSession(orgId)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao iniciar pagamento. Tente novamente.")
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                </>
            ) : (
                <>
                    Pagar e Ativar <CreditCard className="ml-2 h-4 w-4" />
                </>
            )}
        </Button>
    )
}
