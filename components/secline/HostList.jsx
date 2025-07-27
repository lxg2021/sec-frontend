import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  RefreshCw,
  Hash,
  Users,
  Building,
  Monitor,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Clock,
} from "lucide-react"
import FixDropdownMenu from "@/components/menu/FixDropdownMenu"

// 表头图标+文字组件，减少重复
const HeaderCell = ({ icon: Icon, children }) => (
  <div className="flex items-center space-x-1">
    <Icon className="h-3 w-3" />
    <span>{children}</span>
  </div>
)

export default function HostList({
  filteredData,
  selectedHosts,
  searchTerm,
  filterUser,
  filterDepartment,
  filterOS,
  filterHostId,
  batchFixMethod,
  hostFixMethods,
  uniqueUsers,
  uniqueDepartments,
  uniqueOS,
  setSearchTerm,
  setFilterUser,
  setFilterDepartment,
  setFilterOS,
  setFilterHostId,
  handleSelectAll,
  handleSelectHost,
  clearFilters,
  handleBatchFixMethodSelect,
  handleHostFixMethodSelect,
  getHostFixMethod,
}) {
  const selectedAll =
    selectedHosts.length === filteredData.length && filteredData.length > 0
  const failedCount = filteredData.filter((h) => h.status === "failed").length

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            影响主机列表
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              共 {filteredData.length} 台主机
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {failedCount} 台不合规
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索主机ID、使用者或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              清空筛选
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="筛选使用者" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部使用者</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="筛选部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部部门</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOS} onValueChange={setFilterOS}>
              <SelectTrigger>
                <SelectValue placeholder="筛选操作系统" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部系统</SelectItem>
                {uniqueOS.map((os) => (
                  <SelectItem key={os} value={os}>
                    {os}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="筛选主机ID"
              value={filterHostId}
              onChange={(e) => setFilterHostId(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Checkbox checked={selectedAll} onCheckedChange={handleSelectAll} />
            <span className="text-sm text-gray-700">
              已选择 {selectedHosts.length} 台主机
            </span>
          </div>

          <FixDropdownMenu
            selectedMethod={batchFixMethod}
            onSelect={handleBatchFixMethodSelect}
            buttonVariant="outline"
            buttonClassName="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 disabled:opacity-50"
            disabled={selectedHosts.length === 0}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="text-left py-3 px-4">
                  <Checkbox checked={selectedAll} onCheckedChange={handleSelectAll} />
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Hash}>主机ID</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Users}>使用者</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Mail}>Email</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Phone}>电话</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Building}>所属部门</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Monitor}>操作系统</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Clock}>最近上线时间</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">检查结果</th>
                <th className="text-left py-3 px-4">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredData.map((host) => (
                <tr
                  key={host.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Checkbox
                      checked={selectedHosts.includes(host.id)}
                      onCheckedChange={(checked) =>
                        handleSelectHost(host.id, checked)
                      }
                    />
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {host.id}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{host.user}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{host.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{host.phone}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {host.department}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{host.os}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {host.lastOnline}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={`${
                        host.status === "passed"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {host.status === "passed" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {host.checkResult}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <FixDropdownMenu
                      selectedMethod={getHostFixMethod(host.id)}
                      onSelect={(method) =>
                        handleHostFixMethodSelect(host.id, method)
                      }
                      buttonVariant="outline"
                      buttonClassName="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              未找到匹配的主机
            </h3>
            <p className="text-gray-500">请尝试调整筛选条件或搜索关键词</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
