// app/baseline/page.jsx
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  FileText,
  Lightbulb,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Video,
  Shield
} from "lucide-react"

export default function DetailsCard({
  itemName = "密码复杂度策略",
  categoryName = "账户安全",
  riskLevel = "中风险",
  CategoryIcon = FileText,
}) {
  return (
    <div className="space-y-6">
      {/* 合并后的基本信息卡片 */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-5">
          <div className="p-3 bg-teal-50 rounded-lg shadow-inner">
            <CategoryIcon className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 tracking-wide">{itemName}</h3>
          </div>
        </div>
        
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 策略分类和风险等级 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-indigo-400" />
              <span className="text-base">策略分类: <span className="font-medium">{categoryName}</span></span>
            </div>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-base">风险等级: <span className="font-semibold">{riskLevel}</span></span>
            </div>
          </div>
          
          {/* 详细描述 */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">详细描述</h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-base">
              要求设置密码必须包含大写、小写、数字、符号，当前策略未启用该要求，存在口令被猜测风险。
              密码复杂度是保障系统安全的重要基础措施，弱密码容易被暴力破解或字典攻击。
            </p>
            <div className="mt-5 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 font-semibold">安全风险</p>
                  <p className="text-yellow-700 text-sm mt-1 leading-relaxed">
                    未启用密码复杂度策略可能导致账户被恶意攻击者轻易破解，进而获取系统访问权限。
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 修复建议 */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <Lightbulb className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">修复建议</h3>
            </div>
            <p className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-base">
              建议开启密码复杂度策略，至少包含三种字符类别，并设置合理的密码长度要求。
            </p>
            <div className="bg-green-50 rounded-lg p-5 border border-green-200 shadow-inner mt-4">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>具体修复步骤</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-green-800 text-sm leading-relaxed">
                <li>登录系统管理控制台</li>
                <li>导航至"安全策略" → "密码策略"</li>
                <li>启用"密码复杂度要求"选项</li>
                <li>设置最小密码长度为8位</li>
                <li>要求包含大写、小写、数字、特殊字符中至少3种</li>
                <li>保存配置并重启相关服务</li>
              </ol>
            </div>
            <div className="flex flex-wrap gap-4 pt-6">
              <a
                href="#"
                className="inline-flex items-center px-5 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-shadow duration-200 hover:shadow-md group"
              >
                <ExternalLink className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">查看详细配置指南</span>
              </a>
              <a
                href="#"
                className="inline-flex items-center px-5 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-shadow duration-200 hover:shadow-md group"
              >
                <BookOpen className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">密码策略最佳实践</span>
              </a>
              <a
                href="#"
                className="inline-flex items-center px-5 py-2 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-shadow duration-200 hover:shadow-md group"
              >
                <Video className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">视频教程</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}