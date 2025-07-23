"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Button }     from "@/components/ui/button"
import DashboardPage  from "../dashboard/page"
import UsersPage      from "../users/page"
import Image          from "next/image"
import HardwareAssetsPage from "../hardware-assets/page"
import SoftwareAssetsPage from "../software-assets/page"

/* 常量定义 */
const SIDEBAR_WIDTH = {
  COLLAPSED: "w-16",
  EXPANDED: "w-72",
}

const ANIMATION_DELAYS = {
  MENU_ITEM: 50,
  SUBMENU_ITEM: 50,
}

export default function WatchPointMainFrame() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState(null)

  /* 菜单项配置 */
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "DASHBOARD" },
    { id: "users", icon: Users, label: "用户管理", },
    {
      id: "assets", icon: Boxes, label: "资产管理",
      submenu: [
        { id: "hardware", icon: HardDrive, label: "硬件资产" },
        { id: "software", icon: Package, label: "软件资产" },
      ],
    },
    { id: "baseline", icon: ShieldCheck, label: "安全基线", },
    { id: "vulnerability", icon: AlertTriangle, label: "漏洞防护", },
    { id: "attack", icon: Target, label: "攻击溯源", },
    { id: "response", icon: Shield, label: "处置响应", },
    { id: "reports", icon: FileText, label: "安全报告", },
    { id: "control", icon: Settings, label: "控制中心", },
  ]

  /* ID到显示名称的映射 */
  const sectionDisplayNames = {
    dashboard: "Dashboard",
    users: "用户管理",
    hardware: "硬件资产",
    software: "软件资产",
    baseline: "安全基线",
    vulnerability: "漏洞防护",
    attack: "攻击溯源",
    response: "处置响应",
    reports: "安全报告",
    control: "控制中心",
  }

  /* 根据ID获取SectionName */
  const getSectionDisplayName = (section) => {
    return sectionDisplayNames[section] || "Dashboard"
  }

  /* 构建完整的面包屑路径 */
  const getBreadcrumbPath = (activeSection) => {
    const basePath = [{ label: "WatchPoint", id: "root" }]

    for (const item of menuItems) {
      if (item.id === activeSection) {
        return [...basePath, { label: item.label, id: item.id }]
      }

      if (item.submenu) {
        const subItem = item.submenu.find((sub) => sub.id === activeSection)
        if (subItem) {
          return [...basePath, { label: item.label, id: item.id }, { label: subItem.label, id: subItem.id }]
        }
      }
    }
    return [...basePath, { label: "Dashboard", id: "dashboard" }]
  }

  /* 处理菜单项点击 */
  const handleMenuItemClick = (item) => {
    if (item.submenu) {
      setExpandedMenu(expandedMenu === item.id ? null : item.id)
    } else {
      setActiveSection(item.id)
      setExpandedMenu(null) // 关闭所有展开的子菜单
    }
  }

  /* 处理子菜单项点击 */
  const handleSubMenuItemClick = (subItem) => {
    setActiveSection(subItem.id)
  }

  /* 切换侧边栏折叠状态 */
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  /* 样式类名 */
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

  /* 子菜单项样式类名 */
  const getSubMenuItemClassName = (isActive) => {
    const baseClasses =
      "w-full flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden border animate-in slide-in-from-left-3"
    const activeClasses =
      "bg-gradient-to-r from-blue-300/20 to-blue-200/20 text-blue-300 border-blue-300/30 shadow-md shadow-blue-300/10"
    const inactiveClasses =
      "text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:border-slate-600/30 border-transparent"

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
  }

  /* 渲染页面内容 */
  const renderPageContent = () => {
    const pageComponents = {
      dashboard: <DashboardPage />,
      users: <UsersPage />,
      hardware: <HardwareAssetsPage />,
      software: <SoftwareAssetsPage />,
    }

    if (pageComponents[activeSection]) {
      return pageComponents[activeSection]
    }

    /* 开发中的页面 */
    return (
      <div className="p-6">
        <div className="text-white">{getSectionDisplayName(activeSection)}页面开发中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-900">
      {/* 左侧边栏 */}
      <div
        className={`
          ${sidebarCollapsed ? SIDEBAR_WIDTH.COLLAPSED : SIDEBAR_WIDTH.EXPANDED} 
          bg-gradient-to-b from-slate-900/95 to-neutral-900/95 backdrop-blur-xl 
          border-r border-slate-700/50 transition-all duration-300 
          fixed md:relative z-50 md:z-auto h-full md:h-auto 
          ${!sidebarCollapsed ? "md:block" : ""} shadow-2xl
        `}
      >
        <div className="p-4">
          {/* Logo 区域 */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700/30">
            <div className={`${sidebarCollapsed ? "hidden" : "flex items-center gap-3"}`}>
              <div className="relative">
                <Image src="/logo.svg" alt="WatchPoint Logo" width={36} height={36} className="rounded-lg shadow-lg" />
              </div>
              <div>
                <h1
                  className="text-xl font-bold tracking-wider bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
                    backgroundSize: '400% 400%',
                    animation: 'shimmer 2s ease-in-out infinite',
                  }}
                >
                  WatchPoint
                </h1>
              </div>
            </div>

            {/* 折叠/展开按钮 */}
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

          {/* 导航菜单 */}
          <nav className="space-y-2" role="navigation" aria-label="主导航">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon
              const isActive = activeSection === item.id

              return (
                <div
                  key={item.id}
                  style={{ animationDelay: `${index * ANIMATION_DELAYS.MENU_ITEM}ms` }}
                  className="animate-in slide-in-from-left-5 duration-300"
                >
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={getMenuItemClassName(isActive)}
                    aria-expanded={item.submenu ? expandedMenu === item.id : undefined}
                    aria-label={item.label}
                  >
                    {/* 激活指示器 */}
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-sky-400 to-cyan-400 rounded-r-full" />
                    )}

                    {/* 图标 */}
                    <div className={`relative ${sidebarCollapsed ? "" : "ml-2"}`}>
                      <IconComponent
                        className={`
                          ${sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} 
                          transition-all duration-200 
                          ${isActive ? "drop-shadow-lg" : ""}
                        `}
                      />
                      {isActive && <div className="absolute inset-0 bg-sky-400/20 rounded-lg blur-sm -z-10" />}
                    </div>

                    {/* 标签和箭头 */}
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-sm font-medium tracking-wide">{item.label}</span>
                        {item.submenu && (
                          <ChevronRight
                            className={`
                              w-4 h-4 ml-auto transition-transform duration-300 
                              ${expandedMenu === item.id ? "rotate-90" : ""}
                            `}
                          />
                        )}
                      </>
                    )}

                    {/* 悬浮光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </button>

                  {/* 子菜单 */}
                  {item.submenu && expandedMenu === item.id && !sidebarCollapsed && (
                    <div className="ml-8 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.submenu.map((subItem, subIndex) => {
                        const SubIconComponent = subItem.icon
                        const isSubActive = activeSection === subItem.id

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

                            {/* 子菜单图标 */}
                            <div className="relative ml-1">
                              <SubIconComponent
                                className={`
                                  w-4 h-4 transition-all duration-200 
                                  ${isSubActive ? "text-blue-300 drop-shadow-md" : "text-slate-400 group-hover:text-white"}
                                `}
                              />
                              {isSubActive && (
                                <div className="absolute inset-0 bg-blue-300/20 rounded-lg blur-sm -z-10" />
                              )}
                            </div>

                            {/* 子菜单标签 */}
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

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <header className="h-12 bg-gradient-to-r from-slate-800/90 to-neutral-800/90 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-4">
            {/* 面包屑导航 */}
            <nav className="flex items-center gap-2 text-sm" aria-label="面包屑导航">
              {getBreadcrumbPath(activeSection).map((crumb, index, array) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  <span className="font-medium tracking-wide text-white">{crumb.label}</span>
                  {index < array.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />}
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
              <div
                className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"
                aria-hidden="true"
              />
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

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-gray-50 to-neutral-100 dark:from-slate-900 dark:via-gray-900 dark:to-neutral-900">
          {renderPageContent()}
        </main>
      </div>
    </div>
  )
}