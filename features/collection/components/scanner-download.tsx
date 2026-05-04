"use client"

import { useState } from "react"
import { Download, CheckCircle2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Alert, AlertDescription } from "@/shared/ui/alert"

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
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg">
            <Download className="h-8 w-8 text-primary" />
          </div>

          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
              下载采集器
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              选择适合您的采集器版本进行下载
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
                      <img
                        src={platform.icon}
                        alt={platform.name}
                        className="h-5 w-5"
                      />
                      <span className="font-semibold">{platform.name}</span>
                    </div>
                    <Badge variant="secondary">{platform.version}</Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>文件大小: {platform.size}</p>
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
                        下载中...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        下载
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
              <p className="font-medium">使用说明：</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Windows: 以管理员权限运行 scanner.exe</li>
                <li>macOS: 打开终端，运行 sudo ./scanner</li>
                <li>Linux: 使用 sudo 权限执行 ./scanner.sh</li>
                <li>扫描完成后会生成 assets.json 文件，请上传该文件</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
