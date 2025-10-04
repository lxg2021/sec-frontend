// FileServiceImageMd5PeerShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * FileServiceImageMd5PeerShip 表示 ServiceNode 与 FileNode 之间的 MD5 对等关系
 * (ServiceNode -> FileNode)
 */
export interface FileServiceImageMd5PeerShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系时间 (ISO 8601 字符串) */
  Time: string;

  /** 服务二进制文件的 MD5 */
  ServiceBinaryMD5: string;

  /** 对等哈希 (md5(x.FileMd5 + y.ServiceBinaryMD5)) */
  Hash: string;
}

/**
 * ReverseFileServiceImageMd5PeerShip 表示 FileNode -> ServiceNode 的逆向 MD5 对等关系
 */
export interface ReverseFileServiceImageMd5PeerShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件的 MD5 */
  FileMD5: string;

  /** 对等哈希 */
  Hash: string;
}


/**
 * File Service Image Md5 Peer Ship 边配置
 */
const serviceMd5PeerShipConfig: LinkConfig<any> = {
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
  getLabel: () => "SERVICE_MD5_PEER_SHIP",
  onClick: (data) => {

  },
};

export default serviceMd5PeerShipConfig;
