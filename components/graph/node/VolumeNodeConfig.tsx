// VolumeNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";
import dnsNodeConfig from "./DnsNodeConfig";

interface NodeData {
  label: string;
}

/** volume 节点配置 */
const volumeNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/volume-node.svg",
};

export default volumeNodeConfig;
