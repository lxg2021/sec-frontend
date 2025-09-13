import { SystemType } from "@/lib/systemInfo"
import type { HostSummary } from "@/lib/hostSummary"

export const mockHostSummary: HostSummary = {
  total: 8,
  online: 5,
  offline: 3,
  osTypeCount: {
    [SystemType.WINDOWS]: 6,
    [SystemType.LINUX]: 2,
  },
  companyCount: {
    "未来云信息": 5,
    "明日数科": 3,
  }
}
