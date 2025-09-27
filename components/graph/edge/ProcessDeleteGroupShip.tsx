// ProcessDeleteGroupShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessDeleteGroupShip
 * 表示 ProcessNode -> AccountGroupNode 的账户组删除关系
 */
export interface ReverseProcessDeleteGroupShip {
  /** 船元素 ID (唯一标识) */
  ShipElementID: ShipElementID;

  /** 关系时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程 GUID */
  ProcessGuid: string;

  /** 用户 SID */
  UserSid: string;

  /** 用户名 */
  UserName: string;

  /** 域名 */
  DomainName: string;

  /** 登录 ID */
  LogonId: string;

  /** 对象哈希 */
  ObjHash: string;

  /** 关系哈希 */
  Hash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


/**
 * Process Delete Group Ship 边配置
 */
const processDeleteGroupShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#0288D1",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#0288D1",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "DELETE_GROUP",
  onClick: (data) => {
  },
};

export default processDeleteGroupShipConfig;