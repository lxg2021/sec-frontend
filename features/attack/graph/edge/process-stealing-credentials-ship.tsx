// ProcessStealingCredentialsShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessStealingCredentialsShip 表示进程窃取凭证节点的关系 (ProcessNode -> CredentialsNode)
 */
export interface ReverseProcessStealingCredentialsShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 凭证节点哈希值 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Stealing Credentials Ship 配置
 */
const processStealingCredentialsShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {              
      color: "#C2185B",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#C2185B",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "STEALING_CREDENTIALS",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processStealingCredentialsShipConfig;