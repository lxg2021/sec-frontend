// ProcessCreateServiceShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessCreateServiceShip 表示进程创建服务的关系 (ProcessNode -> ServiceNode)
 */
export interface ReverseProcessCreateServiceShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 创建服务的时间 (ISO 8601 字符串) */
  Time: string;

  /** 发起创建服务的进程 GUID */
  ProcessGuid: string;

  /** 服务对象哈希 */
  ObjHash: string;

  /** 关联标签 */
  Tags: AttackTag[];
}


/**
 * Process Create Service Ship 边配置
 */
const processCreateServiceShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#FF7043",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#FF7043",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CREATE_SERVICE",
  onClick: (data) => {
  },
};

export default processCreateServiceShipConfig;