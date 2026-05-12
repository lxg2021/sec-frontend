"use client"

import { useState, useEffect } from "react"
import {
  ChevronRight,
  Bell,
  Globe,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/shared/ui/button"
import { Toaster } from "@/shared/ui/toaster"
import { Toaster as SonnerToaster } from "@/shared/ui/sonner"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  deleteAccount,
  createUser,
  logout,
} from "@/features/user/api"
import { SidebarUser } from "@/features/shell/components/sidebar-user"
import { menuItems } from "@/features/shell/navigation"
import { useLocaleSwitch } from "@/shared/i18n/use-locale-switch"

const SIDEBAR_WIDTH = {
  COLLAPSED: "w-16",
  EXPANDED: "w-72",
}

const ANIMATION_DELAYS = {
  MENU_ITEM: 50,
  SUBMENU_ITEM: 50,
}

const VISUAL_STYLE_STORAGE_KEY = "watchpoint-visual-style"

export function FrameLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const tShell = useTranslations("shell")
  const tNav = useTranslations("navigation")
  const tCommon = useTranslations("common")
  const tTheme = useTranslations("theme")
  const tLanguage = useTranslations("language")
  const { toggleLocale } = useLocaleSwitch()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState(null)
  const [visualStyle, setVisualStyle] = useState("cyber")
  const isClassicStyle = visualStyle === "classic"

  useEffect(() => {
    const savedStyle = window.localStorage.getItem(VISUAL_STYLE_STORAGE_KEY)
    if (savedStyle === "classic" || savedStyle === "cyber") {
      setVisualStyle(savedStyle)
    }
  }, [])

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

  const toggleVisualStyle = () => {
    setVisualStyle((currentStyle) => {
      const nextStyle = currentStyle === "cyber" ? "classic" : "cyber"
      window.localStorage.setItem(VISUAL_STYLE_STORAGE_KEY, nextStyle)
      return nextStyle
    })
  }

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
    const activeClasses = isClassicStyle
      ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
      : "bg-gradient-to-r from-blue-300/20 to-blue-200/20 text-blue-300 border-blue-300/30 shadow-lg shadow-blue-300/10"
    const inactiveClasses = isClassicStyle
      ? "text-slate-600 hover:text-slate-950 hover:bg-slate-100 hover:border-slate-200 border-transparent"
      : "text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:border-slate-600/30 border-transparent"
    const collapsedClasses = sidebarCollapsed ? "justify-center" : ""
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${collapsedClasses}`
  }

  const getSubMenuItemClassName = (isActive) => {
    const baseClasses =
      "w-full flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden border"
    const activeClasses = isClassicStyle
      ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
      : "bg-gradient-to-r from-blue-300/20 to-blue-200/20 text-blue-300 border-blue-300/30 shadow-md shadow-blue-300/10"
    const inactiveClasses = isClassicStyle
      ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200 border-transparent"
      : "text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:border-slate-600/30 border-transparent"
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
  }

  const getBreadcrumbPath = () => {
    const basePath = [{ label: tShell("breadcrumbRoot"), id: "root" }]
    for (const item of menuItems) {
      if (item.id === activeSectionId) {
        return [...basePath, { label: tNav(item.labelKey), id: item.id }]
      }
      if (item.submenu) {
        const subItem = item.submenu.find((sub) => sub.id === activeSectionId)
        if (subItem) {
          return [...basePath, { label: tNav(item.labelKey), id: item.id }, { label: tNav(subItem.labelKey), id: subItem.id }]
        }
      }
    }
    return [...basePath, { label: tShell("fallbackPage"), id: "dashboard" }]
  }

  return (
    <div className={isClassicStyle ? "flex h-screen bg-slate-100" : "flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-900"}>
      {/* 左侧导航栏 */}
      <div
        className={`${sidebarCollapsed ? SIDEBAR_WIDTH.COLLAPSED : SIDEBAR_WIDTH.EXPANDED
          } ${isClassicStyle ? "bg-white border-r border-slate-200" : "bg-gradient-to-b from-slate-900/95 to-neutral-900/95 backdrop-blur-xl border-r border-slate-700/50"} transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""
          } shadow-2xl`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between mb-8 pb-4 ${isClassicStyle ? "border-b border-slate-200" : "border-b border-slate-700/30"}`}>
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
              className={isClassicStyle ? "text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200" : "text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20"}
              aria-label={sidebarCollapsed ? tShell("expandSidebar") : tShell("collapseSidebar")}
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          {/* 菜单导航 */}
          <nav className="space-y-2 flex-1" role="navigation" aria-label="主导航">
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
                    aria-label={tNav(item.labelKey)}
                  >
                    {isActive && (
                      <div className={isClassicStyle ? "absolute left-0 top-0 w-1 h-full bg-blue-600 rounded-r-full" : "absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-sky-400 to-cyan-400 rounded-r-full"} />
                    )}
                    <div className={`relative ${sidebarCollapsed ? "" : "ml-2"}`}>
                      <IconComponent
                        className={`${sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"
                          } transition-all duration-200 ${isActive ? "drop-shadow-lg" : ""}`}
                      />
                      {isActive && !isClassicStyle && <div className="absolute inset-0 bg-sky-400/20 rounded-lg blur-sm -z-10" />}
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-sm font-medium tracking-wide">{tNav(item.labelKey)}</span>
                        {item.submenu && (
                          <ChevronRight
                            className={`w-4 h-4 ml-auto transition-transform duration-300 ${expandedMenu === item.id ? "rotate-90" : ""
                              }`}
                          />
                        )}
                      </>
                    )}
                    {!isClassicStyle && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}
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
                            aria-label={tNav(subItem.labelKey)}
                          >
                            {isSubActive && (
                              <div className={isClassicStyle ? "absolute left-0 top-0 w-1 h-full bg-blue-600 rounded-r-full" : "absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-300 to-blue-200 rounded-r-full"} />
                            )}
                            <div className="relative ml-1">
                              <SubIconComponent
                                className={`w-4 h-4 transition-all duration-200 ${isSubActive ? (isClassicStyle ? "text-blue-700" : "text-blue-300 drop-shadow-md") : (isClassicStyle ? "text-slate-500 group-hover:text-slate-900" : "text-slate-400 group-hover:text-white")
                                  }`}
                              />
                              {isSubActive && !isClassicStyle && <div className="absolute inset-0 bg-blue-300/20 rounded-lg blur-sm -z-10" />}
                            </div>
                            <span className="text-xs font-medium tracking-wide">{tNav(subItem.labelKey)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* 用户侧边栏 - 添加在菜单下方 */}
          <div className="mt-auto mb-8">
            <SidebarUser
              collapsed={sidebarCollapsed}
              classicStyle={isClassicStyle}
              getUserProfile={getUserProfile}
              updateUserProfile={updateUserProfile}
              updatePassword={updatePassword}
              deleteAccount={deleteAccount}
              createUser={createUser}
              logout={logout}
            />
          </div>

        </div>
      </div>

      {/* 移动端遮罩 */}
      {!sidebarCollapsed && (
        <div
          className={isClassicStyle ? "fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" : "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"}
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 头部栏 */}
        <header className={isClassicStyle ? "h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm" : "h-12 bg-gradient-to-r from-slate-800/90 to-neutral-800/90 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-6 shadow-lg"}>
          <div className="flex items-center gap-4">
            {/* 面包屑 */}
            <nav className="flex items-center gap-2 text-sm" aria-label="面包屑导航">
              {getBreadcrumbPath().map((crumb, index, array) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  <span className={isClassicStyle ? "font-medium tracking-wide text-slate-700" : "font-medium tracking-wide text-white"}>{crumb.label}</span>
                  {index < array.length - 1 && (
                    <ChevronRight className={isClassicStyle ? "w-3 h-3 text-slate-400" : "w-3 h-3 text-slate-400"} aria-hidden="true" />
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
              onClick={toggleVisualStyle}
              className={isClassicStyle ? "text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200" : "text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20"}
              aria-label={isClassicStyle ? tTheme("switchToCyber") : tTheme("switchToClassic")}
              title={isClassicStyle ? tTheme("switchToCyber") : tTheme("switchToClassic")}
            >
              {isClassicStyle ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLocale}
              className={isClassicStyle ? "text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200" : "text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20"}
              aria-label={tLanguage("switchTo")}
              title={tLanguage("switchTo")}
            >
              <Globe className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={isClassicStyle ? "text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 relative group" : "text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20 relative group"}
              aria-label={tCommon("notifications")}
            >
              <Bell className="w-4 h-4" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={isClassicStyle ? "text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200" : "text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all duration-200 border border-transparent hover:border-sky-400/20"}
              aria-label={tCommon("refresh")}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* 内容区 */}
        <main className={isClassicStyle ? "flex-1 overflow-auto bg-slate-50" : "flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-gray-50 to-neutral-100 dark:from-slate-900 dark:via-gray-900 dark:to-neutral-900"}>
          {children}
        </main>

      </div>
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </div>
  )
}
