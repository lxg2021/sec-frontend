import type { ConfigCategory } from "@/features/sensor-config/types/config-item"

export interface SensorConfigChange {
  categoryLabel: string
  itemKey: string
  itemLabel: string
  previousEnabled: boolean
  enabled: boolean
}

const SEMANTIC_VERSION_PATTERN = /^\d+\.\d+\.\d+$/

function itemIdentity(categoryLabel: string, itemKey: string) {
  return `${categoryLabel}\u0000${itemKey}`
}

export function cloneConfigCategories(categories: ConfigCategory[]): ConfigCategory[] {
  return categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }))
}

export function countConfigItems(categories: ConfigCategory[]) {
  return categories.reduce((total, category) => total + category.items.length, 0)
}

export function countEnabledConfigItems(categories: ConfigCategory[]) {
  return categories.reduce(
    (total, category) => total + category.items.filter((item) => item.enabled).length,
    0,
  )
}

export function getSensorConfigChanges(
  baseline: ConfigCategory[],
  current: ConfigCategory[],
): SensorConfigChange[] {
  const baselineItems = new Map<string, boolean>()

  baseline.forEach((category) => {
    category.items.forEach((item) => {
      baselineItems.set(itemIdentity(category.label, item.key), item.enabled)
    })
  })

  return current.flatMap((category) =>
    category.items.flatMap((item) => {
      const previousEnabled = baselineItems.get(itemIdentity(category.label, item.key))
      if (previousEnabled === undefined || previousEnabled === item.enabled) return []

      return [{
        categoryLabel: category.label,
        itemKey: item.key,
        itemLabel: item.label,
        previousEnabled,
        enabled: item.enabled,
      }]
    }),
  )
}

export function buildEnabledConfigCategories(categories: ConfigCategory[]): ConfigCategory[] {
  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.enabled).map((item) => ({ ...item })),
    }))
    .filter((category) => category.items.length > 0)
}

export function isSemanticConfigVersion(version: string) {
  return SEMANTIC_VERSION_PATTERN.test(version.trim())
}

export function createSensorConfigEditorSignature(
  name: string,
  version: string,
  categories: ConfigCategory[],
) {
  return JSON.stringify({
    name: name.trim(),
    version: version.trim(),
    categories: categories.map((category) => ({
      label: category.label,
      items: category.items.map((item) => ({ key: item.key, enabled: item.enabled })),
    })),
  })
}
