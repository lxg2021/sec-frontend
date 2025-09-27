// ConsumerFilterBindingShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ConsumerFilterBindingShip 表示 WMI Consumer 与 WMI Filter 的绑定关系 (WmiConsumerNode -> WmiFilterNode)
 */
export interface ConsumerFilterBindingShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 代理 ID */
  AgentID: string;

  /** WMI 消费者名称 */
  EventConsumerName: string;

  /** WMI 过滤器名称 */
  EventFilterName: string;

  /** 关系 Hash，用于唯一标识 */
  Hash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


/**
 * Consumer Filter Binding Ship 边配置
 */
const consumerFilterBindingShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#6A1B9A",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#6A1B9A",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CONSUMER_FILTER_BINDING",
  onClick: (data) => {
  },
};

export default consumerFilterBindingShipConfig;