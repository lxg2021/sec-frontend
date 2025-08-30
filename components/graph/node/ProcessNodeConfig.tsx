import type { NodeConfig } from "@/components/graph/interface";
import { getProcessNodeMenu } from "@/components/graph/menu/processNodeMenu"

interface NodeData {
  label: string
  nodeId?: string
}

/** process 节点配置 */
export const processNodeConfig: NodeConfig<NodeData> = {
  getStyle: () => ({
    color: "#E0F7FA",
    width: 32,
    height: 32,
    textColor: "#000",
    borderColor: "#00838F",
    borderWidth: 2,
    fontSize: 8,
    opacity: 1,
    shape: "circle",
    hoverAnimation: true,
  }),
  getLabel: (data) => data.label,
  getImage: () => "/icons/process.svg",
  onClick: (data) => alert(`Clicked process node: ${data.label}`),
  onMouseEnter: (data) => {},
  onRightClick: (data) =>
    getProcessNodeMenu(data),
}

export default processNodeConfig
