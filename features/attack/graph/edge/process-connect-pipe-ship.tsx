// ProcessConnectPipeShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessConnectPipeShip 表示进程连接 Pipe 节点的关系 (ProcessNode -> PipeNode)
 */
export interface ReverseProcessConnectPipeShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** Pipe 节点哈希值 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Connect Pipe Ship 边配置
 */
const processConnectPipeShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#607D8B",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#607D8B",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CONNECT_PIPE",
  onClick: (data) => {
  },
};

export default processConnectPipeShipConfig;