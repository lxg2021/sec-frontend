import { CircuitBoard, Cpu, HardDrive, MemoryStick, Microchip, Network } from "lucide-react"

import type { HardwareCategory, HardwareCategoryMeta } from "@/features/assets/hardware/types"

export const HARDWARE_CATEGORIES: HardwareCategoryMeta[] = [
  {
    value: "cpu",
    icon: Cpu,
    color: "text-blue-600",
    barClassName: "bg-blue-500",
    softClassName: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    value: "disk",
    icon: HardDrive,
    color: "text-emerald-600",
    barClassName: "bg-emerald-500",
    softClassName: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    value: "mainboard",
    icon: CircuitBoard,
    color: "text-violet-600",
    barClassName: "bg-violet-500",
    softClassName: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    value: "memory",
    icon: MemoryStick,
    color: "text-amber-600",
    barClassName: "bg-amber-500",
    softClassName: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    value: "gpu",
    icon: Microchip,
    color: "text-rose-600",
    barClassName: "bg-rose-500",
    softClassName: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    value: "network",
    icon: Network,
    color: "text-cyan-600",
    barClassName: "bg-cyan-500",
    softClassName: "bg-cyan-50 text-cyan-700 border-cyan-100",
  },
]

export function getHardwareCategoryMeta(category: HardwareCategory) {
  return HARDWARE_CATEGORIES.find((item) => item.value === category) || HARDWARE_CATEGORIES[0]
}
