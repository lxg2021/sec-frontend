// configItem.ts
/**
 * 消息详情
 */
export interface MessageDetail {
  /** 消息名称 */
  name: string

  /** 消息说明 */
  description: string
}

/**
 * 配置项
 */
export interface ConfigItem {
  /** 唯一标识，比如 "WindowsMessageHook" */
  key: string

  /** 展示名称 */
  label: string

  /** 开关状态 */
  enabled: boolean

  /** 结构化描述 */
  description?: string
}

/**
 * 配置分类
 */
export interface ConfigCategory {
  /** 分类显示名称，比如 "文件与注册表" */
  label: string

  /** 该分类下的所有配置项 */
  items: ConfigItem[]
}
