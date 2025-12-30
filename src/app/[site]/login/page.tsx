import { createClient } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import { CentralLoginClient } from "./client"

export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ site: string }>
}) {
  const { site } = await params
  const supabase = await createClient()

  // 1. Fetch Organization Details
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", site)
    .single()

  if (error || !org) {
    return notFound()
  }

  return <CentralLoginClient organization={org} />
}