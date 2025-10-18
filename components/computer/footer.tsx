import Link from "next/link"

export function AssetCollectorFooter() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              隐私声明
            </Link>
            <span className="text-border">|</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              用户协议
            </Link>
            <span className="text-border">|</span>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              联系方式
            </Link>
          </div>

          <div className="text-center md:text-right">
            <p>© 2025 资产管理系统. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
