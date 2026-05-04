// ProcessDriverLoadShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessDriverLoadShip 表示进程加载驱动的关系 (ProcessNode -> DriverImageNode)
 */
export interface ReverseProcessDriverLoadShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 驱动节点唯一标识符 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

 /**
 * Process Driver Load 边配置
 */
const processDriverLoadShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#434260",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#434260",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "LOAD_DRIVER",
  onClick: (data) => {
  },
};

export default processDriverLoadShipConfig;
