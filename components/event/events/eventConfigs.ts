"use client"

import type { EventNodeType, HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"
import * as EventConfigs from "@/components/event/events/eventConfigs/index"

// 统一的事件配置映射
export const EVENT_NODE_CONFIG_MAP: Record<
  EventNodeType,
  {
    header: HeaderConfig
    card: SectionConfig[]
  }
> = {
  ProcessNode: {
    header: EventConfigs.PROCESS_NODE_HEADER,
    card: EventConfigs.PROCESS_NODE_CARD,
  },
  FileNode: {
    header: EventConfigs.FILE_NODE_HEADER,
    card: EventConfigs.FILE_NODE_CARD,
  },
  NetNode: {
    header: EventConfigs.NET_NODE_HEADER,
    card: EventConfigs.NET_NODE_CARD,
  },
  DnsNode: {
    header: EventConfigs.DNS_NODE_HEADER,
    card: EventConfigs.DNS_NODE_CARD,
  },
  VolumeNode: {
    header: EventConfigs.VOLUME_NODE_HEADER,
    card: EventConfigs.VOLUME_NODE_CARD,
  },
  FileStreamNode: {
    header: EventConfigs.FILE_STREAM_NODE_HEADER,
    card: EventConfigs.FILE_STREAM_NODE_CARD,
  },
  BitsJobNode: {
    header: EventConfigs.BITS_JOB_NODE_HEADER,
    card: EventConfigs.BITS_JOB_NODE_CARD,
  },
  TaskNode: {
    header: EventConfigs.TASK_NODE_HEADER,
    card: EventConfigs.TASK_NODE_CARD,
  },
  DllImageNode: {
    header: EventConfigs.DLL_IMAGE_NODE_HEADER,
    card: EventConfigs.DLL_IMAGE_NODE_CARD,
  },
  DriverImageNode: {
    header: EventConfigs.DRIVER_IMAGE_NODE_HEADER,
    card: EventConfigs.DRIVER_IMAGE_NODE_CARD,
  },
  EnDecryptNode: {
    header: EventConfigs.ENDDCRYPT_NODE_HEADER,
    card: EventConfigs.ENDDCRYPT_NODE_CARD,
  },
  EventNode: {
    header: EventConfigs.EVENT_NODE_HEADER,
    card: EventConfigs.EVENT_NODE_CARD,
  },
  FileMappingNode: {
    header: EventConfigs.FILEMAPPING_NODE_HEADER,
    card: EventConfigs.FILEMAPPING_NODE_CARD,
  },
  MailSlotNode: {
    header: EventConfigs.MAILSLOT_NODE_HEADER,
    card: EventConfigs.MAILSLOT_NODE_CARD,
  },
  MbrNode: {
    header: EventConfigs.MBR_NODE_HEADER,
    card: EventConfigs.MBR_NODE_CARD,
  },
  PipeNode: {
    header: EventConfigs.PIPE_NODE_HEADER,
    card: EventConfigs.PIPE_NODE_CARD,
  },
  PowershellNode: {
    header: EventConfigs.POWERSHELL_NODE_HEADER,
    card: EventConfigs.POWERSHELL_NODE_CARD,
  },
  RegKeyNode: {
    header: EventConfigs.REGKEY_NODE_HEADER,
    card: EventConfigs.REGKEY_NODE_CARD,
  },
  RegValueNode: {
    header: EventConfigs.REGVALUE_NODE_HEADER,
    card: EventConfigs.REGVALUE_NODE_CARD,
  },
  CredentialsNode: {
    header: EventConfigs.CREDENTIALS_NODE_HEADER,
    card: EventConfigs.CREDENTIALS_NODE_CARD,
  },
  ImpersonationTokenNode: {
    header: EventConfigs.IMPERSONATION_TOKEN_NODE_HEADER,
    card: EventConfigs.IMPERSONATION_TOKEN_NODE_CARD,
  },
  MessageNode: {
    header: EventConfigs.MESSAGE_HOOK_NODE_HEADER,
    card: EventConfigs.MESSAGE_HOOK_NODE_CARD,
  },
  UrlNode: {
    header: EventConfigs.URL_NODE_HEADER,
    card: EventConfigs.URL_NODE_CARD,
  },
  WmiClassNode: {
    header: EventConfigs.WMI_CLASS_NODE_HEADER,
    card: EventConfigs.WMI_CLASS_NODE_CARD,
  },
  WmiQueryNode: {
    header: EventConfigs.WMI_QUERY_NODE_HEADER,
    card: EventConfigs.WMI_QUERY_NODE_CARD,
  },
  WmiExecuteNode: {
    header: EventConfigs.WMI_EXECUTE_NODE_HEADER,
    card: EventConfigs.WMI_EXECUTE_NODE_CARD,
  },
  WmiConsumerNode: {
    header: EventConfigs.WMI_CONSUMER_NODE_HEADER,
    card: EventConfigs.WMI_CONSUMER_NODE_CARD,
  },
  WmiFilterNode: {
    header: EventConfigs.WMI_FILTER_NODE_HEADER,
    card: EventConfigs.WMI_FILTER_NODE_CARD,
  },
  AgentNode: {
    header: EventConfigs.AGENT_NODE_HEADER,
    card: EventConfigs.AGENT_NODE_CARD,
  },
  DeviceChangeNode: {
    header: EventConfigs.DEVICE_CHANGE_NODE_HEADER,
    card: EventConfigs.DEVICE_CHANGE_NODE_CARD,
  },
  ServiceNode: {
    header: EventConfigs.SERVICE_NODE_HEADER,
    card: EventConfigs.SERVICE_NODE_CARD,
  },
  AccountNode: {
    header: EventConfigs.ACCOUNT_NODE_HEADER,
    card: EventConfigs.ACCOUNT_NODE_CARD,
  },
  AccountGroupNode: {
    header: EventConfigs.ACCOUNT_GROUP_NODE_HEADER,
    card: EventConfigs.ACCOUNT_GROUP_NODE_CARD,
  },
  AttackNode: {
    header: EventConfigs.ATTACK_NODE_HEADER,
    card: EventConfigs.ATTACK_NODE_CARD,
  },
}

export function getEventHeaderConfig(eventType: EventNodeType) {
  return EVENT_NODE_CONFIG_MAP[eventType].header
}

export function getEventCardConfig(eventType: EventNodeType) {
  return EVENT_NODE_CONFIG_MAP[eventType].card
}
