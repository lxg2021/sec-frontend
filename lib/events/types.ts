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

export type EventKey = keyof AllEventData
