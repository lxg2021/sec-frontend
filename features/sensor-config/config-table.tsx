"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Trash2, Eye } from "lucide-react"
import { configStorage, type ConfigContent, type SavedConfig } from "@/features/sensor-config/data/config-storage"
import { useToast } from "@/shared/hooks/use-toast"
import { Archive, CheckCircle2, AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"

interface ConfigTableProps {
  refreshTrigger: number
}

export function ConfigTable({ refreshTrigger }: ConfigTableProps) {
  const t = useTranslations("pages.sensorConfig.table")
  const [configs, setConfigs] = useState<SavedConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<ConfigContent | null>(null)
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
            <span className="font-medium">{t("success")}</span>
          </div>
        ),
        description: t("deleteSuccess", { name }),
      })
    } catch {
      toast({
        className: "bg-white/90 backdrop-blur-sm text-slate-700 shadow-md rounded-xl flex items-center gap-3 p-4 border border-rose-200",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span className="font-medium">{t("error")}</span>
          </div>
        ),
        description: <span className="text-slate-600">{t("deleteFailed")}</span>,
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
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">{t("title")}</CardTitle>
            </div>
          </div>
        </CardHeader>


        <CardContent>
          {configs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t("empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("version")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("filePath")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
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
                <DialogTitle>{t("detailsTitle")}</DialogTitle>
                <DialogDescription>{t("detailsDescription")}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">{t("name")}</div>
                  <div className="font-medium">{selectedConfig.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">{t("version")}</div>
                  <div className="font-medium">{selectedConfig.version}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">{t("date")}</div>
                  <div className="font-medium">{selectedConfig.date}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">{t("configContent")}</div>
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
