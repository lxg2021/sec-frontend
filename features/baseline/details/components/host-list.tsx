import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Checkbox } from "@/shared/ui/checkbox"
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
import FixDropdownMenu from "@/shared/components/menu/fix-dropdown-menu"
import { useTranslations } from "next-intl"
import type { ComponentType, ReactNode } from "react"
import type { BaselineHostListItem } from "@/features/baseline/dashboard/api"

interface HostListProps {
  filteredData: BaselineHostListItem[]
  selectedHosts: string[]
  searchTerm: string
  filterUser: string
  filterDepartment: string
  filterOS: string
  filterHostId: string
  batchFixMethod: string
  uniqueUsers: string[]
  uniqueDepartments: string[]
  uniqueOS: string[]
  setSearchTerm: (value: string) => void
  setFilterUser: (value: string) => void
  setFilterDepartment: (value: string) => void
  setFilterOS: (value: string) => void
  setFilterHostId: (value: string) => void
  handleSelectAll: (checked: boolean) => void
  handleSelectHost: (hostId: string, checked: boolean) => void
  clearFilters: () => void
  handleBatchFixMethodSelect: (method: string) => void
  handleHostFixMethodSelect: (hostId: string, method: string) => void
  getHostFixMethod: (hostId: string) => string
  isLoading?: boolean
}

// 表头图标+文字组件，减少重复
const HeaderCell = ({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: ReactNode }) => (
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
  isLoading = false,
}: HostListProps) {
  const t = useTranslations("pages.baseline.details")
  const selectedAll =
    selectedHosts.length === filteredData.length && filteredData.length > 0
  const failedCount = filteredData.filter((h) => h.status !== "passed").length

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            {t("hostListTitle")}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              {t("hostCount", { count: filteredData.length })}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {t("nonCompliantCount", { count: failedCount })}
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
                placeholder={t("searchPlaceholder")}
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
              {t("clearFilters")}
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Select value={filterUser || "all"} onValueChange={(value) => setFilterUser(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterUser")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allUsers")}</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterDepartment || "all"}
              onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filterDepartment")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allDepartments")}</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOS || "all"} onValueChange={(value) => setFilterOS(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterOs")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allSystems")}</SelectItem>
                {uniqueOS.map((os) => (
                  <SelectItem key={os} value={os}>
                    {os}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={t("filterHostId")}
              value={filterHostId}
              onChange={(e) => setFilterHostId(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Checkbox checked={selectedAll} onCheckedChange={(checked) => handleSelectAll(checked === true)} />
            <span className="text-sm text-gray-700">
              {t("selectedHosts", { count: selectedHosts.length })}
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
                  <Checkbox checked={selectedAll} onCheckedChange={(checked) => handleSelectAll(checked === true)} />
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Hash}>{t("hostId")}</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Users}>{t("user")}</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Mail}>Email</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Phone}>{t("phone")}</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Building}>{t("department")}</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Monitor}>{t("os")}</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">
                  <HeaderCell icon={Clock}>{t("lastOnline")}</HeaderCell>
                </th>
                <th className="text-left py-3 px-4">{t("checkResult")}</th>
                <th className="text-left py-3 px-4">{t("actions")}</th>
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
                        handleSelectHost(host.id, checked === true)
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
                      {t(`resultStatus.${host.status}`)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <FixDropdownMenu
                      selectedMethod={getHostFixMethod(host.id)}
                      onSelect={(method: string) =>
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

        {isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("loadingHosts")}</h3>
          </div>
        )}

        {!isLoading && filteredData.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noMatchTitle")}</h3>
            <p className="text-gray-500">{t("noMatchDescription")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
