import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessAccessVolumeShip 表示进程与卷节点的反向访问关系 (ProcessNode -> VolumeNode)
 */
export interface ReverseProcessAccessVolumeShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 关系唯一 ID */
  UniqueID: string;

  /** 对象哈希值 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


 /**
 * Process Access Volume 边配置
 */
const processAccessVolumeConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#8BC34A",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#8BC34A",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "ACCESS_VOLUME",
  onClick: (data) => {
  },
};

export default processAccessVolumeConfig;
