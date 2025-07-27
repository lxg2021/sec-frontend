import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  FileText,
  Lightbulb,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Video,
  Shield,
  ChevronDown,
  ChevronUp
} from "lucide-react"

export default function DetailsCard({
  itemName = "密码复杂度策略",
  categoryName = "账号策略",
  riskLevel = "中风险",
  CategoryIcon = FileText,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        {/* 顶部 Header */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* 左侧标题区 */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-xl shadow border border-gray-100">
                <CategoryIcon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{itemName}</h3>
            </div>

            {/* 右侧信息与折叠 */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                <Shield className="h-4 w-4 mr-1" />
                {categoryName}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {riskLevel}
              </span>
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label={isCollapsed ? "展开卡片" : "收起卡片"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {!isCollapsed && (
          <CardContent className="p-6 space-y-10">
            {/* 详细描述 */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg shadow-inner">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">详细描述</h3>
              </div>
              <div className="pl-11 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  要求设置密码必须包含大写、小写、数字、符号，当前策略未启用该要求，存在口令被猜测风险。
                  密码复杂度是保障系统安全的重要基础措施，弱密码容易被暴力破解或字典攻击。
                </p>
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-l-4 border-amber-400 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 font-semibold">安全风险</p>
                      <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                        未启用密码复杂度策略可能导致账户被恶意攻击者轻易破解，进而获取系统访问权限。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 修复建议 */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg shadow-inner">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">修复建议</h3>
              </div>
              <div className="pl-11 space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  建议开启密码复杂度策略，至少包含三种字符类别，并设置合理的密码长度要求。
                </p>

                {/* 步骤卡片 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-800 mb-4 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>具体修复步骤</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-3 text-green-700 text-sm leading-relaxed marker:font-semibold marker:text-green-600">
                    <li className="pl-2">登录系统管理控制台</li>
                    <li className="pl-2">导航至"安全策略" → "密码策略"</li>
                    <li className="pl-2">启用"密码复杂度要求"选项</li>
                    <li className="pl-2">设置最小密码长度为8位</li>
                    <li className="pl-2">要求包含大写、小写、数字、特殊字符中至少3种</li>
                    <li className="pl-2">保存配置并重启相关服务</li>
                  </ol>
                </div>

                {/* 链接按钮 */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href="#" className="inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 group shadow-sm hover:shadow-md">
                    <ExternalLink className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                    <span className="font-medium text-sm">详细配置指南</span>
                  </a>
                  <a href="#" className="inline-flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-all duration-200 group shadow-sm hover:shadow-md">
                    <BookOpen className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform" />
                    <span className="font-medium text-sm">最佳实践</span>
                  </a>
                  <a href="#" className="inline-flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-all duration-200 group shadow-sm hover:shadow-md">
                    <Video className="h-4 w-4 mr-2 group-hover:scale-105 transition-transform" />
                    <span className="font-medium text-sm">视频教程</span>
                  </a>
                </div>
              </div>
            </section>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
