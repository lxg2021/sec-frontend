// RegisterCenter.tsx
import processNodeConfig from "@/components/graph/node/ProcessNodeConfig";
import fileNodeConfig from "@/components/graph/node/FileNodeConfig";
import { NodeTypeMap } from "@/components/graph/interface";

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
registerNode("process", processNodeConfig);
registerNode("file", fileNodeConfig);

export default nodeRegistry;
