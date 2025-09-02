"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Eye } from "lucide-react"
import { configStorage, type SavedConfig } from "@/components/secconfig/data/configStorage"
import { useToast } from "@/hooks/use-toast"
import { Archive, CheckCircle2, AlertCircle } from "lucide-react"

interface ConfigTableProps {
  refreshTrigger: number
}

export function ConfigTable({ refreshTrigger }: ConfigTableProps) {
  const [configs, setConfigs] = useState<SavedConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConfigs()
  }, [refreshTrigger])

  const loadConfigs = () => {
    const savedConfigs = configStorage.getAllConfigs()
    setConfigs(savedConfigs)
  }

  const handleDelete = (id: string, name: string) => {
    try {
      configStorage.deleteConfig(id)
      loadConfigs()
      toast({
        className: "bg-white/90 backdrop-blur-sm text-slate-700 shadow-md rounded-xl flex items-center gap-3 p-4 border border-slate-200",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-500" />
            <span className="font-medium">成功</span>
          </div>
        ),
        description: `配置 "${name}" 已删除`,
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "删除配置失败",
        className: "bg-white/90 backdrop-blur-sm text-slate-700 shadow-md rounded-xl flex items-center gap-3 p-4 border border-rose-200",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span className="font-medium">错误</span>
          </div>
        ),
        description: <span className="text-slate-600">删除配置失败</span>,
      })
    }
  }

  const handleViewDetails = (id: string) => {
    const configContent = configStorage.getConfigContent(id)
    setSelectedConfig(configContent)
    setDetailsOpen(true)
  }

  const getFilePath = (id: string): string => {
    return configStorage.getConfigFilePath(id) || ""
  }

  return (
    <>
      <Card className="border-0 shadow-lg">

        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Archive className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">已保存的配置</CardTitle>
            </div>
          </div>
        </CardHeader>


        <CardContent>
          {configs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暂无保存的配置文件</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>文件路径</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>{config.version}</TableCell>
                    <TableCell>{config.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getFilePath(config.id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(config.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(config.id, config.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>配置详情</DialogTitle>
                <DialogDescription>查看配置文件的详细内容</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">名称</div>
                  <div className="font-medium">{selectedConfig.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">版本</div>
                  <div className="font-medium">{selectedConfig.version}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">日期</div>
                  <div className="font-medium">{selectedConfig.date}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">配置内容</div>
                <div className="border rounded-lg overflow-hidden bg-slate-900">
                  <pre className="p-6 text-sm text-slate-100 overflow-auto max-h-96 whitespace-pre-wrap">
                    {JSON.stringify(selectedConfig, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
