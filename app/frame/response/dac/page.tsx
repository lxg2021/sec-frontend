"use client"

import { useState } from "react"
import { DacPolicyForm } from "@/features/dac/components/dac-policy-form"
import { DacReviewCard } from "@/features/dac/components/dac-review-card"
import type { FilePolicy, RegistryPolicy, ProcessPolicy, NetworkPolicy } from "@/features/dac/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card"


type PolicyWithMetadata = {
  id: string
  policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy
  status: "not_deployed" | "deploying" | "deployed" | "failed"
  createdAt: Date
}

export default function Home() {
  const [policies, setPolicies] = useState<PolicyWithMetadata[]>([])

  const handlePolicyGenerate = (policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy) => {
    console.log("Policy received in parent component:", policy)

    const newPolicy: PolicyWithMetadata = {
      id: crypto.randomUUID(),
      policy,
      status: "not_deployed",
      createdAt: new Date(),
    }

    setPolicies((prev) => [newPolicy, ...prev])
  }

  const handleEdit = (id: string, policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy) => {
    console.log("Edit policy:", id, policy)
    // TODO: Implement edit functionality - could open form with pre-filled data
  }

  const handleDelete = (id: string) => {
    console.log("Delete policy:", id)
    setPolicies((prev) => prev.filter((p) => p.id !== id))
  }

  const handleDeploy = (id: string) => {
    console.log("Deploy policy:", id)

    // Update status to deploying
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, status: "deploying" as const } : p)))

    // Simulate deployment process
    setTimeout(() => {
      setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, status: "deployed" as const } : p)))
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">

        <DacPolicyForm onPolicyGenerate={handlePolicyGenerate} />

      </div>
    </div>
  )
}
