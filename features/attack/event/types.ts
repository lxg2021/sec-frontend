"use client"

import type { ProcessNode } from "@/features/attack/graph/node/process-node-config";
import type { FileNode } from "@/features/attack/graph/node/file-node-config";
import type { NetNode } from "@/features/attack/graph/node/net-node-config";
import type { DnsNode } from "@/features/attack/graph/node/dns-node-config";
import type { VolumeNode } from "@/features/attack/graph/node/volume-node-config";
import type { FileStreamNode } from "@/features/attack/graph/node/file-stream-node-config";
import type { BitsJobNode, JobFile } from "@/features/attack/graph/node/bits-job-node-config";
import type { TaskNode, TaskImage, TaskTrigger } from "@/features/attack/graph/node/task-node-config";
import type { DllImageNode } from "@/features/attack/graph/node/dll-image-node-config";
import type { DriverImageNode } from "@/features/attack/graph/node/driver-image-node-config";
import type { EnDecryptNode } from "@/features/attack/graph/node/en-decrypt-node-config";
import type { EventNode } from "@/features/attack/graph/node/event-node-config";
import type { FileMappingNode } from "@/features/attack/graph/node/file-mapping-node-config";
import type { MailSlotNode } from "@/features/attack/graph/node/mail-slot-node-config";
import type { MbrNode } from "@/features/attack/graph/node/mbr-node-config";
import type { PipeNode } from "@/features/attack/graph/node/pipe-node-config";
import type { PowershellNode } from "@/features/attack/graph/node/powershell-node-config";
import type { RegKeyNode } from "@/features/attack/graph/node/reg-key-node-config";
import type { RegValueNode } from "@/features/attack/graph/node/reg-value-node-config";
import type { CredentialsNode } from "@/features/attack/graph/node/credentials-node-config";
import type { ImpersonationTokenNode, Token } from "@/features/attack/graph/node/impersonation-token-node-config";
import type { MessageNode } from "@/features/attack/graph/node/message-node-config";
import type { UrlNode } from "@/features/attack/graph/node/url-node-config";
import type { WmiClassNode, ClassAttributeItem } from "@/features/attack/graph/node/wmi-class-node-config";
import type { WmiQueryNode } from "@/features/attack/graph/node/wmi-query-node-config";
import type { WmiExecuteNode, ParameterItem } from "@/features/attack/graph/node/wmi-execute-node-config";
import type { WmiConsumerNode } from "@/features/attack/graph/node/wmi-consumer-node-config";
import type { WmiFilterNode } from "@/features/attack/graph/node/wmi-filter-node-config";
import type { AgentNode } from "@/features/attack/graph/node/agent-node-config";
import type { DeviceChangeNode } from "@/features/attack/graph/node/device-change-node-config";
import type { ServiceNode } from "@/features/attack/graph/node/service-node-config";
import type { AccountGroupNode } from "@/features/attack/graph/node/account-group-node-config";
import type { AccountNode } from "@/features/attack/graph/node/account-node-config";
import type { AttackNode } from "@/features/attack/graph/node/attack-node-config";


export type AllEventNode =
  | ProcessNode
  | FileNode
  | NetNode
  | DnsNode
  | VolumeNode
  | FileStreamNode
  | BitsJobNode
  | TaskNode
  | DllImageNode
  | DriverImageNode
  | EnDecryptNode
  | EventNode
  | FileMappingNode
  | MailSlotNode
  | MbrNode
  | PipeNode
  | PowershellNode
  | RegKeyNode
  | RegValueNode
  | CredentialsNode
  | ImpersonationTokenNode
  | MessageNode
  | UrlNode
  | WmiClassNode
  | WmiQueryNode
  | WmiExecuteNode
  | WmiConsumerNode
  | WmiFilterNode
  | AgentNode
  | DeviceChangeNode
  | ServiceNode
  | AccountGroupNode
  | AccountNode
  | AttackNode

export type EventKey = keyof AllEventNode
