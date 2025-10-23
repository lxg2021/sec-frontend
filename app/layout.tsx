import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'sensor frontend',
  description: 'endpoint security',
  generator: 'lxg',
}

export default function RootLayout({children,}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
