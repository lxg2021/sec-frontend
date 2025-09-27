// AttackTag.ts

/**
 * AttackTag 定义单个攻击标签
 */
export interface AttackTag {
  /** 规则 ID，用于标识检测规则 */
  RuleId: string;

  /** 检测名称 */
  DetectionName: string;

  /** 标签分组 */
  Group: string;

  /** 发生时间 (ISO 8601 字符串) */
  Time: string;
}
