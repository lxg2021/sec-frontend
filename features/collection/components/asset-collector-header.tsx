import Link from "next/link"
import { HelpCircle, Server } from "lucide-react"
import { Button } from "@/shared/ui/button"

export function AssetCollectorHeader() {
  const navItems = [
    { href: "/help", icon: HelpCircle, label: "帮助文档" },
    { href: "/faq", label: "FAQ" }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo 区域 */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <img 
                src="/logo.svg" 
                alt="信息采集" 
                className="h-9 w-auto" 
              />
              <span className="text-2xl font-bold tracking-tight text-foreground">
                信息采集
              </span>
            </Link>
          </div>

          {/* 导航菜单 */}
          <nav className="flex items-center gap-1">
            {navItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                asChild
                className="relative transition-all hover:bg-accent/50"
              >
                <Link 
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}