import type {
  ControlObjectDeleteMode,
} from "./api"

export const CONTROL_OBJECT_TABLE_COLUMNS = [
  { key: "type", label: "类型", widthClassName: "w-[86px]", align: "left" },
  { key: "displayName", label: "显示名称", widthClassName: "w-[150px]", align: "left" },
  { key: "internalName", label: "内部名称", widthClassName: "w-[150px]", align: "left" },
  { key: "objectId", label: "ID", widthClassName: "w-[220px]", align: "left" },
  { key: "subType", label: "类型", widthClassName: "w-[72px]", align: "center" },
  { key: "version", label: "当前版本", widthClassName: "w-[84px]", align: "left" },
  { key: "source", label: "来源", widthClassName: "w-[94px]", align: "left" },
  { key: "state", label: "状态", widthClassName: "w-[74px]", align: "left" },
  { key: "actions", label: "操作", widthClassName: "w-[96px]", align: "right" },
] as const

const DELETE_MODE_LABELS: Record<ControlObjectDeleteMode, string> = {
  forbidden: "禁止删除",
  metadata_only: "仅删元数据",
  remove_effects: "移除效果后删除",
  unknown: "未声明",
}

export function controlObjectDeleteModeLabel(mode: ControlObjectDeleteMode) {
  return DELETE_MODE_LABELS[mode]
}
