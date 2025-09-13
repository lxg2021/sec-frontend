"use client"

import { Cpu, HardDrive, Monitor, MemoryStick, Wifi, Clapperboard as Motherboard } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { AgentHardwareInfo } from "@/lib/hardware"

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
  if (!hardware) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">暂无硬件信息</p>
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
            <span>CPU 信息</span>
            <Badge variant="secondary">{hardware.cpu.sockets.length} 个插槽</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>插槽</TableHead>
                <TableHead>厂商</TableHead>
                <TableHead>型号</TableHead>
                <TableHead>核心数</TableHead>
                <TableHead>频率 (MHz)</TableHead>
                <TableHead>缓存</TableHead>
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
                      <div>物理: {socket.physicalCores}</div>
                      <div>逻辑: {socket.logicalCores}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>当前: {socket.currentFrequencyMHz}</div>
                      <div>最大: {socket.maxFrequencyMHz}</div>
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
            <span>内存信息</span>
            <Badge variant="secondary">{hardware.rams.length} 个模块</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>厂商</TableHead>
                <TableHead>型号</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>容量</TableHead>
                <TableHead>使用情况</TableHead>
                <TableHead>序列号</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hardware.rams.map((ram, index) => {
                const usagePercent = (ram.usedMiB / ram.sizeMiB) * 100
                return (
                  <TableRow key={index}>
                    <TableCell>{ram.vendor}</TableCell>
                    <TableCell>{ram.model}</TableCell>
                    <TableCell>{ram.name}</TableCell>
                    <TableCell>{formatMiB(ram.sizeMiB)}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>已用: {formatMiB(ram.usedMiB)}</span>
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
            <span>存储信息</span>
            <Badge variant="secondary">{hardware.disks.disks.length} 个硬盘</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>厂商</TableHead>
                <TableHead>型号</TableHead>
                <TableHead>容量</TableHead>
                <TableHead>序列号</TableHead>
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
              <span>显卡信息</span>
              <Badge variant="secondary">{hardware.gpus.gpus.length} 个显卡</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>厂商</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>显存</TableHead>
                  <TableHead>频率 (MHz)</TableHead>
                  <TableHead>驱动版本</TableHead>
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
                        <div>当前: {gpu.currentFrequencyMHz}</div>
                        <div>最大: {gpu.maxFrequencyMHz}</div>
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
              <span>网络信息</span>
              <Badge variant="secondary">{hardware.networkInterfaces.interfaces.length} 个网卡</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>厂商</TableHead>
                  <TableHead>MAC地址</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>速度</TableHead>
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
                      <Badge variant={nic.enabled ? "default" : "secondary"}>{nic.enabled ? "启用" : "禁用"}</Badge>
                    </TableCell>
                    <TableCell>{nic.speedMbps > 0 ? `${nic.speedMbps} Mbps` : "未知"}</TableCell>
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
            <span>主板信息</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">厂商</label>
                  <p className="text-sm">{hardware.mainBoard.vendor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">型号</label>
                  <p className="text-sm">{hardware.mainBoard.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">版本</label>
                  <p className="text-sm">{hardware.mainBoard.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">序列号</label>
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
