import type { ReactNode } from "react"

interface HostListProps {
  children: ReactNode
}

export function HostList({ children }: HostListProps) {
  return <div className="flex flex-1 flex-col">{children}</div>
}
