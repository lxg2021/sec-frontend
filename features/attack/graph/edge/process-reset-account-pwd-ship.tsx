// ProcessResetAccountPwdShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessResetAccountPwdShip
 * 表示 ProcessNode -> AccountNode 的重置密码关系
 */
export interface ReverseProcessResetAccountPwdShip {
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

  /** 账户对象哈希 */
  ObjHash: string;

  /** 关系哈希 */
  Hash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Reset Account Password Ship 边配置
 */
const processResetAccountPwdShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#039BE5",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#039BE5",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "RESET_ACCOUNT_PASSWORD",
  onClick: (data) => {
  },
};

export default processResetAccountPwdShipConfig;