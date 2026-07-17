export type AccessPolicyType = "file" | "registry" | "process" | "network"

export type AccessSubjectType = "windowsuser" | "windowsgroup" | "process"
export type AccessHashAlgorithm = "md5" | "sha1" | "sha256"
export type AccessRuleEffect = "allow" | "block" | "prompt"

export type FileAccessAction =
  | "new"
  | "delete"
  | "rename"
  | "move"
  | "write"
  | "set"
  | "open"
  | "read"
  | "execute"

export type RegistryAccessAction =
  | "new"
  | "delete"
  | "set"
  | "open"
  | "query"
  | "rename"
  | "enum"

export type ProcessAccessAction =
  | "create"
  | "terminate"
  | "open"
  | "allocate"
  | "write"
  | "protect"

export type AccessAction = FileAccessAction | RegistryAccessAction | ProcessAccessAction

export interface AccessHash {
  algo: AccessHashAlgorithm
  value: string
}

export interface AccessAccount {
  user_name?: string
  group_name?: string
  sid: string
}

export interface AccessSubjectDraft {
  id: string
  type: AccessSubjectType
  paths: string[]
  hashes: AccessHash[]
  accounts: AccessAccount[]
}

export interface AccessRuleDraft {
  id: string
  action: AccessAction
  effect: AccessRuleEffect
  audit: boolean
}

export interface NetworkPolicyDraft {
  direction: "in" | "out"
  action: "allow" | "block" | "bypass"
  profile: "domain" | "private" | "public" | "any"
  protocol: "tcp" | "udp" | "icmp" | "any"
  localPort: string
  remotePort: string
  localAddress: string
  remoteAddress: string
  programPath: string
  programMd5: string
}

export interface AccessControlPolicyDraft {
  type: AccessPolicyType
  name: string
  version: string
  priority: number
  subjects: AccessSubjectDraft[]
  exceptions: AccessSubjectDraft[]
  objectPaths: string[]
  objectHashes: AccessHash[]
  rules: AccessRuleDraft[]
  network: NetworkPolicyDraft
}

export interface CreatedAccessControlPolicy {
  objectId: string
  objectType: number
  name: string
  version: string
}

export interface AccessControlOperation {
  operationId: string
  planningStatus: string
  status: string
  outcome: string
  totalCount: number
  materializedCount: number
  pendingCount: number
  runningCount: number
  successCount: number
  failedCount: number
  uncertainCount: number
  skippedCount: number
  canceledCount: number
}

export interface AccessControlDispatchResult {
  policy: CreatedAccessControlPolicy
  operation: AccessControlOperation
}

export type AccessControlWizardStep = 1 | 2 | 3 | 4

