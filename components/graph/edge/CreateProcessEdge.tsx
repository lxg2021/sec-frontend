// CreateProcessEdge.tsx
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * Process Create Process 边配置
 */
const createProcessEdgeConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "red",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "red",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CREATE_PROCESS",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default createProcessEdgeConfig;
