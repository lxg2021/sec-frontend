import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Activity } from "lucide-react"

const overviewData = [
  {
    id: "compliance",
    title: "合规率",
    value: "87.5%",
    description: "较昨日 +2.1%",
    icon: Shield,
    trend: "up",
    trendValue: "+2.1%",
    color: "text-green-600",
    bgGradient: "from-green-500 to-green-600",
    bgLight: "from-green-50 to-green-100",
    borderColor: "border-green-200",
    shadowColor: "shadow-green-500/20",
  },
  {
    id: "total",
    title: "检查总数",
    value: "1,247",
    description: "活跃检查项",
    icon: CheckCircle,
    trend: "neutral",
    trendValue: "1,247",
    color: "text-slate-600",
    bgGradient: "from-slate-500 to-slate-600",
    bgLight: "from-slate-50 to-slate-100",
    borderColor: "border-slate-200",
    shadowColor: "shadow-slate-500/20",
  },
  {
    id: "non-compliant",
    title: "不合规项数",
    value: "156",
    description: "较昨日 -12",
    icon: XCircle,
    trend: "down",
    trendValue: "-12",
    color: "text-yellow-600",
    bgGradient: "from-yellow-500 to-yellow-600",
    bgLight: "from-yellow-50 to-yellow-100",
    borderColor: "border-yellow-200",
    shadowColor: "shadow-yellow-500/20",
  },
  {
    id: "high-risk",
    title: "高风险项数",
    value: "23",
    description: "较昨日 -3",
    icon: AlertTriangle,
    trend: "down",
    trendValue: "-3",
    color: "text-red-600",
    bgGradient: "from-red-500 to-red-600",
    bgLight: "from-red-50 to-red-100",
    borderColor: "border-red-200",
    shadowColor: "shadow-red-500/20",
  },
]

export default function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item, index) => (
        <Card
          key={item.id}
          className={`relative overflow-hidden border-0 bg-white/60 backdrop-blur-xl shadow-lg ${item.shadowColor} hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:scale-102 rounded-xl`}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          {/* 顶部装饰条 */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.bgGradient}`} />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 relative z-10">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.title}</CardTitle>
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${item.bgGradient} shadow-md transition-all duration-300 group-hover:scale-110`}
            >
              <item.icon className="h-4 w-4 text-white transition-all duration-300" />
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-3 px-4 pb-4">
            {/* 主要数值 */}
            <div className="text-2xl font-black text-slate-700 transition-all duration-300">{item.value}</div>

            {/* 描述和趋势 */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400">{item.description}</p>

              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-300 ${
                  item.trend === "up"
                    ? "bg-green-100 border border-green-200"
                    : item.trend === "down"
                      ? "bg-slate-100 border border-slate-200"
                      : "bg-slate-100 border border-slate-200"
                }`}
              >
                {item.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                {item.trend === "down" && <TrendingDown className="h-3 w-3 text-slate-500" />}
                {item.trend === "neutral" && <Activity className="h-3 w-3 text-slate-500" />}
                <span className={`text-xs font-bold ${item.trend === "up" ? "text-green-600" : "text-slate-500"}`}>
                  {item.trend === "neutral" ? "稳定" : item.trendValue}
                </span>
              </div>
            </div>

            {/* 悬浮光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
