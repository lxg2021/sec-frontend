import { ForensicTaskFlowDetailPage } from "@/shared/components/forensic/forensic-task-flow-detail-page"
import type { ForensicTaskTargetHost } from "@/shared/lib/forensic/types"

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function pick(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function splitList(value: string | undefined): string[] | undefined {
  const list = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return list.length > 0 ? list : undefined
}

function fallbackTargetHost(params: Record<string, string | string[] | undefined>): ForensicTaskTargetHost | null {
  const target: ForensicTaskTargetHost = {
    agent_id: pick(params.agent_id),
    hostname: pick(params.hostname),
    ip: splitList(pick(params.ip)),
    macs: splitList(pick(params.macs)),
  }
  if (!target.agent_id && !target.hostname && !target.ip?.length && !target.macs?.length) {
    return null
  }
  return target
}

export default async function ForensicTaskDetailPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  return <ForensicTaskFlowDetailPage taskId={pick(params.task_id)} fallbackTargetHost={fallbackTargetHost(params)} />
}
