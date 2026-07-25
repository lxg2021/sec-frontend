import type {
  ControlObjectDefinition,
  ControlObjectDeleteMode,
  ControlObjectOperation,
} from "./api"

export type ControlObjectCapabilityColumnKey = "canUpdate" | ControlObjectOperation

export const CONTROL_OBJECT_CAPABILITY_COLUMNS: ReadonlyArray<{
  key: ControlObjectCapabilityColumnKey
  label: string
}> = [
  { key: "canUpdate", label: "可更新" },
  { key: "apply", label: "可应用" },
  { key: "execute", label: "可执行" },
  { key: "stop", label: "可停止" },
  { key: "remove", label: "可移除" },
]

export const CONTROL_OBJECT_TABLE_COLUMNS = [
  { key: "type", label: "类型", widthClassName: "w-[86px]", align: "left" },
  { key: "displayName", label: "显示名称", widthClassName: "w-[150px]", align: "left" },
  { key: "internalName", label: "内部名称", widthClassName: "w-[150px]", align: "left" },
  { key: "objectId", label: "ID", widthClassName: "w-[220px]", align: "left" },
  { key: "subType", label: "类型", widthClassName: "w-[72px]", align: "center" },
  { key: "version", label: "当前版本", widthClassName: "w-[84px]", align: "left" },
  { key: "source", label: "来源", widthClassName: "w-[94px]", align: "left" },
  ...CONTROL_OBJECT_CAPABILITY_COLUMNS.map((column) => ({
    ...column,
    widthClassName: "w-[68px]",
    align: "center" as const,
  })),
  { key: "deleteMode", label: "删除方式", widthClassName: "w-[120px]", align: "left" },
  { key: "state", label: "状态", widthClassName: "w-[74px]", align: "left" },
  { key: "actions", label: "操作", widthClassName: "w-[304px]", align: "right" },
] as const

const DELETE_MODE_LABELS: Record<ControlObjectDeleteMode, string> = {
  forbidden: "禁止删除",
  metadata_only: "仅删元数据",
  remove_effects: "移除效果后删除",
  unknown: "未声明",
}

export function controlObjectHasCapability(
  definition: ControlObjectDefinition,
  capability: ControlObjectCapabilityColumnKey,
) {
  return capability === "canUpdate"
    ? definition.capabilities.canUpdate
    : definition.capabilities.allowedOperations.includes(capability)
}

export function controlObjectDeleteModeLabel(mode: ControlObjectDeleteMode) {
  return DELETE_MODE_LABELS[mode]
}
