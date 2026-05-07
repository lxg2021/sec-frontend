"use client"

import { Cpu, HardDrive, Monitor, MemoryStick, Wifi, Clapperboard as Motherboard } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { Card, CardContent } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import { useTranslations } from "next-intl"

interface HostHardwareAccordionProps {
  hardware: AgentHardwareInfo | null
}

function formatBytes(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
}

function formatMiB(mib: number): string {
  return formatBytes(mib * 1024 * 1024)
}

export function HostHardwareAccordion({ hardware }: HostHardwareAccordionProps) {
  const t = useTranslations("pages.assets.hardware.host.hardwarePanel")

  if (!hardware) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t("empty")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Accordion type="multiple" defaultValue={[]} className="space-y-4">
      {/* CPU Information */}
      <AccordionItem value="cpu">
        <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            <span>{t("cpuInfo")}</span>
            <Badge variant="secondary">{t("socketCount", { count: hardware.cpu.sockets.length })}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("socket")}</TableHead>
                <TableHead>{t("vendor")}</TableHead>
                <TableHead>{t("model")}</TableHead>
                <TableHead>{t("cores")}</TableHead>
                <TableHead>{t("frequency")}</TableHead>
                <TableHead>{t("cache")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hardware.cpu.sockets.map((socket) => (
                <TableRow key={socket.socketId}>
                  <TableCell className="font-medium">{socket.socketId}</TableCell>
                  <TableCell>{socket.vendor}</TableCell>
                  <TableCell className="max-w-xs truncate" title={socket.model}>
                    {socket.model}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{t("physical")}: {socket.physicalCores}</div>
                      <div>{t("logical")}: {socket.logicalCores}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{t("current")}: {socket.currentFrequencyMHz}</div>
                      <div>{t("max")}: {socket.maxFrequencyMHz}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatBytes(socket.cacheSizeBytes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>

      {/* Memory Information */}
      <AccordionItem value="memory">
        <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
          <div className="flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            <span>{t("memoryInfo")}</span>
            <Badge variant="secondary">{t("moduleCount", { count: hardware.rams.length })}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("vendor")}</TableHead>
                <TableHead>{t("model")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("capacity")}</TableHead>
                <TableHead>{t("usage")}</TableHead>
                <TableHead>{t("serialNumber")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hardware.rams.map((ram, index) => {
                const usagePercent = ram.sizeMiB > 0 ? (ram.usedMiB / ram.sizeMiB) * 100 : 0
                return (
                  <TableRow key={index}>
                    <TableCell>{ram.vendor}</TableCell>
                    <TableCell>{ram.model}</TableCell>
                    <TableCell>{ram.name}</TableCell>
                    <TableCell>{formatMiB(ram.sizeMiB)}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t("used")}: {formatMiB(ram.usedMiB)}</span>
                          <span>{usagePercent.toFixed(1)}%</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ram.serialNumber}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>

      {/* Storage Information */}
      <AccordionItem value="storage">
        <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            <span>{t("storageInfo")}</span>
            <Badge variant="secondary">{t("diskCount", { count: hardware.disks.disks.length })}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("vendor")}</TableHead>
                <TableHead>{t("model")}</TableHead>
                <TableHead>{t("capacity")}</TableHead>
                <TableHead>{t("serialNumber")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hardware.disks.disks.map((disk, index) => (
                <TableRow key={index}>
                  <TableCell>{disk.vendor}</TableCell>
                  <TableCell>{disk.model}</TableCell>
                  <TableCell>{formatBytes(disk.size)}</TableCell>
                  <TableCell className="font-mono text-xs">{disk.serialNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>

      {/* GPU Information */}
      {hardware.gpus.gpus.length > 0 && (
        <AccordionItem value="gpu">
          <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <span>{t("gpuInfo")}</span>
              <Badge variant="secondary">{t("gpuCount", { count: hardware.gpus.gpus.length })}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t("vendor")}</TableHead>
                  <TableHead>{t("model")}</TableHead>
                  <TableHead>{t("memory")}</TableHead>
                  <TableHead>{t("frequency")}</TableHead>
                  <TableHead>{t("driverVersion")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hardware.gpus.gpus.map((gpu) => (
                  <TableRow key={gpu.id}>
                    <TableCell>{gpu.id}</TableCell>
                    <TableCell>{gpu.vendor}</TableCell>
                    <TableCell className="max-w-xs truncate" title={gpu.model}>
                      {gpu.model}
                    </TableCell>
                    <TableCell>{formatMiB(gpu.memoryMiB)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{t("current")}: {gpu.currentFrequencyMHz}</div>
                        <div>{t("max")}: {gpu.maxFrequencyMHz}</div>
                      </div>
                    </TableCell>
                    <TableCell>{gpu.driverVersion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Network Information */}
      {hardware.networkInterfaces.interfaces.length > 0 && (
        <AccordionItem value="network">
          <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              <span>{t("networkInfo")}</span>
              <Badge variant="secondary">{t("nicCount", { count: hardware.networkInterfaces.interfaces.length })}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("vendor")}</TableHead>
                  <TableHead>{t("macAddress")}</TableHead>
                  <TableHead>{t("ipAddress")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("speed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hardware.networkInterfaces.interfaces.map((nic) => (
                  <TableRow key={nic.id}>
                    <TableCell>{nic.id}</TableCell>
                    <TableCell className="max-w-xs truncate" title={nic.name}>
                      {nic.name}
                    </TableCell>
                    <TableCell>{nic.vendor}</TableCell>
                    <TableCell className="font-mono text-xs">{nic.macAddress}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {nic.ipv4Addresses.map((ip, i) => (
                          <div key={i} className="text-xs font-mono">
                            {ip}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={nic.enabled ? "default" : "secondary"}>
                        {nic.enabled ? t("enabled") : t("disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>{nic.speedMbps > 0 ? `${nic.speedMbps} Mbps` : t("unknown")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Motherboard Information */}
      <AccordionItem value="motherboard">
        <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
          <div className="flex items-center gap-2">
            <Motherboard className="h-5 w-5" />
            <span>{t("motherboardInfo")}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("vendor")}</label>
                  <p className="text-sm">{hardware.mainBoard.vendor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("model")}</label>
                  <p className="text-sm">{hardware.mainBoard.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("version")}</label>
                  <p className="text-sm">{hardware.mainBoard.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("serialNumber")}</label>
                  <p className="text-sm font-mono">{hardware.mainBoard.serialNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
