// lib/statusColor.ts

export const getStatusColor = (status: string): "default" | "secondary" | "outline" => {
  switch (status) {
    case "启用":
      return "default";
    case "禁用":
      return "secondary";
    case "草稿":
      return "outline";
    default:
      return "default";
  }
};

export const getStatusColorClass = (status: string): string => {
  switch (status) {
    case "启用":
      return "bg-green-100 text-green-700";
    case "禁用":
      return "bg-gray-200 text-gray-600";
    case "草稿":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

  // 获取优先级颜色
export const getLevelColor = (level: string) => {
    switch (level) {
      case "高":
        return "outline"     // 浅红边框
      case "中":
        return "ghost"       // 浅灰背景，文字清晰
      case "低":
        return "secondary"   // 浅灰风格（已够淡）
      default:
        return "ghost"
    }
  }
  
export const getLevelColorClass = (level: string) => {
	  switch (level) {
		case "高":
		  return "text-red-300 bg-red-100"
		case "中":
		  return "text-yellow-600 bg-yellow-100"
		case "低":
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