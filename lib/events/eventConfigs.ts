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
  dns: {
    header: EventConfigs.DNS_HEADER,
    card: EventConfigs.DNS_CARD,
  },
  netCommunicate: {
    header: EventConfigs.NET_COMMUNICATE_HEADER,
    card: EventConfigs.NET_COMMUNICATE_CARD,
  },
  serviceCreate: {
    header: EventConfigs.SERVICE_CREATE_HEADER,
    card: EventConfigs.SERVICE_CREATE_CARD,
  },
  serviceStart: {
    header: EventConfigs.SERVICE_START_HEADER,
    card: EventConfigs.SERVICE_START_CARD,
  },
  serviceDelete: {
    header: EventConfigs.SERVICE_DELETE_HEADER,
    card: EventConfigs.SERVICE_DELETE_CARD,
  },
  serviceStop: {
    header: EventConfigs.SERVICE_STOP_HEADER,
    card: EventConfigs.SERVICE_STOP_CARD,
  },
  serviceConfig: {
    header: EventConfigs.SERVICE_CONFIG_HEADER,
    card: EventConfigs.SERVICE_CONFIG_CARD,
  },
  servicePause: {
    header: EventConfigs.SERVICE_PAUSE_HEADER,
    card: EventConfigs.SERVICE_PAUSE_CARD,
  },
}

// 按类型获取配置的辅助函数
export function getEventHeaderConfig(eventType: EventType) {
  return EVENT_CONFIG_MAP[eventType].header
}

export function getEventCardConfig(eventType: EventType) {
  return EVENT_CONFIG_MAP[eventType].card
}
