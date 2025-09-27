// RegisterCenter.tsx
import { NodeTypeMap } from "@/components/graph/interface";
import processNodeConfig from "@/components/graph/node/ProcessNodeConfig";
import fileNodeConfig from "@/components/graph/node/FileNodeConfig";
import netNodeConfig from "@/components/graph/node/NetNodeConfig";
import dnsNodeConfig from "@/components/graph/node/DnsNodeConfig";
import volumeNodeConfig from "@/components/graph/node/VolumeNodeConfig";
import fileStreamNodeConfig from "@/components/graph/node/FileStreamNodeConfig";
import bitsJobNodeConfig from "@/components/graph/node/BitsJobNodeConfig";
import taskNodeConfig from "@/components/graph/node/TaskNodeConfig";
import dllImageNodeConfig from "@/components/graph/node/DllImageNodeConfig";
import driverImageNodeConfig from "@/components/graph/node/DriverImageNodeConfig";
import endecryptNodeConfig from "@/components/graph/node/EnDecryptNodeConfig";
import eventNodeConfig from "@/components/graph/node/EventNodeConfig";
import fileMappingNodeConfig from "@/components/graph/node/FileMappingNodeConfig"; 
import mailSlotNodeConfig from "@/components/graph/node/MailSlotNodeConfig";
import mbrNodeConfig from "@/components/graph/node/MbrNodeConfig";
import pipeNodeConfig from "@/components/graph/node/PipeNodeConfig";
import powershellNodeConfig from "@/components/graph/node/PowershellNodeConfig";
import regKeyNodeConfig from "@/components/graph/node/RegKeyNodeConfig";
import regValueNodeConfig from "@/components/graph/node/RegValueNodeConfig";
import credentialsNodeConfig from "@/components/graph/node/CredentialsNodeConfig";
import impersonationTokenNodeConfig from "@/components/graph/node/ImpersonationTokenNodeConfig";
import messageNodeConfig from "@/components/graph/node/MessageNodeConfig";
import urlNodeConfig from "@/components/graph/node/UrlNodeConfig";
import wmiClassNodeConfig from "@/components/graph/node/WmiClassNodeConfig";
import wmiQueryNodeConfig from "@/components/graph/node/WmiQueryNodeConfig";
import wmiExecuteNodeConfig from "@/components/graph/node/WmiExecuteNodeConfig";
import wmiConsumerNodeConfig from "@/components/graph/node/WmiConsumerNodeConfig";
import wmiFilterNodeConfig from "@/components/graph/node/WmiFilterNodeConfig";
import agentNodeConfig from "@/components/graph/node/AgentNodeConfig";
import deviceChangeNodeConfig from "@/components/graph/node/DeviceChangeNodeConfig";
import serviceNodeConfig from "@/components/graph/node/ServiceNodeConfig";
import accountGroupNodeConfig from "@/components/graph/node/AccountGroupNodeConfig";
import accountNodeConfig from "@/components/graph/node/AccountNodeConfig";
import attackNodeConfig from "@/components/graph/node/AttackNodeConfig";

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
