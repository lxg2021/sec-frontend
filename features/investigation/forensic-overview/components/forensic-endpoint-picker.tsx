"use client"

import { useMemo, useState } from "react"
import { Check, ChevronRight, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { cn } from "@/shared/lib/utils"
import { endpointPrimaryLabel, formatRelative, isBound } from "../mappers"
import type { EndpointStatus, ForensicEndpointItem } from "../types"
import { EndpointStatusBadge, MonoText } from "./shared"

interface Props {
  endpoints: ForensicEndpointItem[]
  selected?: ForensicEndpointItem
  onSelect: (ep: ForensicEndpointItem) => void
}

const statusFilters: { key: EndpointStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "online", label: "在线" },
  { key: "offline", label: "离线" },
  { key: "unknown", label: "未知" },
]

export function ForensicEndpointPicker({
  endpoints,
  selected,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState<EndpointStatus | "all">("all")

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
  }, [endpoints, keyword, status])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-between px-3 py-2.5"
        >
          {selected ? (
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="truncate text-sm font-medium">
                {endpointPrimaryLabel(selected)}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {selected.os.toUpperCase()} ·{" "}
                {selected.agent_id
                  ? `agent: ${selected.agent_id}`
                  : "未绑定 agent_id"}
              </span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">选择目标终端</span>
          )}
          <ChevronRight className="text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>选择目标终端</DialogTitle>
          <DialogDescription>
            优先选择在线且已绑定 agent_id 的 Windows 终端。
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索 hostname / fqdn / agent_id / client_id"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((f) => (
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
        <ScrollArea className="h-72">
          <div className="space-y-1.5 pr-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                没有匹配的终端
              </p>
            ) : (
              filtered.map((ep) => (
                <button
                  key={ep.endpoint_id}
                  type="button"
                  onClick={() => {
                    onSelect(ep)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40",
                    selected?.endpoint_id === ep.endpoint_id &&
                      "border-primary bg-primary/5",
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {endpointPrimaryLabel(ep)}
                      </span>
                      {selected?.endpoint_id === ep.endpoint_id ? (
                        <Check className="size-3.5 text-primary" />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="uppercase">{ep.os}</span>
                      <span>
                        agent:{" "}
                        {ep.agent_id ? (
                          <MonoText value={ep.agent_id} className="inline" />
                        ) : (
                          <span className="text-amber-600">未绑定</span>
                        )}
                      </span>
                      <span>
                        vr:{" "}
                        <MonoText
                          value={ep.velociraptor_client_id}
                          className="inline opacity-70"
                        />
                      </span>
                      <span>活跃 {formatRelative(ep.last_seen_at)}</span>
                    </div>
                  </div>
                  <EndpointStatusBadge status={ep.status} />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <p className="text-[11px] text-muted-foreground">
          {isBound(selected ?? ({} as ForensicEndpointItem))
            ? ""
            : "无 agent_id 的终端将使用 endpoint_id 提交；无 velociraptor_client_id 的终端无法下发。"}
        </p>
      </DialogContent>
    </Dialog>
  )
}


