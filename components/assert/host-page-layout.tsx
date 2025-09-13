import type { ReactNode } from "react"

interface HostPageLayoutProps {
  children: ReactNode
}

export function HostPageLayout({ children }: HostPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 不设置max-w，不居中，左右各留4px */}
      <main className="flex-1 w-full px-1 py-0 space-y-6">
        {children}
      </main>
    </div>
  )
}
