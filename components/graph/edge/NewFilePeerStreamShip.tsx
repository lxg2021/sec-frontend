// StreamPeerFileShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * NewFilePeerStreamShip 表示新文件节点与文件流节点的关系 (FileNode -> FileStreamNode)
 * 用于 RenameFile/MoveFile 场景
 */
export interface NewFilePeerStreamShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 新文件节点的对象哈希值 (FileNode.ObjHash) */
  ObjHash: string;

  /** 文件与文件流节点的唯一哈希 (md5(FileStreamNode.ObjHash + FileNode.ObjHash)) */
  Hash: string;
}


/**
 * New File Peer Stream 边配置
 */
const newFilePeerStreamShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#FFB74D",
      width: 1,
      curve: "bezier",
      markerEnd: null,
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "NEW_STREAM_PEER_FILE",
  onClick: (data) => {

  },
};

export default newFilePeerStreamShipConfig;
