// ProcessDeleteServiceShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessDeleteServiceShip 表示进程删除服务的关系 (ProcessNode -> ServiceNode)
 */
export interface ReverseProcessDeleteServiceShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 删除服务的时间 (ISO 8601 字符串) */
  Time: string;

  /** 服务启动参数（即使是删除操作，仍可能包含启动参数信息） */
  ServiceStartArgs: string;

  /** 发起删除服务的进程 GUID */
  ProcessGuid: string;

  /** 服务对象哈希 */
  ObjHash: string;

  /** 关联标签 */
  Tags: AttackTag[];
}


/**
 * Process Delete Service Ship 边配置
 */
const processDeleteServiceShipConfig: LinkConfig<any> = {
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
  getLabel: () => "DELETE_SERVICE",
  onClick: (data) => {
  },
};

export default processDeleteServiceShipConfig;