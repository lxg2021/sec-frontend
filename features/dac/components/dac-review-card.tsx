"use client"

import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Edit, Trash2, Send, ChevronDown, ChevronUp, FileText, FolderTree, Cpu, Network } from "lucide-react"
import type { DacPolicy } from "@/features/dac/types"

type DeployStatus = "not_deployed" | "deploying" | "deployed" | "failed"

interface PolicyWithMetadata {
  id: string
  policy: DacPolicy
  status: DeployStatus
  createdAt: Date
}

interface DacReviewCardProps {
  policies: PolicyWithMetadata[]
  onEdit?: (id: string, policy: DacPolicy) => void
  onDelete?: (id: string) => void
  onDeploy?: (id: string) => void
}

const POLICY_TYPE_CONFIG = {
  fs: {
    label: "文件策略",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  reg: {
    label: "注册表策略",
    icon: FolderTree,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  ps: {
    label: "进程策略",
    icon: Cpu,
    color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  net: {
    label: "网络策略",
    icon: Network,
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
}

const STATUS_CONFIG = {
  not_deployed: {
    label: "未下发",
    color: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
  deploying: {
    label: "下发中",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  deployed: {
    label: "已下发",
    color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  failed: {
    label: "失败",
    color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
}

export function DacReviewCard({ policies, onEdit, onDelete, onDeploy }: DacReviewCardProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>暂无策略</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>策略名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>版本</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policyData) => {
            const { id, policy, status, createdAt } = policyData
            const policyType = policy.header.type || "fs"
            const typeConfig =
              POLICY_TYPE_CONFIG[policyType as keyof typeof POLICY_TYPE_CONFIG] || POLICY_TYPE_CONFIG.fs
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.not_deployed
            const TypeIcon = typeConfig.icon
            const isExpanded = expandedRows.has(id)

            return (
              <React.Fragment key={id}>
                <TableRow className="group">
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleRow(id)} className="h-8 w-8 p-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>

                  <TableCell className="font-medium">{policy.header.name}</TableCell>

                  <TableCell>
                    <Badge variant="outline" className={typeConfig.color}>
                      <TypeIcon className="mr-1.5 h-3.5 w-3.5" />
                      {typeConfig.label}
                    </Badge>
                  </TableCell>

                  <TableCell>{policy.header.version}</TableCell>

                  <TableCell>{policy.header.level}</TableCell>

                  <TableCell className="text-sm text-muted-foreground">{createdAt.toLocaleString("zh-CN")}</TableCell>

                  <TableCell>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(id, policy)} className="h-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeploy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeploy(id)}
                          disabled={status === "deploying"}
                          className="h-8"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(id)}
                          className="h-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow key={`${id}-details`}>
                    <TableCell colSpan={8} className="bg-muted/50 p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">策略详情 (JSON)</h4>
                        <pre className="text-xs overflow-x-auto rounded-lg bg-background p-4 border">
                          <code>{JSON.stringify(policy, null, 2)}</code>
                        </pre>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
