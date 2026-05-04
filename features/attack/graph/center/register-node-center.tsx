// RegisterCenter.tsx
import { NodeTypeMap } from "@/features/attack/graph/interface";
import processNodeConfig from "@/features/attack/graph/node/process-node-config";
import fileNodeConfig from "@/features/attack/graph/node/file-node-config";
import netNodeConfig from "@/features/attack/graph/node/net-node-config";
import dnsNodeConfig from "@/features/attack/graph/node/dns-node-config";
import volumeNodeConfig from "@/features/attack/graph/node/volume-node-config";
import fileStreamNodeConfig from "@/features/attack/graph/node/file-stream-node-config";
import bitsJobNodeConfig from "@/features/attack/graph/node/bits-job-node-config";
import taskNodeConfig from "@/features/attack/graph/node/task-node-config";
import dllImageNodeConfig from "@/features/attack/graph/node/dll-image-node-config";
import driverImageNodeConfig from "@/features/attack/graph/node/driver-image-node-config";
import endecryptNodeConfig from "@/features/attack/graph/node/en-decrypt-node-config";
import eventNodeConfig from "@/features/attack/graph/node/event-node-config";
import fileMappingNodeConfig from "@/features/attack/graph/node/file-mapping-node-config"; 
import mailSlotNodeConfig from "@/features/attack/graph/node/mail-slot-node-config";
import mbrNodeConfig from "@/features/attack/graph/node/mbr-node-config";
import pipeNodeConfig from "@/features/attack/graph/node/pipe-node-config";
import powershellNodeConfig from "@/features/attack/graph/node/powershell-node-config";
import regKeyNodeConfig from "@/features/attack/graph/node/reg-key-node-config";
import regValueNodeConfig from "@/features/attack/graph/node/reg-value-node-config";
import credentialsNodeConfig from "@/features/attack/graph/node/credentials-node-config";
import impersonationTokenNodeConfig from "@/features/attack/graph/node/impersonation-token-node-config";
import messageNodeConfig from "@/features/attack/graph/node/message-node-config";
import urlNodeConfig from "@/features/attack/graph/node/url-node-config";
import wmiClassNodeConfig from "@/features/attack/graph/node/wmi-class-node-config";
import wmiQueryNodeConfig from "@/features/attack/graph/node/wmi-query-node-config";
import wmiExecuteNodeConfig from "@/features/attack/graph/node/wmi-execute-node-config";
import wmiConsumerNodeConfig from "@/features/attack/graph/node/wmi-consumer-node-config";
import wmiFilterNodeConfig from "@/features/attack/graph/node/wmi-filter-node-config";
import agentNodeConfig from "@/features/attack/graph/node/agent-node-config";
import deviceChangeNodeConfig from "@/features/attack/graph/node/device-change-node-config";
import serviceNodeConfig from "@/features/attack/graph/node/service-node-config";
import accountGroupNodeConfig from "@/features/attack/graph/node/account-group-node-config";
import accountNodeConfig from "@/features/attack/graph/node/account-node-config";
import attackNodeConfig from "@/features/attack/graph/node/attack-node-config";

/** 节点注册中心 */
const nodeRegistry: NodeTypeMap<any> = {};

/** 注册节点 */
export function registerNode(type: string, config: any) {
  nodeRegistry[type] = config;
}

/** 获取所有注册节点 */
export function getNodeRegistry() {
  return nodeRegistry;
}

/** 立即注册默认节点 */
registerNode("ProcessNode", processNodeConfig);
registerNode("FileNode", fileNodeConfig);
registerNode("NetNode", netNodeConfig);
registerNode("DnsNode", dnsNodeConfig);
registerNode("VolumeNode", volumeNodeConfig);
registerNode("FileStreamNode", fileStreamNodeConfig);
registerNode("BitsJobNode", bitsJobNodeConfig);
registerNode("TaskNode", taskNodeConfig);
registerNode("DllImageNode", dllImageNodeConfig);
registerNode("DriverImageNode", driverImageNodeConfig);
registerNode("EnDecryptNode", endecryptNodeConfig);
registerNode("EventNode", eventNodeConfig);
registerNode("FileMappingNode", fileMappingNodeConfig);
registerNode("MailSlotNode", mailSlotNodeConfig);
registerNode("MbrNode", mbrNodeConfig);
registerNode("PipeNode", pipeNodeConfig);
registerNode("PowershellNode", powershellNodeConfig);
registerNode("RegKeyNode", regKeyNodeConfig);
registerNode("RegValueNode", regValueNodeConfig);
registerNode("CredentialsNode", credentialsNodeConfig);
registerNode("ImpersonationTokenNode", impersonationTokenNodeConfig);
registerNode("MessageNode", messageNodeConfig);
registerNode("UrlNode", urlNodeConfig);
registerNode("WmiClassNode", wmiClassNodeConfig);
registerNode("WmiQueryNode", wmiQueryNodeConfig);
registerNode("WmiExecuteNode", wmiExecuteNodeConfig);
registerNode("WmiConsumerNode", wmiConsumerNodeConfig);
registerNode("WmiFilterNode", wmiFilterNodeConfig);
registerNode("AgentNode", agentNodeConfig);
registerNode("DeviceChangeNode", deviceChangeNodeConfig);
registerNode("ServiceNode", serviceNodeConfig);
registerNode("AccountGroupNode", accountGroupNodeConfig);
registerNode("AccountNode", accountNodeConfig);
registerNode("AttackNode", attackNodeConfig);

export default nodeRegistry;
