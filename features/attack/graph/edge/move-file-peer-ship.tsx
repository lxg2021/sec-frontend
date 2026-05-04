// MoveFilePeerShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * MoveFilePeerShip 表示文件移动节点之间的关系 (FileNode -> FileNode)
 */
export interface MoveFilePeerShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件移动唯一哈希 (md5(FileNode.ObjHash, FileNode.ObjHash)) */
  Hash: string;

  /** 起始文件唯一标识 */
  StartUniqueID: string;

  /** 结束文件唯一标识 */
  EndUniqueID: string;

  /** 原始文件名 */
  FileName: string;

  /** 新文件名或目标文件名 */
  NewFileName: string;
}

/**
 * Move File Peer Ship 配置
 */
const moveFilePeerShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {              
      color: "#FF9800",
      width: 1,
      curve: "bezier",
      markerEnd: null,
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "MOVE_PEER_FILE",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default moveFilePeerShipConfig;