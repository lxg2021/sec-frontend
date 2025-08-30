// RegisterEdgeCenter.tsx
import { LinkConfig, EdgeTypeMap } from "@/components/graph/interface";
import createFileEdgeConfig from "@/components/graph/edge/CreateFileEdge";
import createProcessEdgeConfig from "@/components/graph/edge/CreateProcessEdge";

/** 边注册中心 */
const edgeRegistry: EdgeTypeMap<any> = {};

/** 注册边类型 */
export function registerEdge(type: string, config: LinkConfig<any>) {
  edgeRegistry[type] = config;
}

/** 获取所有注册的边类型 */
export function getEdgeRegistry(): EdgeTypeMap<any> {
  return edgeRegistry;
}

/** 默认注册 */
registerEdge("CREATE_FILE", createFileEdgeConfig);
registerEdge("CREATE_PROCESS", createProcessEdgeConfig);

export default edgeRegistry;
