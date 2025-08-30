// FileNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

interface NodeData {
  label: string;
}

/** file 节点配置 */
const fileNodeConfig: NodeConfig<NodeData> = {
  getStyle: () => ({
    color: "transparent",
    width: 32,
    height: 32,
    textColor: "#000",
    borderColor: "transparent",
    borderWidth: 2,
    fontSize: 8,
    opacity: 1,
    shape: "circle",
    hoverAnimation: true,
  }),
  getLabel: (data) => data.label,
  getImage: () => "/icons/file.svg",
};

export default fileNodeConfig;
