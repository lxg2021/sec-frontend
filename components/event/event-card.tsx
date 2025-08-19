"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Copy,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
  Hash,
  FolderOpen,
  Terminal,
  Fingerprint,
  Lock,
  Shield,
  Info,
  Clock,
  Eye,
  EyeOff,
  Radio,
  Globe,
  ArrowRightLeft,
  Server,
  Network,
  Play,
  User,
  PauseCircle,
  Flag,
  Barcode,
  Image,
  File,
  Folder,
  List,
  Database,
  Filter,
  Tags,
  Tag,
  Code,
} from "lucide-react"
import { useState } from "react"
import type { AllEventData, EventType, SectionConfig, HeaderConfig, FieldConfig } from "@/lib/events/types"
import { getEventHeaderConfig, getEventCardConfig } from "@/lib/events/eventConfigs"

const iconMap = {
  Activity,
  FileText,
  Hash,
  FolderOpen,
  Terminal,
  Fingerprint,
  Lock,
  Shield,
  Info,
  Clock,
  Eye,
  EyeOff,
  Copy,
  ChevronDown,
  ChevronUp,
  Radio,
  Globe,
  ArrowRightLeft,
  Server,
  Network,
  Play,
  User,
  PauseCircle,
  Flag,
  Barcode,
  Image,
  File,
  Folder,
  List,
  Database,
  Filter,
  Tags,
  Tag,
  Code,
}

const getIcon = (iconName: keyof typeof iconMap) => iconMap[iconName] || Info

interface EventCardProps {
  data: AllEventData
  eventType: EventType
  className?: string
  cardConfig?: SectionConfig[]
  headerConfig?: HeaderConfig
}

export function EventCard({ data, eventType, className, cardConfig, headerConfig }: EventCardProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  const toggleExpanded = (fieldKey: string) => {
    setExpandedFields(prev => {
      const newExpanded = new Set(prev)
      newExpanded.has(fieldKey) ? newExpanded.delete(fieldKey) : newExpanded.add(fieldKey)
      return newExpanded
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const renderFieldValue = (
    field: FieldConfig,
    value: unknown,
    sectionIndex: number,
    fieldIndex: number
  ) => {
    if (field.customRender) return field.customRender(value)

    const fieldKey = `${sectionIndex}-${fieldIndex}`
    const stringValue = String(value ?? "-")
    const isExpanded = expandedFields.has(fieldKey)

    const classes = [
      field.color || "text-gray-600",
      field.bold ? "font-semibold" : "",
      field.monospace ? "font-mono text-xs" : "",
      field.highlight ? "bg-yellow-100 px-1 rounded" : "",
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <div className="flex items-start gap-2 flex-1">
        <span className={`${classes} break-all whitespace-pre-wrap`}>{stringValue}</span>

        {field.expandable && (
          <Button variant="ghost" size="sm" onClick={() => toggleExpanded(fieldKey)} className="h-6 px-2 text-xs">
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {isExpanded ? "收起" : "展开"}
          </Button>
        )}

        {field.copyable && (
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(stringValue)} className="h-6 px-2 text-xs">
            <Copy className="h-3 w-3" />
          </Button>
        )}

        {field.showInPopover && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <ChevronDown className="h-3 w-3" /> 查看
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-h-80 overflow-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{field.label}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(stringValue)}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3" /> 复制
                  </Button>
                </div>
                <div className={`text-xs break-all whitespace-pre-wrap ${field.monospace ? "font-mono" : ""}`}>
                  {stringValue}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    )
  }

  const finalHeaderConfig = headerConfig || getEventHeaderConfig(eventType)
  const finalCardConfig = cardConfig || getEventCardConfig(eventType)

  return (
    <Card className={`w-full max-w-4xl ${className ?? ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            {String(data[finalHeaderConfig.title.key] ?? "-")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {finalHeaderConfig.badges.map((badge, index) => (
              <div key={index}>
                {badge.customRender ? (
                  badge.customRender(data[badge.key])
                ) : (
                  <Badge variant={badge.variant || "default"}>
                    {badge.label ? `${badge.label}: ` : ""}
                    {String(data[badge.key] ?? "-")}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header 字段 Grid，多行显示 */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
          {finalHeaderConfig.fields.map((field, index) => {
            const IconComponent = field.icon ? getIcon(field.icon as keyof typeof iconMap) : null
            return (
              <div key={index} className="flex items-start gap-2">
                {IconComponent && <IconComponent className={`h-4 w-4 ${field.color}`} />}
                <span className="font-medium">{field.label}:</span>
                <span className="font-mono text-xs break-all whitespace-pre-wrap">{String(data[field.key] ?? "-")}</span>
              </div>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {finalCardConfig.map((section, sectionIndex) => {
          const SectionIcon = getIcon(section.icon as keyof typeof iconMap)
          return (
            <div key={sectionIndex}>
              {sectionIndex > 0 && <Separator />}

              <div className="space-y-4">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${section.color}`}>
                  <SectionIcon className="h-5 w-5" />
                  {section.title}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.fields.map((field, fieldIndex) => {
                    const FieldIcon = field.icon ? getIcon(field.icon as keyof typeof iconMap) : null
                    return (
                      <div key={fieldIndex} className="text-sm flex items-start gap-2 min-h-[24px]">
                        {FieldIcon && <FieldIcon className={`h-4 w-4 ${field.color} mt-0.5 flex-shrink-0`} />}
                        <span className="font-medium text-gray-700 flex-shrink-0">{field.label}:</span>
                        {renderFieldValue(field, data[field.key], sectionIndex, fieldIndex)}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
