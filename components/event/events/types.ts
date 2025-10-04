"use client"

import type { ProcessNode } from "@/components/graph/node/ProcessNodeConfig";
import type { FileNode } from "@/components/graph//node/FileNodeConfig";
import type { NetNode } from "@/components/graph/node/NetNodeConfig";
import type { DnsNode } from "@/components/graph/node/DnsNodeConfig";
import type { VolumeNode } from "@/components/graph/node/VolumeNodeConfig";
import type { FileStreamNode } from "@/components/graph/node/FileStreamNodeConfig";
import type { BitsJobNode, JobFile } from "@/components/graph/node/BitsJobNodeConfig";
import type { TaskNode, TaskImage, TaskTrigger } from "@/components/graph/node/TaskNodeConfig";
import type { DllImageNode } from "@/components/graph/node/DllImageNodeConfig";
import type { DriverImageNode } from "@/components/graph/node/DriverImageNodeConfig";
import type { EnDecryptNode } from "@/components/graph/node/EnDecryptNodeConfig";
import type { EventNode } from "@/components/graph/node/EventNodeConfig";
import type { FileMappingNode } from "@/components/graph/node/FileMappingNodeConfig";
import type { MailSlotNode } from "@/components/graph/node/MailSlotNodeConfig";
import type { MbrNode } from "@/components/graph/node/MbrNodeConfig";
import type { PipeNode } from "@/components/graph/node/PipeNodeConfig";
import type { PowershellNode } from "@/components/graph/node/PowershellNodeConfig";
import type { RegKeyNode } from "@/components/graph/node/RegKeyNodeConfig";
import type { RegValueNode } from "@/components/graph/node/RegValueNodeConfig";
import type { CredentialsNode } from "@/components/graph/node/CredentialsNodeConfig";
import type { ImpersonationTokenNode, Token } from "@/components/graph/node/ImpersonationTokenNodeConfig";
import type { MessageNode } from "@/components/graph/node/MessageNodeConfig";
import type { UrlNode } from "@/components/graph/node/UrlNodeConfig";
import type { WmiClassNode, ClassAttributeItem } from "@/components/graph/node/WmiClassNodeConfig";
import type { WmiQueryNode } from "@/components/graph/node/WmiQueryNodeConfig";
import type { WmiExecuteNode, ParameterItem } from "@/components/graph/node/WmiExecuteNodeConfig";
import type { WmiConsumerNode } from "@/components/graph/node/WmiConsumerNodeConfig";
import type { WmiFilterNode } from "@/components/graph/node/WmiFilterNodeConfig";
import type { AgentNode } from "@/components/graph/node/AgentNodeConfig";
import type { DeviceChangeNode } from "@/components/graph/node/DeviceChangeNodeConfig";
import type { ServiceNode } from "@/components/graph/node/ServiceNodeConfig";
import type { AccountGroupNode } from "@/components/graph/node/AccountGroupNodeConfig";
import type { AccountNode } from "@/components/graph/node/AccountNodeConfig";
import type { AttackNode } from "@/components/graph/node/AttackNodeConfig";


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
