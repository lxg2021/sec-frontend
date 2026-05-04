// FileRenameRegKeyPeerShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * RenameRegKeyPeerShip 表示注册表键节点重命名的关系 (RegKeyNode -> RegKeyNode)
 */
export interface RenameRegKeyPeerShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 关系哈希值 */
  Hash: string;

  /** 原注册表键节点哈希值 */
  StartObjHash: string;

  /** 新注册表键节点哈希值 */
  EndObjHash: string;

  /** 原注册表键名 */
  ObjectName: string;

  /** 新注册表键名 */
  NewObjectName: string;
}

/**
 * Rename RegKey Peer Ship 配置
 */
const renameRegKeyPeerShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {              
      color: "#009688",
      width: 1,
      curve: "bezier",
      markerEnd: null,
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "RENAME_REGKEY_PEER",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default renameRegKeyPeerShipConfig;