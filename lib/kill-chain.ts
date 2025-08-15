import { Search, Settings, Mail, Cpu, Wrench, Satellite, Target, LucideIcon } from "lucide-react"

export interface Technique {
  id: string
  name: string
  time: string
  description?: string
  references?: string[]
}

export interface AttckStage {
  slug: string
  name: string
  techniques?: Technique[]
}

export interface KillChainStageData {
  id: string
  name: string
  icon: LucideIcon
  status: "inactive" | "active" | "completed"
  startTime?: string
  endTime?: string
  attckStages: AttckStage[]
}

export interface DynamicKillChainData {
  id: string
  name: string
  status: "inactive" | "active" | "completed"
  startTime?: string
  endTime?: string
  attckStages: AttckStage[]
}


export const initKillChainStages: KillChainStageData[] = [
  { id: "recon", name: "侦察 (Reconnaissance)", icon: Search, status: "inactive", attckStages: [] },
  { id: "weapon", name: "武器化 (Weaponization)", icon: Settings, status: "inactive", attckStages: [] },
  { id: "delivery", name: "投递 (Delivery)", icon: Mail, status: "inactive", attckStages: [] },
  { id: "exploit", name: "利用 (Exploitation)", icon: Cpu, status: "inactive", attckStages: [] },
  { id: "install", name: "安装 (Installation)", icon: Wrench, status: "inactive", attckStages: [] },
  { id: "c2", name: "命令与控制 (Command & Control)", icon: Satellite, status: "inactive", attckStages: [] },
  { id: "objectives", name: "达成目标 (Actions on Objectives)", icon: Target, status: "inactive", attckStages: [] },
]


 /**
   * 这个函数会扫描传入的attckStages阶段内所有技术指标的时间
   * 找到最早的时间作为阶段开始时间，最晚的时间作为阶段结束时间
   * 如果没有时间数据，返回 { startTime: undefined, endTime: undefined }
   * */
export function calculateTimeFromTechniques(attckStages?: AttckStage[]) {
  if (!attckStages || attckStages.length === 0) return { startTime: undefined, endTime: undefined }

  const allTimes: string[] = []
  attckStages.forEach((stage) => {
    stage.techniques?.forEach((tech) => {
      if (tech.time) allTimes.push(tech.time)
    })
  })

  if (allTimes.length === 0) return { startTime: undefined, endTime: undefined }

  allTimes.sort()
  return { startTime: allTimes[0], endTime: allTimes[allTimes.length - 1] }
}

/** 
   * 这个函数 mergeTechniques的作用是合并两个Technique数组,
   * (现有的 existing 和新来的 incoming),
   * 保证同一个 id 的技术只出现一次，并按照时间排序
  */
export function mergeTechniques(existing: Technique[] = [], incoming: Technique[] = []): Technique[] {
  const map = new Map<string, Technique>()
  existing.forEach((t) => map.set(t.id, t))

  incoming.forEach((t) => {
    const existingTech = map.get(t.id)
    if (existingTech) {
      map.set(t.id, {
        ...existingTech,
        ...t,
        time:
          existingTech.time && t.time
            ? existingTech.time < t.time
              ? existingTech.time
              : t.time
            : t.time || existingTech.time,
      })
    } else {
      map.set(t.id, t)
    }
  })

  return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time))
}

/**
  * mergeAttckStages 函数的作用是合并两个ATT&CK阶段数组，保证同一阶段的技术指标不会重复，并且保持数据完整
  */
export function mergeAttckStages(existing: AttckStage[] = [], incoming: AttckStage[] = []): AttckStage[] {
  const stageMap = new Map<string, AttckStage>()
  existing.forEach((s) => stageMap.set(s.slug, s))

  incoming.forEach((incomingStage) => {
    const existingStage = stageMap.get(incomingStage.slug)
    if (existingStage) {
      stageMap.set(incomingStage.slug, {
        ...existingStage,
        name: incomingStage.name || existingStage.name,
        techniques: mergeTechniques(existingStage.techniques, incomingStage.techniques),
      })
    } else {
      stageMap.set(incomingStage.slug, incomingStage)
    }
  })

  return Array.from(stageMap.values())
}
