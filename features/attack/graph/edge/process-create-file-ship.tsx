// CreateFileEdge.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";


/**
 * ReverseProcessCreateFileShip 表示进程创建文件节点的关系 (ProcessNode -> FileNode)
 */
export interface ReverseProcessCreateFileShip {
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
 * Process Create File Ship 配置
 */
const processCreateFileShipConfig: LinkConfig<ReverseProcessCreateFileShip> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#FF9800",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#FF9800",
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
};

export default processCreateFileShipConfig;
