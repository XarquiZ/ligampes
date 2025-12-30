'use client'

import React from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ProductShowcase } from '@/components/landing/ProductShowcase'
import { BentoGrid } from '@/components/landing/BentoGrid'
import { WaitTimeExplanation } from '@/components/landing/WaitTimeExplanation'
import { PricingFAQ } from '@/components/landing/PricingFAQ'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { ComparisonSection } from '@/components/landing/ComparisonSection'

export default function LandingPage() {

  // Safety net for Supabase misconfiguration (redirecting to root instead of callback)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        console.log('[Landing] Auth code detected, redirecting to callback...')
        window.location.href = `/api/auth/callback${window.location.search}`
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-green-500/30 font-sans scroll-smooth">
      <LandingHeader />

      <main>
        <Hero />
        <HowItWorks />
        <ProductShowcase />
        <BentoGrid />
        <WaitTimeExplanation />
        <ComparisonSection />
        <PricingFAQ />
      </main>

      <LandingFooter />
    </div>
  )
}
