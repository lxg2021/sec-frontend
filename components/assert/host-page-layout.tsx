import type { ReactNode } from "react"

interface HostPageLayoutProps {
  children: ReactNode
}

export function HostPageLayout({ children }: HostPageLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-semibold text-foreground">主机管理系统</h1>
      </header>
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
