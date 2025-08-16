"use client"

import type { EventType, HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import * as EventConfigs from "@/lib/events/eventConfigs/index"

// 统一的事件配置映射
export const EVENT_CONFIG_MAP: Record<
  EventType,
  {
    header: HeaderConfig
    card: SectionConfig[]
  }
> = {
  processCreate: {
    header: EventConfigs.PROCESS_CREATE_HEADER,
    card: EventConfigs.PROCESS_CREATE_CARD,
  },
  processExit: {
    header: EventConfigs.PROCESS_EXIT_HEADER,
    card: EventConfigs.PROCESS_EXIT_CARD,
  },
  processAccess: {
    header: EventConfigs.PROCESS_ACCESS_HEADER,
    card: EventConfigs.PROCESS_ACCESS_CARD,
  },
  remoteThread: {
    header: EventConfigs.REMOTE_THREAD_HEADER,
    card: EventConfigs.REMOTE_THREAD_CARD,
  },
  crossMemoryExecute: {
    header: EventConfigs.CROSS_MEMORY_EXECUTE_HEADER,
    card: EventConfigs.CROSS_MEMORY_EXECUTE_CARD,
  },
}

// 按类型获取配置的辅助函数
export function getEventHeaderConfig(eventType: EventType) {
  return EVENT_CONFIG_MAP[eventType].header
}

export function getEventCardConfig(eventType: EventType) {
  return EVENT_CONFIG_MAP[eventType].card
}
