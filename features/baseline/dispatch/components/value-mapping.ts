"use client"

const knownStandards = new Set(["cis", "dod", "msft", "tls", "intune", "custom"])
const knownProfiles = new Set(["machine", "user", "both"])

type DispatchTranslator = (key: string) => string

function normalizeValue(value: string) {
  return value.trim().toLowerCase()
}

export function getDispatchStandardKey(value: string) {
  const key = normalizeValue(value)
  return knownStandards.has(key) ? key : "other"
}

export function getDispatchStandardLabel(value: string, t: DispatchTranslator, fallbackUnknown: string) {
  const trimmed = value.trim()
  if (!trimmed) return fallbackUnknown

  const key = normalizeValue(trimmed)
  return knownStandards.has(key) ? t(`selector.standard.${key}`) : trimmed
}

export function getDispatchProfileLabel(value: string, t: DispatchTranslator, fallbackUnknown: string) {
  const trimmed = value.trim()
  if (!trimmed) return fallbackUnknown

  const key = normalizeValue(trimmed)
  return knownProfiles.has(key) ? t(`selector.profile.${key}`) : trimmed
}

export function getDispatchBaselineTypeLabel(value: string, t: DispatchTranslator) {
  const trimmed = value.trim()
  if (!trimmed) return ""

  const key = normalizeValue(trimmed)
  if (key === "template" || key === "custom") {
    return t(`baselineSelection.valueMap.baselineType.${key}`)
  }

  return trimmed
}
