import { Shield, User, Calendar, FileText, Tag, ExternalLink, AlertTriangle, Clock } from "lucide-react"
import type { AttackRuleMeta } from "@/features/attack/utils/attck-utils"

// 规则字段配置数组
const ruleFields = [
  { label: "作者", key: "author", icon: User, iconColor: "text-blue-500" },
  { label: "创建日期", key: "date", icon: Calendar, iconColor: "text-green-500" },
  { label: "修改日期", key: "modified", icon: Clock, iconColor: "text-orange-500" },
  { label: "状态", key: "status", icon: Shield, iconColor: "text-blue-600" },
  { label: "阶段", key: "phases", icon: AlertTriangle, iconColor: "text-red-500" },
  { label: "标签", key: "tags", icon: Tag, iconColor: "text-purple-500" },
]

// 状态指示器组件
const StatusIndicator = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "stable":
        return { bg: "bg-green-500", text: "text-green-600", label: "稳定" }
      case "experimental":
        return { bg: "bg-yellow-500", text: "text-yellow-600", label: "实验" }
      case "deprecated":
        return { bg: "bg-red-500", text: "text-red-600", label: "已弃用" }
      default:
        return { bg: "bg-gray-400", text: "text-gray-500", label: "未知" }
    }
  }

  const statusConfig = getStatusColor(status)

  return (
    <div className="flex items-center space-x-1 text-sm font-normal mr-4">
      <span className={`inline-block h-3 w-3 rounded-full ${statusConfig.bg}`} />
      <span className={statusConfig.text}>{statusConfig.label}</span>
    </div>
  )
}

// 格式化数组数据显示
const formatArrayValue = (value: string[] | string, key?: string) => {
  if (Array.isArray(value)) {
    if (key === "phases") {
      // Remove "phase." prefix from phases
      return value.map((phase) => phase.replace(/^phase\./, "")).join(", ")
    } else if (key === "tags") {
      // Remove "attack." prefix and convert to uppercase
      return value.map((tag) => tag.replace(/^attack\./, "").toUpperCase()).join(", ")
    }
    return value.join(", ")
  }
  return value
}

export const RuleInfoCard = ({ id, ruleMeta }: { id: string; ruleMeta?: AttackRuleMeta }) => {
  if (!ruleMeta) {
    return (
      <div className="inline-block min-w-[320px] max-w-[400px] bg-white rounded-lg shadow-md border text-sm">
        <div className="px-4 py-3 text-sm text-gray-500">暂无规则详情</div>
      </div>
    )
  }

  const ruleData = {
    id: ruleMeta.rule_id || id,
    title: ruleMeta.title || id,
    status: ruleMeta.status || "",
    author: ruleMeta.author || "",
    date: ruleMeta.rule_date || "",
    description: ruleMeta.description || "",
    modified: ruleMeta.modified || "",
    references: ruleMeta.references || [],
    tags: ruleMeta.tags || [],
    phases: ruleMeta.phases || [],
  }

  return (
    <div className="inline-block min-w-[320px] max-w-[400px] bg-white rounded-lg shadow-md border text-sm">
      <div
        className={`px-4 py-3 ${
          ruleData.status.toLowerCase() === "stable"
            ? "bg-green-50"
            : ruleData.status.toLowerCase() === "experimental"
              ? "bg-yellow-50"
              : "bg-gray-100"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-base text-gray-800">{ruleData.title}</h3>
            </div>
          </div>
          <StatusIndicator status={ruleData.status} />
        </div>
      </div>

      {/* 描述部分 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start">
          <FileText className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{ruleData.id}</p>
            <p className="text-xs text-gray-500 mb-2">描述</p>
            <p className="text-sm text-gray-800 leading-relaxed break-words">{ruleData.description}</p>
          </div>
        </div>
      </div>

      {/* 详细信息网格 */}
      <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
        {ruleFields.map(({ label, key, icon: Icon, iconColor }) => (
          <div className="flex items-start min-w-0" key={key}>
            <Icon className={`h-4 w-4 ${iconColor} mr-2 mt-1 flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm text-gray-800 truncate">
                {ruleData[key as keyof typeof ruleData] ? (
                  formatArrayValue(ruleData[key as keyof typeof ruleData] as string[] | string, key)
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 参考链接部分 */}
      {ruleData.references && ruleData.references.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-start">
            <ExternalLink className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-2">参考链接</p>
              {ruleData.references.map((ref, index) => (
                <a
                  key={index}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline block truncate"
                >
                  {ref}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
