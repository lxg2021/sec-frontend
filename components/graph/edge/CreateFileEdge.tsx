// CreateFileEdge.tsx
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * File Edge 配置
 */
const createFileEdgeConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "blue",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "blue",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CREATE_FILE",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default createFileEdgeConfig;
