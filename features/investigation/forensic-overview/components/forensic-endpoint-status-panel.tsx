"use client"

import { useMemo, useState } from "react"
import { Monitor, Search, Unplug } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"
import {
  endpointPrimaryLabel,
  formatRelative,
  isBound,
} from "../mappers"
import type { EndpointStatus, ForensicEndpointItem } from "../types"
import { EmptyState, EndpointStatusBadge, MonoText } from "./shared"

interface Props {
  endpoints: ForensicEndpointItem[]
  loading: boolean
  onPick: (ep: ForensicEndpointItem) => void
  selectedId?: string
}

const filters: { key: EndpointStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "online", label: "在线" },
  { key: "offline", label: "离线" },
  { key: "unknown", label: "未知" },
]

export function ForensicEndpointStatusPanel({
  endpoints,
  loading,
  onPick,
  selectedId,
}: Props) {
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState<EndpointStatus | "all">("all")

  const counts = useMemo(() => {
    return {
      online: endpoints.filter((e) => e.status === "online").length,
      offline: endpoints.filter((e) => e.status === "offline").length,
      unknown: endpoints.filter((e) => e.status === "unknown").length,
      unbound: endpoints.filter((e) => !isBound(e)).length,
    }
  }, [endpoints])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return endpoints
      .filter((e) => (status === "all" ? true : e.status === status))
      .filter((e) => {
        if (!kw) return true
        return [e.hostname, e.fqdn, e.agent_id, e.velociraptor_client_id]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(kw))
      })
      .slice(0, 8)
  }, [endpoints, keyword, status])

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="size-4 text-primary" />
            终端状态
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-emerald-600">在线 {counts.online}</span>
            <span>·</span>
            <span>离线 {counts.offline}</span>
            <span>·</span>
            <span className="text-amber-600">未知 {counts.unknown}</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-600">
              <Unplug className="size-3" />
              未绑定 {counts.unbound}
            </span>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索 hostname / fqdn / agent_id / client_id"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Button
              key={f.key}
              type="button"
              size="sm"
              variant={status === f.key ? "default" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="没有匹配的终端"
            description="请先点击“同步终端”，或确认 Velociraptor 客户端是否已上线。"
          />
        ) : (
          filtered.map((ep) => {
            const bound = isBound(ep)
            return (
              <button
                key={ep.endpoint_id}
                type="button"
                onClick={() => onPick(ep)}
                className={cn(
                  "flex w-full flex-col gap-1.5 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40",
                  selectedId === ep.endpoint_id &&
                    "border-primary bg-primary/5 ring-1 ring-primary/30",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {endpointPrimaryLabel(ep)}
                  </span>
                  <EndpointStatusBadge status={ep.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="uppercase">{ep.os}</span>
                  {bound ? (
                    <span>
                      agent: <MonoText value={ep.agent_id} className="inline" />
                    </span>
                  ) : (
                    <span className="text-amber-600">尚未绑定业务 Agent ID</span>
                  )}
                  <span>活跃 {formatRelative(ep.last_seen_at)}</span>
                </div>
              </button>
            )
          })
        )}
        <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
          未绑定终端可通过 Agent 上报或后台绑定接口建立 agent_id 映射，本页不提供独立绑定管理。
        </p>
      </CardContent>
    </Card>
  )
}


