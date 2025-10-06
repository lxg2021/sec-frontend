"use client"

import { useState } from "react"
import { DacPolicyForm } from "@/components/dac/dac-policy-form"
import { DacReviewCard } from "@/components/dac/DacReviewCard"
import type { FilePolicy, RegistryPolicy, ProcessPolicy, NetworkPolicy } from "@/components/dac/dacpolicy"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"


type PolicyWithMetadata = {
  id: string
  policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy
  status: "not_deployed" | "deploying" | "deployed" | "failed"
  createdAt: Date
}

export default function Home() {
  const [policies, setPolicies] = useState<PolicyWithMetadata[]>([])

  const handlePolicyGenerate = (policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy) => {
    console.log("[v0] Policy received in parent component:", policy)

    const newPolicy: PolicyWithMetadata = {
      id: crypto.randomUUID(),
      policy,
      status: "not_deployed",
      createdAt: new Date(),
    }

    setPolicies((prev) => [newPolicy, ...prev])
  }

  const handleEdit = (id: string, policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy) => {
    console.log("[v0] Edit policy:", id, policy)
    // TODO: Implement edit functionality - could open form with pre-filled data
  }

  const handleDelete = (id: string) => {
    console.log("[v0] Delete policy:", id)
    setPolicies((prev) => prev.filter((p) => p.id !== id))
  }

  const handleDeploy = (id: string) => {
    console.log("[v0] Deploy policy:", id)

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