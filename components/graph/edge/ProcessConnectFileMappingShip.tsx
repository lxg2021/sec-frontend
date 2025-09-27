// ProcessConnectFileMappingShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessConnectFileMappingShip 表示进程连接文件映射对象的关系 (ProcessNode -> FileMappingNode)
 */
export interface ReverseProcessConnectFileMappingShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 堆栈模块名称 */
  StackModule: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 文件映射节点哈希值 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


 /**
 * Process Connect File Mapping Ship 边配置
 */
const processConnectFileMappingShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#6D4C41",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#6D4C41",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CONNECT_FILE_MAPPING",
  onClick: (data) => {
  },
};

export default processConnectFileMappingShipConfig;
