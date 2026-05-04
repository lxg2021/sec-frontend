// StreamPeerFileShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * StreamPeerFileShip 表示文件流节点与文件节点的关系 (FileStreamNode -> FileNode)
 */
export interface StreamPeerFileShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件流节点的对象哈希值 (FileStreamNode.ObjHash) */
  ObjHash: string;

  /** 文件流与文件节点的唯一哈希 (md5(FileStreamNode.ObjHash + FileNode.ObjHash)) */
  Hash: string;
}

/**
 * FilePeerStreamShip 表示文件节点与文件流节点的关系 (FileNode -> FileStreamNode)
 */
export interface FilePeerStreamShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件节点的对象哈希值 (FileNode.ObjHash) */
  ObjHash: string;

  /** 文件与文件流节点的唯一哈希 (md5(FileStreamNode.ObjHash + FileNode.ObjHash)) */
  Hash: string;
}


/**
 * Stream Peer File 边配置
 */
const streamPeerFileShipConfig: LinkConfig<any> = {
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
  getLabel: () => "STREAM_PEER_FILE",
  onClick: (data) => {

  },
};

export default streamPeerFileShipConfig;
