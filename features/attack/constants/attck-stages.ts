export type AttckStageKey =
  | "reconnaissance"
  | "resource-development"
  | "initial-access"
  | "execution"
  | "persistence"
  | "privilege-escalation"
  | "defense-evasion"
  | "credential-access"
  | "discovery"
  | "lateral-movement"
  | "collection"
  | "command-and-control"
  | "exfiltration"
  | "impact"

export interface AttckStageDefinition {
  key: AttckStageKey
  aliases: string[]
  icon: string
  color: string
}

export const ATTCK_STAGE_DEFINITIONS: AttckStageDefinition[] = [
  {
    key: "reconnaissance",
    aliases: ["reconnaissance", "recon", "phase.reconnaissance", "侦察"],
    icon: "Binoculars",
    color: "#3b82f6",
  },
  {
    key: "resource-development",
    aliases: ["resource development", "resource-development", "phase.resource-development", "phase.resource development", "资源开发"],
    icon: "Wrench",
    color: "#06b6d4",
  },
  {
    key: "initial-access",
    aliases: ["initial access", "initial-access", "phase.initial-access", "phase.initial access", "初始访问"],
    icon: "DoorOpen",
    color: "#22c55e",
  },
  {
    key: "execution",
    aliases: ["execution", "phase.execution", "执行"],
    icon: "Terminal",
    color: "#84cc16",
  },
  {
    key: "persistence",
    aliases: ["persistence", "phase.persistence", "持久化"],
    icon: "Anchor",
    color: "#eab308",
  },
  {
    key: "privilege-escalation",
    aliases: ["privilege escalation", "privilege-escalation", "phase.privilege-escalation", "phase.privilege escalation", "权限提升"],
    icon: "ArrowUp",
    color: "#f59e0b",
  },
  {
    key: "defense-evasion",
    aliases: ["defense evasion", "defense-evasion", "phase.defense-evasion", "phase.defense evasion", "防御规避"],
    icon: "ShieldOff",
    color: "#f97316",
  },
  {
    key: "credential-access",
    aliases: ["credential access", "credential-access", "phase.credential-access", "phase.credential access", "凭据访问"],
    icon: "Key",
    color: "#ef4444",
  },
  {
    key: "discovery",
    aliases: ["discovery", "phase.discovery", "发现"],
    icon: "Search",
    color: "#ec4899",
  },
  {
    key: "lateral-movement",
    aliases: ["lateral movement", "lateral-movement", "phase.lateral-movement", "phase.lateral movement", "横向移动"],
    icon: "ArrowRightLeft",
    color: "#a855f7",
  },
  {
    key: "collection",
    aliases: ["collection", "phase.collection", "收集"],
    icon: "Download",
    color: "#6366f1",
  },
  {
    key: "command-and-control",
    aliases: ["command and control", "command-and-control", "command control", "command & control", "c2", "phase.command-and-control", "phase.command and control", "phase.command control", "命令与控制"],
    icon: "Cast",
    color: "#14b8a6",
  },
  {
    key: "exfiltration",
    aliases: ["exfiltration", "phase.exfiltration", "数据外传"],
    icon: "Upload",
    color: "#10b981",
  },
  {
    key: "impact",
    aliases: ["impact", "phase.impact", "影响"],
    icon: "Zap",
    color: "#fb7185",
  },
]

export const ATTCK_STAGE_BY_KEY = new Map(ATTCK_STAGE_DEFINITIONS.map((stage) => [stage.key, stage]))

function normalizeStageInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^phase[.:_-]\s*/, "")
    .replace(/^phase\./, "")
    .replace(/&/g, "and")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
}

const ATTCK_STAGE_ALIAS_MAP = new Map<string, AttckStageDefinition>()

for (const stage of ATTCK_STAGE_DEFINITIONS) {
  ATTCK_STAGE_ALIAS_MAP.set(normalizeStageInput(stage.key), stage)
  for (const alias of stage.aliases) {
    ATTCK_STAGE_ALIAS_MAP.set(normalizeStageInput(alias), stage)
  }
}

export function resolveAttckStage(value: string): AttckStageDefinition | null {
  return ATTCK_STAGE_ALIAS_MAP.get(normalizeStageInput(value)) ?? null
}

export function getAttckStageKey(value: string): AttckStageKey | null {
  return resolveAttckStage(value)?.key ?? null
}

export function getAttckStageDefinition(key: string): AttckStageDefinition | null {
  return ATTCK_STAGE_BY_KEY.get(key as AttckStageKey) ?? null
}
