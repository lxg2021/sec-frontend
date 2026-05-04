const STATUS_ENABLED = "\u542f\u7528"
const STATUS_DISABLED = "\u7981\u7528"
const STATUS_DRAFT = "\u8349\u7a3f"

const LEVEL_HIGH = "\u9ad8"
const LEVEL_MEDIUM = "\u4e2d"
const LEVEL_LOW = "\u4f4e"

export const getStatusColor = (status: string): "default" | "secondary" | "outline" => {
  switch (status) {
    case STATUS_ENABLED:
    case "enabled":
      return "default"
    case STATUS_DISABLED:
    case "disabled":
      return "secondary"
    case STATUS_DRAFT:
    case "draft":
      return "outline"
    default:
      return "default"
  }
}

export const getStatusColorClass = (status: string): string => {
  switch (status) {
    case STATUS_ENABLED:
    case "enabled":
      return "bg-green-100 text-green-700"
    case STATUS_DISABLED:
    case "disabled":
      return "bg-gray-200 text-gray-600"
    case STATUS_DRAFT:
    case "draft":
      return "bg-yellow-100 text-yellow-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

export const getLevelColor = (level: string) => {
  switch (level) {
    case LEVEL_HIGH:
    case "high":
      return "outline"
    case LEVEL_MEDIUM:
    case "medium":
      return "ghost"
    case LEVEL_LOW:
    case "low":
      return "secondary"
    default:
      return "ghost"
  }
}

export const getLevelColorClass = (level: string) => {
  switch (level) {
    case LEVEL_HIGH:
    case "high":
      return "text-red-300 bg-red-100"
    case LEVEL_MEDIUM:
    case "medium":
      return "text-yellow-600 bg-yellow-100"
    case LEVEL_LOW:
    case "low":
      return "text-green-600 bg-green-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}

export const getOnlineStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "online":
      return "bg-green-500"
    case "offline":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}
