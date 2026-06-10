export const DGRAPH_ENTITY_NODE_PRESENTATION_KIND_COUNT = 25;

export type AttackGraphEntityType =
  | "Account"
  | "AccountGroup"
  | "Bits"
  | "CredentialTheft"
  | "Crypto"
  | "Device"
  | "DnsName"
  | "File"
  | "FileMapping"
  | "FileStream"
  | "Host"
  | "HostRef"
  | "MailSlot"
  | "Mbr"
  | "MessageHook"
  | "NamedEvent"
  | "NamedPipe"
  | "NetAddress"
  | "NetEndpoint"
  | "PowerShellExecution"
  | "Process"
  | "RegistryKey"
  | "RegistryValue"
  | "ScheduledJob"
  | "Service"
  | "Task"
  | "TokenImpersonation"
  | "URLResource"
  | "Volume"
  | "WmiClass"
  | "WmiConsumer"
  | "WmiExecute"
  | "WmiFilter"
  | "WmiQuery";

export type AttackGraphCaseEntityType =
  | "AttackCase"
  | "AttackCaseGroup"
  | "AttackCaseInstance"
  | "AttackCaseEvidence";

export type AttackGraphBackendEntityType =
  | AttackGraphEntityType
  | AttackGraphCaseEntityType;

export type AttackGraphEntityPresentationKind =
  | "account"
  | "bits"
  | "credential-theft"
  | "crypto"
  | "device"
  | "dns-name"
  | "file"
  | "file-stream"
  | "host"
  | "host-ref"
  | "ipc-object"
  | "mbr"
  | "message-hook"
  | "net-address"
  | "net-endpoint"
  | "powershell"
  | "process"
  | "registry"
  | "scheduled-job"
  | "service"
  | "task"
  | "token-impersonation"
  | "url-resource"
  | "volume"
  | "wmi";

export type AttackGraphNodePresentationKind =
  | AttackGraphEntityPresentationKind
  | "case"
  | "case-group"
  | "case-instance"
  | "evidence"
  | "unknown";

export const ENTITY_TYPE_TO_PRESENTATION_KIND: Record<
  AttackGraphEntityType,
  AttackGraphEntityPresentationKind
> = {
  Account: "account",
  AccountGroup: "account",
  Bits: "bits",
  CredentialTheft: "credential-theft",
  Crypto: "crypto",
  Device: "device",
  DnsName: "dns-name",
  File: "file",
  FileMapping: "ipc-object",
  FileStream: "file-stream",
  Host: "host",
  HostRef: "host-ref",
  MailSlot: "ipc-object",
  Mbr: "mbr",
  MessageHook: "message-hook",
  NamedEvent: "ipc-object",
  NamedPipe: "ipc-object",
  NetAddress: "net-address",
  NetEndpoint: "net-endpoint",
  PowerShellExecution: "powershell",
  Process: "process",
  RegistryKey: "registry",
  RegistryValue: "registry",
  ScheduledJob: "scheduled-job",
  Service: "service",
  Task: "task",
  TokenImpersonation: "token-impersonation",
  URLResource: "url-resource",
  Volume: "volume",
  WmiClass: "wmi",
  WmiConsumer: "wmi",
  WmiExecute: "wmi",
  WmiFilter: "wmi",
  WmiQuery: "wmi",
};

export const CASE_ENTITY_TYPE_TO_PRESENTATION_KIND: Record<
  AttackGraphCaseEntityType,
  AttackGraphNodePresentationKind
> = {
  AttackCase: "case",
  AttackCaseGroup: "case-group",
  AttackCaseInstance: "case-instance",
  AttackCaseEvidence: "evidence",
};

export function getAttackGraphNodePresentationKind(
  entityType: string | null | undefined,
): AttackGraphNodePresentationKind {
  const normalized = String(entityType ?? "").trim();
  if (normalized in ENTITY_TYPE_TO_PRESENTATION_KIND) {
    return ENTITY_TYPE_TO_PRESENTATION_KIND[normalized as AttackGraphEntityType];
  }
  if (normalized in CASE_ENTITY_TYPE_TO_PRESENTATION_KIND) {
    return CASE_ENTITY_TYPE_TO_PRESENTATION_KIND[
      normalized as AttackGraphCaseEntityType
    ];
  }
  return "unknown";
}

