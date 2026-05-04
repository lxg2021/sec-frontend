import type { Metadata } from 'next'
import '../shared/styles/globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'sensor frontend',
  description: 'endpoint security',
  generator: 'lxg',
}

export default async function RootLayout({children,}: Readonly<{children: React.ReactNode}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
