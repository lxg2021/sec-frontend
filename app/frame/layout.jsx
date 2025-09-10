"use client"

import { useState, useEffect } from "react"
import {
  ChevronRight,
  Settings,
  Shield,
  Target,
  Users,
  Bell,
  RefreshCw,
  AlertTriangle,
  FileText,
  LayoutDashboard,
  Package,
  HardDrive,
  Boxes,
  ShieldCheck,
  Settings2,
  SlidersHorizontal,
  BarChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"

const SIDEBAR_WIDTH = {
  COLLAPSED: "w-16",
  EXPANDED: "w-72",
}

const ANIMATION_DELAYS = {
  MENU_ITEM: 50,
  SUBMENU_ITEM: 50,
}

export default function BaselineLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState(null)

  // 菜单配置
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "DASHBOARD", path: "/frame/dashboard" },
    { id: "users", icon: Users, label: "用户管理", path: "/frame/users" },
    {
      id: "assets",
      icon: Boxes,
      label: "资产管理",
      submenu: [
        { id: "hardware", icon: HardDrive, label: "硬件资产", path: "/frame/hardware-assets" },
        { id: "software", icon: Package, label: "软件资产", path: "/frame/software-assets" },
      ],
    },
    {
      id: "baseline",
      icon: ShieldCheck,
      label: "安全基线",
      submenu: [
        { id: "baselinedashboard", icon: LayoutDashboard, label: "基线概览", path: "/frame/baseline" },
		{ id: "baselineconfig", icon: Settings2, label: "基线配置", path: "/frame/baseline/rules" },
      ],
    },
    { 
		id: "vulnerability", 
		icon: AlertTriangle, 
		label: "漏洞防护", 
		path: "/frame/vulnerability",
		submenu: [
			{ id: "patchdash", icon: ShieldCheck, label: "补丁概览", path: "/frame/vulnerability/dashboard" },
			{ id: "patchinstall", icon: Package, label: "安装补丁", path: "/frame/vulnerability/installtask" },
			{ id: "patchtatus", icon: BarChart, label: "安装状态", path: "/frame/vulnerability/taskstatus" },
		],
	},
    
	{ id: "attack", icon: Target, label: "攻击溯源", path: "/frame/attack" },
    { id: "response", icon: Shield, label: "处置响应", path: "/frame/response" },
    { id: "reports", icon: FileText, label: "安全报告", path: "/frame/reports" },
    { 
		id: "control", 
		icon: Settings, 
		label: "控制中心", 
		submenu: [
			{ id: "sensorconfig", icon: SlidersHorizontal, label: "传感器配置", path: "/frame/control/sensor" },
		],		
	},
  ]

  // 计算当前激活菜单项ID
const activeSectionId = (() => {
  // 优先匹配完全相等
  for (const item of menuItems) {
    if (item.path && pathname === item.path) {
      return item.id
    }
    if (item.submenu) {
      for (const sub of item.submenu) {
        if (sub.path && pathname === sub.path) {
          return sub.id
        }
      }
    }
  }

  // fallback: 使用 startsWith 以匹配上级菜单
  for (const item of menuItems) {
    if (item.path && pathname.startsWith(item.path)) {
      return item.id
    }
    if (item.submenu) {
      for (const sub of item.submenu) {
        if (sub.path && pathname.startsWith(sub.path)) {
          return sub.id
        }
      }
    }
  }

  return "dashboard"
})()

  // 找到激活菜单对应的父菜单
  const activeParentMenu = menuItems.find((item) =>
    item.submenu?.some((sub) => sub.id === activeSectionId)
  )?.id || null

  // 使用 useEffect 同步展开菜单状态
  useEffect(() => {
    setExpandedMenu(activeParentMenu)
  }, [activeParentMenu])

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

  const handleMenuItemClick = (item) => {
    if (item.submenu) {
      setExpandedMenu(expandedMenu === item.id ? null : item.id)
    } else if (item.path) {
      router.push(item.path)
    }
  }

  const handleSubMenuItemClick = (subItem) => {
    if (subItem.path) {
      router.push(subItem.path)
    }
  }

  const getMenuItemClassName = (isActive) => {
    const baseClasses =
      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden border"
    const activeClasses =
      "bg-gradient-to-r from-blue-300/20 to-blue-200/20 text-blue-300 border-blue-300/30 shadow-lg shadow-blue-300/10"
    const inactiveClasses =
      "text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:border-slate-600/30 border-transparent"
    const collapsedClasses = sidebarCollapsed ? "justify-center" : ""
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${collapsedClasses}`
  }

  const getSubMenuItemClassName = (isActive) => {
    const baseClasses =
      "w-full flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden border"
    const activeClasses =
      "bg-gradient-to-r from-blue-300/20 to-blue-200/20 text-blue-300 border-blue-300/30 shadow-md shadow-blue-300/10"
    const inactiveClasses =
      "text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:border-slate-600/30 border-transparent"
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
  }

  const getBreadcrumbPath = () => {
    const basePath = [{ label: "WatchPoint", id: "root" }]
    for (const item of menuItems) {
      if (item.id === activeSectionId) {
        return [...basePath, { label: item.label, id: item.id }]
      }
      if (item.submenu) {
        const subItem = item.submenu.find((sub) => sub.id === activeSectionId)
        if (subItem) {
          return [...basePath, { label: item.label, id: item.id }, { label: subItem.label, id: subItem.id }]
        }
      }
    }
    return [...basePath, { label: "Dashboard", id: "dashboard" }]
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-900">
      {/* 左侧导航栏 */}
      <div
        className={`${
          sidebarCollapsed ? SIDEBAR_WIDTH.COLLAPSED : SIDEBAR_WIDTH.EXPANDED
        } bg-gradient-to-b from-slate-900/95 to-neutral-900/95 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${
          !sidebarCollapsed ? "md:block" : ""
        } shadow-2xl`}
      >
        <div className="p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700/30">
            <div className={`${sidebarCollapsed ? "hidden" : "flex items-center gap-3"}`}>
              <div className="relative">
                <Image
                  src="/logo.svg?height=36&width=36"
                  alt="WatchPoint Logo"
                  width={36}
                  height={36}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div>
                <h1
                  className="text-xl font-bold tracking-wider bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
                    backgroundSize: "400% 400%",
                    animation: "shimmer 2s ease-in-out infinite",
                  }}
                >
                  WatchPoint
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20"
              aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          {/* 菜单导航 */}
          <nav className="space-y-2" role="navigation" aria-label="主导航">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon
              const isActive = activeSectionId === item.id
              return (
                <div
                  key={item.id}
                  style={{ animationDelay: `${index * ANIMATION_DELAYS.MENU_ITEM}ms` }}
                  // 去掉动画类名
                >
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={getMenuItemClassName(isActive)}
                    aria-expanded={item.submenu ? expandedMenu === item.id : undefined}
                    aria-label={item.label}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-sky-400 to-cyan-400 rounded-r-full" />
                    )}
                    <div className={`relative ${sidebarCollapsed ? "" : "ml-2"}`}>
                      <IconComponent
                        className={`${
                          sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"
                        } transition-all duration-200 ${isActive ? "drop-shadow-lg" : ""}`}
                      />
                      {isActive && <div className="absolute inset-0 bg-sky-400/20 rounded-lg blur-sm -z-10" />}
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-sm font-medium tracking-wide">{item.label}</span>
                        {item.submenu && (
                          <ChevronRight
                            className={`w-4 h-4 ml-auto transition-transform duration-300 ${
                              expandedMenu === item.id ? "rotate-90" : ""
                            }`}
                          />
                        )}
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </button>

                  {item.submenu && expandedMenu === item.id && !sidebarCollapsed && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subItem, subIndex) => {
                        const SubIconComponent = subItem.icon
                        const isSubActive = activeSectionId === subItem.id
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleSubMenuItemClick(subItem)}
                            style={{ animationDelay: `${subIndex * ANIMATION_DELAYS.SUBMENU_ITEM}ms` }}
                            className={getSubMenuItemClassName(isSubActive)}
                            aria-label={subItem.label}
                          >
                            {isSubActive && (
                              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-300 to-blue-200 rounded-r-full" />
                            )}
                            <div className="relative ml-1">
                              <SubIconComponent
                                className={`w-4 h-4 transition-all duration-200 ${
                                  isSubActive ? "text-blue-300 drop-shadow-md" : "text-slate-400 group-hover:text-white"
                                }`}
                              />
                              {isSubActive && <div className="absolute inset-0 bg-blue-300/20 rounded-lg blur-sm -z-10" />}
                            </div>
                            <span className="text-xs font-medium tracking-wide">{subItem.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* 移动端遮罩 */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 头部栏 */}
        <header className="h-12 bg-gradient-to-r from-slate-800/90 to-neutral-800/90 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-4">
            {/* 面包屑 */}
            <nav className="flex items-center gap-2 text-sm" aria-label="面包屑导航">
              {getBreadcrumbPath().map((crumb, index, array) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  <span className="font-medium tracking-wide text-white">{crumb.label}</span>
                  {index < array.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
                  )}
                </div>
              ))}
            </nav>
          </div>
          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20 relative group"
              aria-label="通知"
            >
              <Bell className="w-4 h-4" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20"
              aria-label="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-gray-50 to-neutral-100 dark:from-slate-900 dark:via-gray-900 dark:to-neutral-900">
          {children}
        </main>
      </div>
    </div>
  )
}
