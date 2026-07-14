const FILE_PATH_PROPERTY_KEYS = [
  "path",
  "file_path",
  "base_path",
  "file_name",
  "org_file_name",
] as const

export function getRemediationTargetPresentation(
  capability: string,
  displayName: string,
  properties: Readonly<Record<string, string>>,
) {
  const fallback = displayName.trim()
  if (capability !== "file") {
    return { label: fallback, fullValue: fallback, showFullValue: false }
  }

  const propertyPath = FILE_PATH_PROPERTY_KEYS.map((key) =>
    String(properties[key] ?? "").trim(),
  ).find(Boolean)
  const fullValue = /[\\/]/.test(fallback)
    ? fallback
    : propertyPath || fallback
  const labelSource = fallback || fullValue
  const normalized = labelSource
    .replace(/^["']|["']$/g, "")
    .replace(/[\\/]+$/g, "")
  const label = normalized.split(/[\\/]/).pop() || labelSource

  return {
    label,
    fullValue,
    showFullValue: Boolean(fullValue && fullValue !== label),
  }
}
