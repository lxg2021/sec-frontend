import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Monitor,
  TrendingUp,
  FileText,
  Lightbulb,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Video,
  Calendar,
  Clock,
} from "lucide-react"
import FixDropdownMenu from "./FixDropdownMenu"

export default function DetailsCard({
  itemName,
  categoryName,
  CategoryIcon,
  nonCompliantCount,
  totalCount,
  complianceRate,
  selectedFixMethod,
  handleFixMethodSelect,
}) {
  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardContent className="space-y-10">
        {/* 基本信息卡片 */}
        <div className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          {/* 卡片头部 */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center space-x-5">
              <div className="p-3 bg-teal-50 rounded-lg shadow-inner">
                <CategoryIcon className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 tracking-wide">{itemName}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800 px-3 py-1 text-xs font-semibold rounded-full">
                    {categoryName}
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold rounded-full">
                    中风险
                  </Badge>
                </div>
              </div>
            </div>
            <FixDropdownMenu
              selectedMethod={selectedFixMethod}
              onSelect={handleFixMethodSelect}
              buttonClassName="bg-white border border-gray-300 text-teal-600 hover:bg-teal-50 px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
            />
          </div>

          {/* 数据指标区 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50">
            {/* 影响范围 */}
            <div className="bg-white rounded-lg p-5 flex items-center space-x-4 shadow-inner">
              <div className="p-3 bg-rose-50 rounded-lg">
                <Monitor className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">影响范围</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {nonCompliantCount} <span className="text-base font-normal text-gray-500">/ {totalCount} 台</span>
                </p>
              </div>
            </div>

            {/* 合规率 */}
            <div className="bg-white rounded-lg p-5 shadow-inner flex flex-col justify-center">
              <div className="flex items-center space-x-4 mb-3">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">合规率</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-extrabold text-gray-900">{complianceRate}%</span>
                <div className="flex-1 h-4 rounded-full bg-gray-300 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 ease-in-out"
                    style={{ width: `${complianceRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 检查分类 */}
            <div className="bg-white rounded-lg p-5 flex items-center space-x-4 shadow-inner">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <CategoryIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">检查分类</p>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 px-3 py-1 text-xs font-semibold rounded-full">
                  {categoryName}
                </Badge>
              </div>
            </div>
          </div>

          {/* 底部信息栏 */}
          <div className="bg-white border-t border-gray-100 p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-gray-500 space-y-3 sm:space-y-0">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>检查完成: <span className="font-medium text-gray-700">2025-01-25 16:30</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>风险等级: <span className="font-semibold text-amber-700">中风险</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-rose-500" />
                <span>影响主机: <span className="font-semibold text-rose-600">{nonCompliantCount}/{totalCount}</span></span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>最后更新: <span className="font-medium text-gray-700">刚刚</span></span>
            </div>
          </div>
        </div>

        {/* 详细描述区域 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">详细描述</h3>
          </div>
          <div className="p-6 prose prose-gray max-w-none">
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
        </div>

        {/* 修复建议区域 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">修复建议</h3>
          </div>
          <div className="p-6 space-y-6">
            <p className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-base">
              建议开启密码复杂度策略，至少包含三种字符类别，并设置合理的密码长度要求。
            </p>
            <div className="bg-green-50 rounded-lg p-5 border border-green-200 shadow-inner">
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
            <div className="flex flex-wrap gap-4 pt-3">
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
        </div>
      </CardContent>
    </Card>
  )
}
