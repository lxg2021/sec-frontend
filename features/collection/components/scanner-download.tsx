"use client"

import { useState } from "react"
import { Download, CheckCircle2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { useTranslations } from "next-intl"
import Image from "next/image"

interface Platform {
  name: string
  icon: string // 改为 string 类型，本地 svg 路径
  version: string
  size: string
  sha256: string
  downloadUrl: string
}

interface ScannerDownloadProps {
  platforms: Platform[]
}

export function ScannerDownload({ platforms }: ScannerDownloadProps) {
  const t = useTranslations("pages.collection.download")
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = (platform: string, url: string) => {
    setDownloading(platform)
    // 模拟下载
    setTimeout(() => {
      setDownloading(null)
      console.log(`Downloading from ${url}`)
    }, 2000)
  }

  return (
    <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
            <Download className="h-5 w-5 text-slate-900 dark:text-slate-100" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                01
              </span>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                {t("title")}
              </CardTitle>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t("description")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {platforms.map((platform) => {
            const isDownloading = downloading === platform.name

            return (
              <Card
                key={platform.name}
                className="border-2 hover:border-primary/50 transition-colors"
              >
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* ✅ 用 <img> 渲染本地图标 */}
                      <Image
                        src={platform.icon}
                        alt={platform.name}
                        width={20}
                        height={20}
                        unoptimized
                        className="h-5 w-5"
                      />
                      <span className="font-semibold">{platform.name}</span>
                    </div>
                    <Badge variant="secondary">{platform.version}</Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{t("fileSize", { size: platform.size })}</p>
                    <p className="text-xs break-all">
                      SHA256: {platform.sha256.slice(0, 32)}...
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() =>
                      handleDownload(platform.name, platform.downloadUrl)
                    }
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        {t("downloading")}
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {t("download")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{t("instructionsTitle")}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t("windowsInstruction")}</li>
                <li>{t("macosInstruction")}</li>
                <li>{t("linuxInstruction")}</li>
                <li>{t("uploadInstruction")}</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
