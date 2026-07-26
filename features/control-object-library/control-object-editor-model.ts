import {
  compareControlObjectVersions,
  suggestNextControlObjectVersion,
  type ControlObjectDefinition,
  type ControlObjectDetail,
  type ControlObjectUpdateInput,
} from "./api"
import {
  isBaselineScanPolicyDefinition,
  readBaselineScanPolicySchedule,
  writeBaselineScanPolicyContext,
} from "./baseline-scan-policy-editor"

export interface ControlObjectEditorForm {
  name: string
  version: string
  context: string
  url: string
  md5: string
}

export type ControlObjectEditorField = keyof ControlObjectEditorForm | "form"

export interface ControlObjectEditorIssue {
  field: ControlObjectEditorField
  message: "nameRequired" | "nameTooLong" | "versionFormat" | "versionNotGreater"
    | "contextRequired" | "baselineScheduleInvalid" | "unchanged" | "urlTooLong" | "md5Invalid"
}

export function canEditControlObjectDefinition(definition: ControlObjectDefinition) {
  return definition.capabilities.canUpdate && definition.objectType !== "command"
}

export function createControlObjectEditorForm(detail: ControlObjectDetail): ControlObjectEditorForm {
  const { editableContent } = detail
  if (isBaselineScanPolicyDefinition(detail.definition)) {
    // Fail closed instead of inventing a schedule when historical content is incomplete.
    readBaselineScanPolicySchedule(editableContent.context)
  }
  return {
    name: editableContent.name,
    version: suggestNextControlObjectVersion(editableContent.version),
    context: editableContent.context,
    url: editableContent.url,
    md5: editableContent.md5,
  }
}

export function controlObjectEditorSignature(form: ControlObjectEditorForm) {
  return JSON.stringify(form)
}

export function hasControlObjectDefinitionChanges(
  form: ControlObjectEditorForm,
  detail: ControlObjectDetail,
) {
  const current = detail.editableContent
  return form.name.trim() !== current.name
    || form.context !== current.context
    || (detail.definition.objectType === "config" && (
      form.url.trim() !== current.url
      || form.md5.trim().toLowerCase() !== current.md5
    ))
}

export function validateControlObjectEditorForm(
  form: ControlObjectEditorForm,
  detail: ControlObjectDetail,
): ControlObjectEditorIssue | null {
  const name = form.name.trim()
  if (!name) return { field: "name", message: "nameRequired" }
  if (name.length > 255) return { field: "name", message: "nameTooLong" }

  const comparison = compareControlObjectVersions(form.version, detail.definition.version)
  if (comparison === null) {
    return { field: "version", message: "versionFormat" }
  }
  if (comparison <= 0) {
    return { field: "version", message: "versionNotGreater" }
  }

  if (!form.context.trim()) return { field: "context", message: "contextRequired" }
  if (isBaselineScanPolicyDefinition(detail.definition)) {
    try {
      readBaselineScanPolicySchedule(form.context)
    } catch {
      return { field: "context", message: "baselineScheduleInvalid" }
    }
  }
  if (!hasControlObjectDefinitionChanges(form, detail)) {
    return { field: "form", message: "unchanged" }
  }

  if (detail.definition.objectType === "config") {
    if (form.url.trim().length > 512) {
      return { field: "url", message: "urlTooLong" }
    }
    const md5 = form.md5.trim()
    if (md5 && !/^[a-fA-F0-9]{32}$/.test(md5)) {
      return { field: "md5", message: "md5Invalid" }
    }
  }

  return null
}

export function controlObjectUpdateInput(
  form: ControlObjectEditorForm,
  definition: Pick<ControlObjectDefinition, "objectId" | "objectType" | "subType">,
): ControlObjectUpdateInput {
  const context = isBaselineScanPolicyDefinition(definition)
    ? writeBaselineScanPolicyContext({
        context: form.context,
        definition,
        name: form.name,
        version: form.version,
        schedule: readBaselineScanPolicySchedule(form.context),
      })
    : form.context

  return {
    name: form.name.trim(),
    version: form.version.trim(),
    context,
    ...(definition.objectType === "config" ? {
      url: form.url.trim(),
      md5: form.md5.trim().toLowerCase(),
    } : {}),
  }
}
