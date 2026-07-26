import type {
  ControlObjectDefinition,
  ControlObjectDeleteMode,
} from "./api"

export const CONTROL_OBJECT_TABLE_COLUMNS = [
  { key: "type", labelKey: "table.type", widthClassName: "w-[7%]", align: "left" },
  { key: "displayName", labelKey: "table.displayName", widthClassName: "w-[16%]", align: "left" },
  { key: "internalName", labelKey: "table.internalName", widthClassName: "w-[16%]", align: "left" },
  { key: "objectId", labelKey: "table.id", widthClassName: "w-[17%]", align: "left" },
  { key: "subType", labelKey: "table.subType", widthClassName: "w-[6%]", align: "center" },
  { key: "version", labelKey: "table.version", widthClassName: "w-[8%]", align: "left" },
  { key: "source", labelKey: "table.source", widthClassName: "w-[8%]", align: "left" },
  { key: "state", labelKey: "table.state", widthClassName: "w-[7%]", align: "left" },
  { key: "delivery", labelKey: "table.delivery", widthClassName: "w-[9%]", align: "center" },
  { key: "actions", labelKey: "table.actions", widthClassName: "w-[6%]", align: "left" },
] as const

const DELETE_MODE_LABEL_KEYS: Record<ControlObjectDeleteMode, string> = {
  forbidden: "deleteModes.forbidden",
  metadata_only: "deleteModes.metadataOnly",
  remove_effects: "deleteModes.removeEffects",
  unknown: "deleteModes.unknown",
}

const BUILTIN_NAME_KEY_BY_ID: Record<string, string> = {
  "6f2c9d3a-8e47-4f6b-b9f2-1e3c4a7d8b21": "builtinObjects.baselineScanPolicy",
  "7f3a9c42-1d6f-4b8e-9e21-8c6b0a5d4f93": "builtinObjects.patchScanPolicy",
  "9a182447-b61d-48f6-b99c-264c128aeebb": "builtinObjects.generalConfig",
  "32cbdb22-52e0-43f7-a663-ce6335c28850": "builtinObjects.reportConfig",
  "d4f1a2c7-9b8e-4f3c-ae6b-57d2f1e4c9a0": "builtinObjects.sensorConfig",
  "3f6c2a9e-9b1f-4a7d-8e3c-6c8d1b2f4e91": "builtinObjects.patchImmediateScan",
  "4a7c3b8d-2f1e-5b9c-8d7e-9c3d5a6f4b20": "builtinObjects.baselineImmediateScan",
}

export function controlObjectDeleteModeLabelKey(mode: ControlObjectDeleteMode) {
  return DELETE_MODE_LABEL_KEYS[mode]
}

export function controlObjectDisplayNameKey(
  definition: Pick<ControlObjectDefinition, "objectId">,
) {
  return BUILTIN_NAME_KEY_BY_ID[definition.objectId.toLowerCase()] ?? null
}
