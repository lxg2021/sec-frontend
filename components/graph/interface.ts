import type { EdgeMarker } from 'reactflow';

/** ======================== Graph Node ======================== */
export interface GraphNode<T = any> {
  /** 节点唯一 id */
  id: string;

  /** 节点类型，例如 "processCreate" */
  type: string;

  /** 原始业务数据 */
  data: T;

  /** 
   * React Flow 坐标，布局完成后必填
   * @example { x: 100, y: 200 }
   */
  position?: {
    x: number;
    y: number;
  };

  /** 可选：节点所在层级 */
  layer?: number;

  /** 可选：层内顺序 */
  order?: number;
}

/** ======================== Node Style ======================== */
export interface NodeStyle {
  /** 节点填充色 */
  color: string;

  /** 自定义节点宽度（可选） */
  width?: number;

  /** 自定义节点高度（可选） */
  height?: number;

  /** 节点形状 */
  shape?: 'circle' | 'square' | 'diamond';

  /** 标签颜色 */
  textColor?: string;

  /** 标签字号 */
  fontSize?: number;

  /** 边框颜色 */
  borderColor?: string;

  /** 边框宽度 */
  borderWidth?: number;

  /** 节点透明度 */
  opacity?: number;

  /** 是否启用悬停动画 */
  hoverAnimation?: boolean;
}


/** ======================== Node Configuration ======================== */
export interface NodeConfig<T = any> {
  /**
   * 获取节点样式
   * @param data 节点业务数据
   * @returns 节点样式
   */
  getStyle: (data: T) => NodeStyle;

  /**
   * 获取节点标签
   * @param data 节点业务数据
   * @returns 节点标签字符串
   */
  getLabel: (data: T) => string;

  /**
   * 获取节点图标（可选）
   * @param data 节点业务数据
   * @returns 图片 URL
   */
  getImage?: (data: T) => string;

  /**
   * 获取节点提示信息（可选）
   * @param data 节点业务数据
   * @returns HTML 字符串或 ReactNode
   */
  getTooltip?: (data: T) => string | React.ReactNode;

  /**
   * 节点点击事件（可选）
   * @param data 节点业务数据
   */
  onClick?: (data: T) => void;

  /**
   * 鼠标移入事件（可选）
   * @param data 节点业务数据
   */
  onMouseEnter?: (data: T) => void;

  /**
   * 鼠标移出事件（可选）
   * @param data 节点业务数据
   */
  onMouseLeave?: (data: T) => void;

  /**
   * 节点右键菜单（可选）
   * @param data 节点业务数据
   * @returns 上下文菜单项数组
   */
  onRightClick?: (data: T) => ContextMenuItem[];
}


/** ======================== Context Menu Item ======================== */
export interface ContextMenuItem {
  /**
   * 菜单项文本或 JSX 元素
   * - 支持直接写 JSX，自定义文字样式
   */
  label: string | React.ReactNode;

  /**
   * 点击菜单项时触发的操作
   */
  action: () => void;

  /**
   * 菜单项图标（可选）
   * - 通常使用 React 组件作为图标
   */
  icon?: React.ReactNode;

  /**
   * 菜单项的自定义样式（可选）
   * - 支持 React.CSSProperties，例如 { backgroundColor, padding, color }
   */
  style?: React.CSSProperties;
}


/** ======================== Graph Link ======================== */
export interface GraphLink<T = any> {
  /**
   * 边的唯一 id
   * - 必须唯一，用于确保 React Flow 能正确识别边
   */
  id: string;

  /**
   * 边的源节点 id
   */
  source: string;

  /**
   * 边的目标节点 id
   */
  target: string;

  /**
   * 边的类型
   * - 例如 `"EDGE_PROCESS_CREATE_PROCESS"`
   */
  type: string;

  /**
   * 边的业务数据（可选）
   */
  data?: T;
}

/** ======================== Link Style ======================== */
export interface LinkStyle {
  /**
   * 线条颜色
   */
  color?: string;

  /**
   * 线条宽度
   */
  width?: number;

  /**
   * 标签文字颜色
   */
  textColor?: string;

  /**
   * 标签文字字号
   */
  fontSize?: number;

  /**
   * 虚线样式数组
   * - 例如 `[4, 2]` 表示 4px 实线 + 2px 间隔
   */
  dash?: number[];

  /**
   * 线条透明度
   */
  opacity?: number;

  /**
   * 线条末端标记
   * - 可接受原生 `EdgeMarker`
   */
  markerEnd?: EdgeMarker | null;

  /**
   * 曲线类型
   * - `'bezier'`：贝塞尔曲线（默认）
   * - `'straight'`：直线
   * - `'step'`：阶梯线
   */
  curve?: 'bezier' | 'straight' | 'step';
}

/** ======================== Link Configuration ======================== */
export interface LinkConfig<T = any> {
  /**
   * 根据业务数据返回边的样式
   */
  getStyle: (data: T) => LinkStyle;

  /**
   * 根据业务数据返回边的标签
   */
  getLabel?: (data: T) => string;

  /**
   * 点击事件
   */
  onClick?: (data: T) => void;

  /**
   * 鼠标移入事件
   */
  onMouseEnter?: (data: T) => void;

  /**
   * 鼠标移出事件
   */
  onMouseLeave?: (data: T) => void;
}


/** ======================== NodeType & EdgeType 映射 ======================== */

/**
 * 节点类型映射表
 * - key: 节点类型字符串
 * - value: 对应的节点配置
 */
export type NodeTypeMap<T = any> = Record<string, NodeConfig<T>>;

/**
 * 边类型映射表
 * - key: 边类型字符串
 * - value: 对应的边配置
 */
export type EdgeTypeMap<T = any> = Record<string, LinkConfig<T>>;
