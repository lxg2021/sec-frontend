"use client"

import { DacPolicyForm } from "@/components/dac/dac-policy-form"
import type { FilePolicy, RegistryPolicy, ProcessPolicy, NetworkPolicy } from "@/components/dacpolicy"

export default function Home() {
  const handlePolicyGenerate = (policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy) => {
    console.log("[v0] Policy received in parent component:", policy)
    // You can now process the policy data here
    // For example: save to database, send to API, etc.
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <DacPolicyForm onPolicyGenerate={handlePolicyGenerate} />
    </main>
  )
}
