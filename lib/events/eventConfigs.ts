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
  deviceChange: {
    header: EventConfigs.DEVICE_CHANGE_HEADER,
    card: EventConfigs.DEVICE_CHANGE_CARD,
  },
  driverImageLoad: {
    header: EventConfigs.DRIVER_IMAGE_LOAD_HEADER,
    card: EventConfigs.DRIVER_IMAGE_LOAD_CARD,
  },
  dllImageLoad: {
    header: EventConfigs.DLL_IMAGE_LOAD_HEADER,
    card: EventConfigs.DLL_IMAGE_LOAD_CARD,
  },
  taskCreate: {
    header: EventConfigs.TASK_CREATE_HEADER,
    card: EventConfigs.TASK_CREATE_CARD,
  },
  taskDelete: {
    header: EventConfigs.TASK_DELETE_HEADER,
    card: EventConfigs.TASK_DELETE_CARD,
  },
  wmiQuery: {
    header: EventConfigs.WMI_QUERY_HEADER,
    card: EventConfigs.WMI_QUERY_CARD,
  },
  wmiCreateClass: {
    header: EventConfigs.WMI_CREATE_CLASS_HEADER,
    card: EventConfigs.WMI_CREATE_CLASS_CARD,
  },
  wmiFilter: {
    header: EventConfigs.WMI_FILTER_HEADER,
    card: EventConfigs.WMI_FILTER_CARD,
  },
  wmiConsumer: {
    header: EventConfigs.WMI_CONSUMER_HEADER,
    card: EventConfigs.WMI_CONSUMER_CARD,
  },
  wmiBinding: {
    header: EventConfigs.WMI_BINDING_HEADER,
    card: EventConfigs.WMI_BINDING_CARD,
  },
  wmiExecute: {
    header: EventConfigs.WMI_EXECUTE_HEADER,
    card: EventConfigs.WMI_EXECUTE_CARD,
  },
  bitsCreateJob: {
    header: EventConfigs.BITS_CREATE_JOB_HEADER,
    card: EventConfigs.BITS_CREATE_JOB_CARD,
  },
  bitsJobAddFile: {
    header: EventConfigs.BITS_JOB_ADD_FILE_HEADER,
    card: EventConfigs.BITS_JOB_ADD_FILE_CARD,
  },
  bitsJobChangeState: {
    header: EventConfigs.BITS_JOB_CHANGE_STATE_HEADER,
    card: EventConfigs.BITS_JOB_CHANGE_STATE_CARD,
  },
  windowsMessageHook: {
    header: EventConfigs.WINDOWS_MESSAGE_HOOK_HEADER,
    card: EventConfigs.WINDOWS_MESSAGE_HOOK_CARD,
  },
  encryptDecrypt: {
    header: EventConfigs.ENCRYPT_DECRYPT_HEADER,
    card: EventConfigs.ENCRYPT_DECRYPT_CARD,
  },
  tokenAdjustPrivilege: {
    header: EventConfigs.TOKEN_ADJUST_PRIVILEGE_HEADER,
    card: EventConfigs.TOKEN_ADJUST_PRIVILEGE_CARD,
  },
  tokenImpersonation: {
    header: EventConfigs.TOKEN_IMPERSONATION_HEADER,
    card: EventConfigs.TOKEN_IMPERSONATION_CARD,
  },
  createProcessSetToken: {
    header: EventConfigs.CREATE_PROCESS_SET_TOKEN_HEADER,
    card: EventConfigs.CREATE_PROCESS_SET_TOKEN_CARD,
  },
  stealingCredentials: {
    header: EventConfigs.STEALING_CREDENTIALS_HEADER,
    card: EventConfigs.STEALING_CREDENTIALS_CARD,
  },
  fileCreate: {
    header: EventConfigs.FILE_CREATE_HEADER,
    card: EventConfigs.FILE_CREATE_CARD,
  },
  fileDelete: {
    header: EventConfigs.FILE_DELETE_HEADER,
    card: EventConfigs.FILE_DELETE_CARD,
  },
  fileChangeAttributes: {
    header: EventConfigs.FILE_CHANGE_ATTRIBUTES_HEADER,
    card: EventConfigs.FILE_CHANGE_ATTRIBUTES_CARD,
  },
  fileRename: {
    header: EventConfigs.FILE_RENAME_HEADER,
    card: EventConfigs.FILE_RENAME_CARD,
  },
  fileMove: {
    header: EventConfigs.FILE_MOVE_HEADER,
    card: EventConfigs.FILE_MOVE_CARD,
  },
  fileRead: {
    header: EventConfigs.FILE_READ_HEADER,
    card: EventConfigs.FILE_READ_CARD,
  },
  fileWrite: {
    header: EventConfigs.FILE_WRITE_HEADER,
    card: EventConfigs.FILE_WRITE_CARD,
  },
  fileSetEa: {
    header: EventConfigs.FILE_SET_EA_HEADER,
    card: EventConfigs.FILE_SET_EA_CARD,
  },
  fileStreamCreate: {
    header: EventConfigs.FILE_STREAM_CREATE_HEADER,
    card: EventConfigs.FILE_STREAM_CREATE_CARD,
  },
  fileStreamDelete: {
    header: EventConfigs.FILE_STREAM_DELETE_HEADER,
    card: EventConfigs.FILE_STREAM_DELETE_CARD,
  },
  accessVolume: {
    header: EventConfigs.ACCESS_VOLUME_HEADER,
    card: EventConfigs.ACCESS_VOLUME_CARD,
  },
  powershell: {
    header: EventConfigs.POWERSHELL_HEADER,
    card: EventConfigs.POWERSHELL_CARD,
  },
  regKeyCreate: {
    header: EventConfigs.REGKEY_CREATE_HEADER,
    card: EventConfigs.REGKEY_CREATE_CARD,
  },
  regKeyRename: {
    header: EventConfigs.REGKEY_RENAME_HEADER,
    card: EventConfigs.REGKEY_RENAME_CARD,
  },
  regKeyDelete: {
    header: EventConfigs.REGKEY_DELETE_HEADER,
    card: EventConfigs.REGKEY_DELETE_CARD,
  },
  regValueSet: {
    header: EventConfigs.REGVALUE_SET_HEADER,
    card: EventConfigs.REGVALUE_SET_CARD,
  },
  regValueDelete: {
    header: EventConfigs.REGVALUE_DELETE_HEADER,
    card: EventConfigs.REGVALUE_DELETE_CARD,
  },
  regValueQuery: {  
    header: EventConfigs.REGVALUE_QUERY_HEADER,
    card: EventConfigs.REGVALUE_QUERY_CARD,
  },
  fileMappingCreate: {
    header: EventConfigs.FILEMAPPING_CREATE_HEADER,
    card: EventConfigs.FILEMAPPING_CREATE_CARD,
  },
  fileMappingConnect: {
    header: EventConfigs.FILEMAPPING_CONNECT_HEADER,
    card: EventConfigs.FILEMAPPING_CONNECT_CARD,
  },
  pipeCreate: {
    header: EventConfigs.PIPE_CREATE_HEADER,
    card: EventConfigs.PIPE_CREATE_CARD,
  },
  pipeConnect: {
    header: EventConfigs.PIPE_CONNECT_HEADER,
    card: EventConfigs.PIPE_CONNECT_CARD,
  },
  mailSlotCreate: {
    header: EventConfigs.MAILSLOT_CREATE_HEADER,
    card: EventConfigs.MAILSLOT_CREATE_CARD,
  },
  mailSlotConnect: {
    header: EventConfigs.MAILSLOT_CONNECT_HEADER,
    card: EventConfigs.MAILSLOT_CONNECT_CARD,
  },
  eventCreate: {
    header: EventConfigs.EVENT_CREATE_HEADER,
    card: EventConfigs.EVENT_CREATE_CARD,
  },
  eventOpen: {
    header: EventConfigs.EVENT_OPEN_HEADER,
    card: EventConfigs.EVENT_OPEN_CARD,
  },
  mbr: {
    header: EventConfigs.MBR_HEADER,
    card: EventConfigs.MBR_CARD,
  },
  createAccount: {
    header: EventConfigs.CREATE_ACCOUNT_HEADER,
    card: EventConfigs.CREATE_ACCOUNT_CARD,
  },
  enableAccount: {
    header: EventConfigs.ENABLE_ACCOUNT_HEADER,
    card: EventConfigs.ENABLE_ACCOUNT_CARD,
  },
  resetAccountPassword: {
    header: EventConfigs.RESET_ACCOUNT_PASSWORD_HEADER,
    card: EventConfigs.RESET_ACCOUNT_PASSWORD_CARD,
  },
  disableAccount: {
    header: EventConfigs.DISABLE_ACCOUNT_HEADER,
    card: EventConfigs.DISABLE_ACCOUNT_CARD,
  },
  deleteAccount: {
    header: EventConfigs.DELETE_ACCOUNT_HEADER,
    card: EventConfigs.DELETE_ACCOUNT_CARD,
  },
  modifyAccount: {
    header: EventConfigs.MODIFY_ACCOUNT_HEADER,
    card: EventConfigs.MODIFY_ACCOUNT_CARD,  
  },
  addAccountGroup: {
    header: EventConfigs.ADD_ACCOUNTGROUP_HEADER,
    card: EventConfigs.ADD_ACCOUNTGROUP_CARD,   
  },
  deleteAccountGroup: {
    header: EventConfigs.DELETE_ACCOUNTGROUP_HEADER,
    card: EventConfigs.DELETE_ACCOUNTGROUP_CARD,   
  },
  createGroup: {
    header: EventConfigs.CREATE_GROUP_HEADER,
    card: EventConfigs.CREATE_GROUP_CARD,      
  },
  deleteGroup: {
    header: EventConfigs.DELETE_GROUP_HEADER,
    card: EventConfigs.DELETE_GROUP_CARD,  
  },
}

export function getEventHeaderConfig(eventType: EventType) {
  return EVENT_CONFIG_MAP[eventType].header
}

export function getEventCardConfig(eventType: EventType) {
  return EVENT_CONFIG_MAP[eventType].card
}
