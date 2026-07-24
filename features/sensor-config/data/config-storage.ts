// configStorage.ts - 配置文件存储逻辑
import type { ConfigCategory } from "@/features/sensor-config/types/config-item"

export interface SavedConfig {
  id: string
  name: string
  version: string
  date: string
  filePath: string
  categories: ConfigCategory[]
}

export type ConfigContent = Omit<SavedConfig, "id" | "filePath">

export interface SensorConfigEditorDraft {
  name: string
  version: string
  categories: ConfigCategory[]
  savedAt: string
}

const STORAGE_KEY = "saved_configs"
const EDITOR_DRAFT_STORAGE_KEY = "sensor_config_editor_draft"

export const configStorage = {
  // 保存配置到 localStorage
  saveConfig: (config: Omit<SavedConfig, "id" | "filePath">): SavedConfig => {
    const id = Date.now().toString()
    const filePath = `${config.name}-${config.version}-${config.date}.json`

    const savedConfig: SavedConfig = {
      id,
      filePath,
      ...config,
    }

    const existingConfigs = configStorage.getAllConfigs()
    const updatedConfigs = [...existingConfigs, savedConfig]

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs))

    // 同时保存配置文件内容到 localStorage
    const configContent = {
      name: config.name,
      version: config.version,
      date: config.date,
      categories: config.categories,
    }
    localStorage.setItem(`config_${id}`, JSON.stringify(configContent, null, 2))

    return savedConfig
  },

  // 获取所有配置
  getAllConfigs: (): SavedConfig[] => {
    const configs = localStorage.getItem(STORAGE_KEY)
    return configs ? JSON.parse(configs) : []
  },

  // 获取所有配置 (别名函数)
  getConfigs: (): SavedConfig[] => {
    return configStorage.getAllConfigs()
  },

  // 删除配置
  deleteConfig: (id: string): void => {
    const existingConfigs = configStorage.getAllConfigs()
    const updatedConfigs = existingConfigs.filter((config) => config.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs))

    // 同时删除配置文件内容
    localStorage.removeItem(`config_${id}`)
  },

  // 获取配置文件内容
  getConfigContent: (id: string): ConfigContent | null => {
    const content = localStorage.getItem(`config_${id}`)
    return content ? (JSON.parse(content) as ConfigContent) : null
  },

  // 获取配置文件路径（用于后端传递）
  getConfigFilePath: (id: string): string | null => {
    const configs = configStorage.getAllConfigs()
    const config = configs.find((c) => c.id === id)
    return config ? config.filePath : null
  },

  saveEditorDraft: (draft: SensorConfigEditorDraft): void => {
    localStorage.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  },

  getEditorDraft: (): SensorConfigEditorDraft | null => {
    const draft = localStorage.getItem(EDITOR_DRAFT_STORAGE_KEY)
    return draft ? (JSON.parse(draft) as SensorConfigEditorDraft) : null
  },

  clearEditorDraft: (): void => {
    localStorage.removeItem(EDITOR_DRAFT_STORAGE_KEY)
  },
}
