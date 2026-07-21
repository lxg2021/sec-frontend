import type { ReactNode } from "react"

import { FrameLayout } from "@/features/shell/components/frame-layout"

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <FrameLayout>{children}</FrameLayout>
}
