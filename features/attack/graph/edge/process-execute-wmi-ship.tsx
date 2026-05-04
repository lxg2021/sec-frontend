// ProcessExecuteWmiShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessExecuteWmiShip 表示进程执行 WMI 节点的关系 (ProcessNode -> WmiExecuteNode)
 */
export interface ReverseProcessExecuteWmiShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** WMI Execute 节点唯一 ID */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Execute Wmi Ship 边配置
 */
const processExecuteWmiShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#CE93D8",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#CE93D8",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "WMI_EXECUTE",
  onClick: (data) => {
  },
};

export default processExecuteWmiShipConfig;