// FileDriverImageMd5PeerShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * FileDriverImageMd5PeerShip 表示文件节点与驱动镜像节点之间通过 MD5 建立的关联 (FileNode -> DriverImageNode)
 */
export interface FileDriverImageMd5PeerShip {
  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件 MD5 */
  FileMD5: string;

  /** 驱动镜像 MD5 */
  ImageMD5: string;

  /** 哈希值 (md5(FileMD5 + ObjHash) 或 md5(FileMD5 + UniqueId)) */
  Hash: string;
}

/**
 * ReverseFileDriverImageMd5PeerShip 表示驱动镜像节点反向关联到文件 MD5 的关系 (DriverImageNode -> FileNode)
 */
export interface ReverseFileDriverImageMd5PeerShip {
  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件 MD5 */
  FileMD5: string;

  /** 哈希值 (md5(FileMD5 + ObjHash) 或 md5(FileMD5 + UniqueId)) */
  Hash: string;
}

/**
 * File Driver Image Md5 Peer Ship 边配置
 */
const driverMd5PeerShipConfig: LinkConfig<any> = {
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
  getLabel: () => "DRIVER_MD5_PEER_SHIP",
  onClick: (data) => {

  },
};

export default driverMd5PeerShipConfig;
