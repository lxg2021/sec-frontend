// wmiClassNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

interface NodeData {
  label: string;
}

/** wmiClassNode 节点配置 */
const wmiClassNodeConfig: NodeConfig<NodeData> = {
  getStyle: () => ({
    color: "#F1FBFC",
    width: 32,
    height: 32,
    textColor: "#000",
    borderColor: "transparent",
    borderWidth: 0,
    fontSize: 8,
    opacity: 1,
    shape: "square",
    hoverAnimation: true,
  }),
  getLabel: (data) => data.label,
  getImage: () => "/icons/nodes/wmi-class-node.svg",
};

export default wmiClassNodeConfig;
