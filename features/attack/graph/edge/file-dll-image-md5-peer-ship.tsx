// FileDllImageMd5PeerShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * FileDllImageMd5PeerShip 表示文件节点与 DLL 镜像节点之间通过 MD5 建立的关联 (FileNode -> DllImageNode)
 */
export interface FileDllImageMd5PeerShip {
  
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件 MD5 */
  FileMD5: string;

  /** DLL 镜像 MD5 */
  ImageMD5: string;

  /** 哈希值 (md5(FileMD5 + ObjHash) 或 md5(FileMD5 + UniqueId)) */
  Hash: string;
}

/**
 * ReverseFileDllImageMd5PeerShip 表示 DLL 镜像节点反向关联到文件 MD5 的关系 (DllImageNode -> FileNode)
 */
export interface ReverseFileDllImageMd5PeerShip {

  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件 MD5 */
  FileMD5: string;

  /** 哈希值 (md5(FileMD5 + ObjHash) 或 md5(FileMD5 + UniqueId)) */
  Hash: string;
}

/**
 * File Dll Image Md5 Peer Ship 边配置
 */
const dllMd5PeerShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#434260",
      width: 1,
      curve: "bezier",
      markerEnd: null,
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "DLL_MD5_PEER_SHIP",
  onClick: (data) => {

  },
};

export default dllMd5PeerShipConfig;
