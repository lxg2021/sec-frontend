export type HostSelectorNodeType = "company" | "department" | "group" | "host"

export interface HostSelectorBaseNode {
  id: string
  name: string
  type: HostSelectorNodeType
  parentId?: string
}

export interface HostSelectorGroupNode extends HostSelectorBaseNode {
  type: Exclude<HostSelectorNodeType, "host">
  children: HostSelectorTreeNode[]
  hostCount?: number
  directHostCount?: number
  descendantHostCount?: number
  isPseudo?: boolean
  fullPath?: string
}

export interface HostSelectorHostNode extends HostSelectorBaseNode {
  type: "host"
  children?: never
  hostname: string
  hostId: string
  ip: string
  os: string
  mac: string
  status: string
  cpu: string
  memory: string
  disk: string
  groupId?: string
  heartbeatTime?: number
}

export type HostSelectorTreeNode = HostSelectorGroupNode | HostSelectorHostNode

export type HostSelectorSelectionState = "checked" | "unchecked" | "indeterminate"

export type HostSelectorFlatNode = HostSelectorTreeNode & {
  level: number
  hasChildren: boolean
  isLastChild: boolean
  path: string[]
  isExpanded: boolean
}
