"use client"

export interface ProcessCreateData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  UserID: string
  Session: number
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessCommandLine: string
  ProcessMD5: string
  ParentProcessID: number
  ParentProcessImage: string
  ParentProcessCommandLine: string
  ParentProcessMD5: string
  ProcessGUID: string
  ParentProcessGUID: string
  OrgFileName: string
  DriverType: number
  Signature: number
  SignVendor: string
  RTLO: number
  ShowWindowFlag: number
  UniqueID: string
}

export interface ProcessExitData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  SelfExit: number
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  OperatorProcessID: number
  OperatorProcessImage: string
  OperatorProcessMD5: string
  ProcessGuid: string
  OperatorProcessGuid: string
  UniqueID: string
}

export interface ProcessAccessData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  GrantedAccess: number
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  OperatorProcessID: number
  OperatorProcessName: string
  OperatorProcessImage: string
  OperatorProcessMD5: string
  CallTrace: string
  ProcessGuid: string
  OperatorProcessGuid: string
  UniqueID: string
}

export interface RemoteThreadData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ThreadID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  OperatorProcessID: number
  OperatorProcessImage: string
  OperatorProcessMD5: string
  ProcessGuid: string
  OperatorProcessGuid: string
  UniqueID: string
}

export interface CrossMemoryExecuteData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  OperatorProcessID: number
  OperatorProcessName: string
  OperatorProcessImage: string
  OperatorProcessMD5: string
  ProcessGuid: string
  OperatorProcessGuid: string
  Address: string
  PageProtect: number
  UniqueID: string
}

export interface DnsData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  Domain: string
  IPS: string
  ProcessGuid: string
  UniqueID: string
}

export interface NetCommunicateData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  Protocol: string
  Direction: string
  SourceIsIPv6: number
  SourceIP: string
  SourcePort: number
  DestinationIsIPv6: number
  DestinationIP: string
  DestinationPort: number
  ProcessGuid: string
  UniqueID: string
}

export interface ServiceCreateData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServiceName: string
  DisplayName: string
  ServiceType: number
  StartType: number
  ServiceBinaryMD5: string
  ServiceStartName: string
  ServiceBinaryPathName: string
  ProcessGuid: string
  UniqueID: string
}

export interface ServiceStartData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServiceName: string
  DisplayName: string
  ServiceType: number
  StartType: number
  ServiceBinaryMD5: string
  ServiceStartName: string
  ServiceBinaryPathName: string
  ServiceStartArgs: string | null
  ProcessGuid: string
  UniqueID: string
}

export interface ServiceDeleteData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServiceName: string
  DisplayName: string
  ServiceType: number
  StartType: number
  ServiceBinaryMD5: string
  ServiceStartName: string
  ServiceBinaryPathName: string
  ServiceStartArgs: string | null
  ProcessGuid: string
  UniqueID: string
}

export interface ServiceStopData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServiceName: string
  DisplayName: string
  ServiceType: number
  StartType: number
  ServiceBinaryMD5: string
  ServiceStartName: string
  ServiceBinaryPathName: string
  ServiceControlCode: string
  ProcessGuid: string
  UniqueID: string
}

export interface ServiceConfigData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServiceName: string

  OrgServiceType: number
  NewServiceType: number
  OrgStartType: number
  NewStartType: number
  OrgServiceBinaryPathName: string
  OrgServiceBinaryMD5: string
  NewServiceBinaryPathName: string
  NewServiceBinaryMD5: string
  OrgDisplayName: string
  NewDisplayName: string
  OrgServiceStartName: string
  NewServiceStartName: string

  ProcessGuid: string
  UniqueID: string
}

export interface ServicePauseData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServiceName: string
  DisplayName: string
  ServiceType: number
  StartType: number
  ServiceBinaryMD5: string
  ServiceStartName: string
  ServiceBinaryPathName: string
  ServiceControlCode: string
  ProcessGuid: string
  UniqueID: string
}

export interface DeviceChangeData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  DeviceGUID: string
  HID: string
  DeviceType: number
  DeviceDescription: string
  DeviceFlag: number
  UniqueID: string
}

export interface DriverImageLoadData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  Image: string
  ImageMD5: string
  ProcessID: number
  ProcessName: string
  Signature: number
  SignVendor: string
  ProcessGuid: string
  UniqueID: string
}

export interface DllImageLoadData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  Image: string
  ImageMD5: string
  Signature: number
  SignVendor: string
  ProcessGuid: string
  OrgFileName: string
  UniqueID: string
}

export interface TaskImageItem {
  image: string
  imagemd5: string
  parameters: string
}

export interface TaskTriggerItem {
  endboundry: string
  executiontimelimit: string
  startboundary: string
  trigerid: string
  trigertype: string
}

export interface TaskCreateData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  Domain: string
  User: string
  ServerName: string | null
  TaskName: string
  TaskPath: string
  TaskImage: TaskImageItem[]
  TaskTrigger: TaskTriggerItem[]
  ProcessGuid: string
  UniqueID: string
}

export interface TaskDeleteData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  TaskName: string
  TaskPath: string
  ProcessGuid: string
  UniqueID: string
}

export interface WmiQueryData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServerName: string | null
  User: string | null
  Namespace: string
  Query: string
  QueryLanguage: string
  ProcessGuid: string
  UniqueID: string
}

export interface WmiClassAttribute {
  attrname: string
  attrvalue: string
  isbase64: boolean
}

export interface WmiCreateClassData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServerName: string | null
  User: string | null
  Namespace: string | null
  ClassName: string
  ClassPath: string | null
  SuperClassName: string | null
  ClassAttributes: WmiClassAttribute[]
  ProcessGuid: string
  UniqueID: string
}

export interface WmiFilterData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServerName: string | null
  User: string | null
  Password: string | null
  Namespace: string
  EventFilterName: string
  EventFilterAccess: string | null
  EventFilterClass: string
  Query: string
  QueryLanguage: string
  ProcessGuid: string
  UniqueID: string
}

export interface WmiConsumerData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServerName: string | null
  User: string | null
  Namespace: string
  Class: string
  EventConsumerName: string
  EventConsumerType: number
  EventConsumerTypeDescription: string
  EventConsumerContext: {
    scriptfilemd5: string
    scriptfilename: string
    scripttext: string
    scriptingengine: string
  }
  ProcessGuid: string
  UniqueID: string
}

export interface WmiBindingEventData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServerName: string
  User: string | null
  Namespace: string
  EventConsumerName: string
  EventFilterName: string
  ProcessGuid: string
  UniqueID: string
}

export interface MethodParameter {
  parametername: string
  parametervalue: string
}

export interface WmiExecuteData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  ServerName: string | null
  User: string | null
  Namespace: string
  Class: string
  MethodName: string
  MethodParameters: MethodParameter[]
  ProcessGuid: string
  UniqueID: string
}

export interface BitsCreateJobData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  JobId: string
  JobType: number
  JobTypeDesc: string
  JobName: string
  ProcessGuid: string
  UniqueID: string
}

export interface BitsJobAddFileData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  JobId: string
  JobType: number
  JobTypeDesc: string
  JobName: string
  JobFileContents: Array<{
    localname: string
    remotename: string
  }>
  ProcessGuid: string
  UniqueID: string
}

export interface BitsJobChangeStateData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  JobId: string
  JobType: number
  JobTypeDesc: string
  JobName: string
  JobStatus: number
  JobStatusDesc: string
  ProcessGuid: string
  UniqueID: string
}

export interface WindowsMessageHookData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  HookType: number
  HookTypeDescription: string
  MessageHookModule: string
  ProcessGuid: string
  UniqueID: string
}

export interface EncryptDecryptData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  CryptFlag: number
  ProcessGuid: string
  UniqueID: string
}

export interface TokenAdjustPrivilegeData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  Privileges: string
  TokenFlag: number
  Self: number
  TargetProcessID: number
  TargetProcessImage: string
  TargetProcessMD5: string
  TargetProcessName: string
  ProcessGuid: string
  TargetProcessGuid: string
  UniqueID: string
}

export interface TokenImpersonationData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  OperatorToken: {
    accountname: string
    impersonationlevel: string
    integritylevel: string
    privilege: string
    sessionid: number
    sid: string
    tokentype: string
  }
  TargetToken: {
    accountname: string
    impersonationlevel?: string
    integritylevel: string
    privilege: string
    sessionid: number
    sid: string
    tokentype: string
  }
  TokenFlag: number
  ProcessGuid: string
  UniqueID: string
}

export interface CreateProcessSetTokenData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  OperatorToken?: {
    accountname: string
    impersonationlevel?: string
    integritylevel?: string
    privilege: string
    sessionid: number
    sid: string
    tokentype: string
  }
  TargetToken?: {
    accountname: string
    impersonationlevel?: string
    integritylevel?: string
    privilege: string
    sessionid: number
    sid: string
    tokentype: string
  }
  TokenFlag: number
  ParentProcessID: number
  ParentProcessImage: string
  ParentProcessMD5: string
  ParentProcessName: string
  ProcessGuid: string
  ParentProcessGuid: string
  UniqueID: string
}

export interface StealingCredentialsData {
  EventID: number
  BootTime: string
  AgentID: string
  Time: string
  ProcessID: number
  ProcessName: string
  ProcessImage: string
  ProcessMD5: string
  CredType: number
  CredDesc: string
  ProcessGuid: string
  UniqueID: string
}


export type AllEventData =
  | ProcessCreateData
  | ProcessExitData
  | ProcessAccessData
  | RemoteThreadData
  | CrossMemoryExecuteData
  | DnsData
  | NetCommunicateData
  | ServiceCreateData
  | ServiceStartData
  | ServiceDeleteData
  | ServiceStopData
  | ServiceConfigData
  | ServicePauseData
  | DeviceChangeData
  | DriverImageLoadData
  | DllImageLoadData
  | TaskCreateData
  | TaskImageItem
  | TaskTriggerItem
  | TaskDeleteData
  | WmiQueryData
  | WmiCreateClassData
  | WmiFilterData
  | WmiConsumerData
  | WmiBindingEventData
  | WmiExecuteData
  | BitsCreateJobData
  | BitsJobAddFileData
  | BitsJobChangeStateData
  | WindowsMessageHookData
  | EncryptDecryptData
  | TokenAdjustPrivilegeData
  | TokenImpersonationData
  | CreateProcessSetTokenData
  | StealingCredentialsData

export type EventKey = keyof AllEventData
