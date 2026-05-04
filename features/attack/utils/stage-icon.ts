// stageIcons.tsx
import {
  Eye,
  Binoculars,
  Wrench,
  DoorOpen,
  Terminal,
  Anchor,
  ArrowUp,
  ShieldOff,
  Key,
  Search as SearchIcon,
  ArrowRightLeft,
  Download,
  Cast,
  Upload,
  Zap,
} from "lucide-react"
import type React from "react"

// 图标映射表
export const iconMap: Record<string, React.ElementType> = {
  Eye,
  Binoculars,
  Wrench,
  DoorOpen,
  Terminal,
  Anchor,
  ArrowUp,
  ShieldOff,
  Key,
  Search: SearchIcon,  // 注意重命名后的映射
  ArrowRightLeft,
  Download,
  Cast,
  Upload,
  Zap,
}

/**
 * 根据 icon 字符串返回对应图标组件，找不到默认返回 Eye
 * /param icon 图标名称
 */
export function getStageIconComponent(icon?: string): React.ElementType {
  if (icon && iconMap[icon]) {
    return iconMap[icon]
  }
  return Eye
}


export function getStageIconBgStyle(color: string) {
  return {
    background: `linear-gradient(to bottom right, ${color}, ${color}cc)`,
  }
}