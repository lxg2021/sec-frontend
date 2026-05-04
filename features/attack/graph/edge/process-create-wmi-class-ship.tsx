// ProcessCreateWmiClassShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessCreateWmiClassShip 表示进程创建 WMI Class 节点的关系 (ProcessNode -> WmiClassNode)
 */
export interface ReverseProcessCreateWmiClassShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** WMI Class 唯一 ID */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Create Wmi Class Ship 边配置
 */
const processCreateWmiClassShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#26A69A",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#26A69A",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CREATE_WMI_CLASS",
  onClick: (data) => {
  },
};

export default processCreateWmiClassShipConfig;