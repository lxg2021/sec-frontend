// ProcessStopServiceShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessStopServiceShip 表示进程停止服务的关系 (ProcessNode -> ServiceNode)
 */
export interface ReverseProcessStopServiceShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 停止服务的时间 (ISO 8601 字符串) */
  Time: string;

  /** 服务控制代码，用于指明停止操作的类型 */
  ServiceControlCode: string;

  /** 发起停止服务的进程 GUID */
  ProcessGuid: string;

  /** 服务对象哈希 */
  ObjHash: string;

  /** 关联标签 */
  Tags: AttackTag[];
}

/**
 * Process Stop Service Ship 边配置
 */
const processStopServiceShipConfig: LinkConfig<any> = {
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
  getLabel: () => "STOP_SERVICE",
  onClick: (data) => {
  },
};

export default processStopServiceShipConfig;