import type {
  AccessAction,
  AccessControlPolicyDraft,
  AccessPolicyType,
  RegistryTargetKind,
  AccessSubjectDraft,
} from "./access-control-types"

export interface AccessPolicyTypeOption {
  value: AccessPolicyType
  title: string
  description: string
}

export interface AccessActionOption {
  value: AccessAction
  label: string
}

export const ACCESS_ACTIONS: Record<Exclude<AccessPolicyType, "network">, AccessAction[]> = {
  file: ["new", "delete", "rename", "move", "write", "set", "open", "read", "execute"],
  registry: ["new", "delete", "set", "open", "query", "rename", "enum"],
  process: ["create", "terminate", "open", "allocate", "write", "protect"],
}

export const REGISTRY_ACTIONS: Record<RegistryTargetKind, AccessAction[]> = {
  key: ["new", "delete", "open", "query", "rename", "enum"],
  value: ["delete", "set", "query", "enum"],
}

export function getAccessActions(
  type: Exclude<AccessPolicyType, "network">,
  registryTargetKind: RegistryTargetKind,
) {
  return type === "registry" ? REGISTRY_ACTIONS[registryTargetKind] : ACCESS_ACTIONS[type]
}

export function createEmptySubject(): AccessSubjectDraft {
  return {
    id: crypto.randomUUID(),
    type: "process",
    paths: [],
    hashes: [],
    accounts: [],
  }
}

export function createInitialAccessControlDraft(): AccessControlPolicyDraft {
  return {
    type: "file",
    name: "",
    version: "1.0.0",
    priority: 150,
    subjects: [createEmptySubject()],
    exceptions: [],
    objectPaths: [],
    objectHashes: [],
    registryTargetKind: "key",
    registryValueNames: [],
    rules: [],
    network: {
      direction: "in",
      action: "block",
      profile: "any",
      protocol: "tcp",
      localPort: "any",
      remotePort: "any",
      localAddress: "any",
      remoteAddress: "any",
      programPath: "*",
      programMd5: "",
    },
  }
}
