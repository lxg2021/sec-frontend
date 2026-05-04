// FileTaskImageMd5PeerShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * FileTaskImageMd5PeerShip 表示文件节点与任务节点的 MD5 关系 (FileNode -> TaskNode)
 */
export interface FileTaskImageMd5PeerShip {
  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件对象哈希值 */
  ObjHash: string;

  /** 文件镜像的 MD5 列表 */
  ImageMD5s: string[];

  /** 唯一哈希 (md5(x.FileMd5 + y.ObjHash)) */
  Hash: string;
}

/**
 * ReverseFileTaskImageMd5PeerShip 表示任务节点与文件 MD5 的反向关系 (TaskNode -> FileNode)
 */
export interface ReverseFileTaskImageMd5PeerShip {
  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件 MD5 */
  FileMD5: string;

  /** 唯一哈希 (md5(x.FileMd5 + y.ObjHash)) */
  Hash: string;
}

/**
 * Task Md5 Peer Ship 边配置
 */
const taskMd5PeerShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#9C27B0",
      width: 1,
      curve: "bezier",
      markerEnd: null,
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "FILE_MD5_PEER_SHIP",
  onClick: (data) => {

  },
};

export default taskMd5PeerShipConfig;
