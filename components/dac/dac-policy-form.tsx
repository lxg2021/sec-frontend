"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Server } from "lucide-react"
import type { PolicyType, NetworkPolicy, FilePolicy, RegistryPolicy, ProcessPolicy } from "@/components/dac/dacpolicy"
import { ActionCard, type ActionOption } from "@/components/dac/action-card"
import HostSelector from "@/components/hosts/HostSelector"
import { mockData } from "@/data/mockData"
import { useToast } from "@/hooks/use-toast"

interface DacPolicyFormProps {
  onPolicyGenerate?: (policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy) => void
}

export function DacPolicyForm({ onPolicyGenerate }: DacPolicyFormProps) {
  const [policyType, setPolicyType] = useState<PolicyType>("fs")
  const [version, setVersion] = useState("v1.0")
  const [policyName, setPolicyName] = useState("")
  const [level, setLevel] = useState("50")
  const [exceptSource, setExceptSource] = useState("")
  const [subjectSource, setSubjectSource] = useState("")
  const [objectSource, setObjectSource] = useState("")

  const [selectedHosts, setSelectedHosts] = useState<any[]>([])
  const [selectedHostIds, setSelectedHostIds] = useState<Set<string>>(new Set())
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false)

  const [fsPromptActions, setFsPromptActions] = useState<string[]>([])
  const [fsRejectActions, setFsRejectActions] = useState<string[]>([])
  const [fsAuditActions, setFsAuditActions] = useState<string[]>([])

  const [regPromptActions, setRegPromptActions] = useState<string[]>([])
  const [regRejectActions, setRegRejectActions] = useState<string[]>([])
  const [regAuditActions, setRegAuditActions] = useState<string[]>([])

  const [psPromptActions, setPsPromptActions] = useState<string[]>([])
  const [psRejectActions, setPsRejectActions] = useState<string[]>([])
  const [psAuditActions, setPsAuditActions] = useState<string[]>([])

  // Network policy specific states
  const [netDirection, setNetDirection] = useState<"in" | "out">("in")
  const [netAction, setNetAction] = useState<"allow" | "block" | "bypass">("allow")
  const [netProfile, setNetProfile] = useState<"domain" | "private" | "public" | "any">("any")
  const [netProtocol, setNetProtocol] = useState<"tcp" | "udp" | "icmp" | "any">("tcp")
  const [localPort, setLocalPort] = useState("80,443,8080")
  const [remotePort, setRemotePort] = useState("any")
  const [localAddress, setLocalAddress] = useState("any")
  const [remoteAddress, setRemoteAddress] = useState("192.168.1.0/24")
  const [programPath, setProgramPath] = useState("C:\\Program Files\\App\\app.exe")

  const { toast } = useToast()

  const handleHostSelectionChange = (nodes: any[], ids: Set<string>) => {
    setSelectedHosts(nodes)
    setSelectedHostIds(ids)
  }

  const handleConfirmHostSelection = () => {
    setIsHostDialogOpen(false)
  }

  const getCurrentActions = (): ActionOption[] => {
    switch (policyType) {
      case "fs":
        return FILE_ACTIONS
      case "reg":
        return REGISTRY_ACTIONS
      case "ps":
        return PROCESS_ACTIONS
      default:
        return []
    }
  }

  const getCurrentActionStates = () => {
    switch (policyType) {
      case "fs":
        return {
          promptActions: fsPromptActions,
          rejectActions: fsRejectActions,
          auditActions: fsAuditActions,
          setPromptActions: setFsPromptActions,
          setRejectActions: setFsRejectActions,
          setAuditActions: setFsAuditActions,
        }
      case "reg":
        return {
          promptActions: regPromptActions,
          rejectActions: regRejectActions,
          auditActions: regAuditActions,
          setPromptActions: setRegPromptActions,
          setRejectActions: setRegRejectActions,
          setAuditActions: setRegAuditActions,
        }
      case "ps":
        return {
          promptActions: psPromptActions,
          rejectActions: psRejectActions,
          auditActions: psAuditActions,
          setPromptActions: setPsPromptActions,
          setRejectActions: setPsRejectActions,
          setAuditActions: setPsAuditActions,
        }
      default:
        return {
          promptActions: [],
          rejectActions: [],
          auditActions: [],
          setPromptActions: () => { },
          setRejectActions: () => { },
          setAuditActions: () => { },
        }
    }
  }

  const handlePromptActionToggle = (action: string) => {
    const { promptActions, rejectActions, setPromptActions, setRejectActions } = getCurrentActionStates()

    if (promptActions.includes(action)) {
      setPromptActions(promptActions.filter((a) => a !== action))
    } else {
      // Remove from reject if adding to prompt (mutual exclusivity)
      setPromptActions([...promptActions, action])
      setRejectActions(rejectActions.filter((a) => a !== action))
    }
  }

  const handleRejectActionToggle = (action: string) => {
    const { promptActions, rejectActions, setPromptActions, setRejectActions } = getCurrentActionStates()

    if (rejectActions.includes(action)) {
      setRejectActions(rejectActions.filter((a) => a !== action))
    } else {
      // Remove from prompt if adding to reject (mutual exclusivity)
      setRejectActions([...rejectActions, action])
      setPromptActions(promptActions.filter((a) => a !== action))
    }
  }

  const handleAuditActionToggle = (action: string) => {
    const { auditActions, setAuditActions } = getCurrentActionStates()

    if (auditActions.includes(action)) {
      setAuditActions(auditActions.filter((a) => a !== action))
    } else {
      setAuditActions([...auditActions, action])
    }
  }

  const generatePolicy = () => {
    const { promptActions, rejectActions, auditActions } = getCurrentActionStates()

    const targetHosts = Array.from(selectedHostIds).join(",")

    const baseHeader = {
      version: version,
      from: "system",
      to: targetHosts, // Use selected host IDs
      id: crypto.randomUUID(),
      group: "",
      name: policyName,
      level: Number.parseInt(level),
      domain: "",
      time: new Date().toISOString(),
    }

    if (policyType === "net") {
      const policy: NetworkPolicy = {
        header: { ...baseHeader, type: "net" },
        body: {
          rule: {
            direction: netDirection,
            action: netAction,
            profile: netProfile,
          },
          protocol: {
            type: netProtocol,
            localport: localPort,
            remoteport: remotePort,
          },
          address: {
            local: localAddress,
            remote: remoteAddress,
          },
          program: {
            path: programPath,
          },
        },
      }
      return policy
    } else {
      const basePolicy = {
        header: { ...baseHeader, type: policyType },
        body: {
          except: { type: "ps", source: exceptSource },
          subject: { type: "ps", source: subjectSource },
          object: {
            type: policyType === "reg" ? "rg" : policyType,
            source: objectSource,
          },
          prompt: { action: promptActions.join(";") },
          reject: { action: rejectActions.join(";") },
          audit: { action: auditActions.join(";") },
        },
      }
      return basePolicy
    }
  }

  const handleExport = () => {
    console.log("开始验证...") // 调试用

    // Validate common required fields
    if (!policyName.trim()) {
      console.log("策略名称为空") 
      toast({
        title: "验证失败",
        description: "策略名称不能为空",
        variant: "destructive",
      })
      return
    }

    if (!version.trim()) {
      toast({
        title: "验证失败",
        description: "版本不能为空",
        variant: "destructive",
      })
      return
    }

    if (!level.trim() || Number.parseInt(level) < 1 || Number.parseInt(level) > 254) {
      toast({
        title: "验证失败",
        description: "优先级必须在 1-254 之间",
        variant: "destructive",
      })
      return
    }

    // Validate policy type specific fields
    if (policyType !== "net") {
      // Validate subject and object for fs/reg/ps policies
      if (!subjectSource.trim()) {
        toast({
          title: "验证失败",
          description: "主体进程不能为空",
          variant: "destructive",
        })
        return
      }

      if (!objectSource.trim()) {
        toast({
          title: "验证失败",
          description: "客体不能为空",
          variant: "destructive",
        })
        return
      }

      // Validate action control - at least one action must be selected
      const { promptActions, rejectActions, auditActions } = getCurrentActionStates()
      if (promptActions.length === 0 && rejectActions.length === 0 && auditActions.length === 0) {
        toast({
          title: "验证失败",
          description: "行为控制不能为空，请至少选择一个操作",
          variant: "destructive",
        })
        return
      }
    } else {
      // Network policy specific validations
      if (!programPath.trim()) {
        toast({
          title: "验证失败",
          description: "程序路径不能为空",
          variant: "destructive",
        })
        return
      }
    }

    // All validations passed, generate policy
    const policy = generatePolicy()
    console.log("Generated Policy:", policy)

    if (onPolicyGenerate) {
      onPolicyGenerate(policy)
    }

    toast({
      title: "策略生成成功",
      description: "策略已生成，请查看控制台输出",
    })
  }

  const FILE_ACTIONS: ActionOption[] = [
    { value: "n", label: "新建", description: "创建新文件" },
    { value: "d", label: "删除", description: "删除文件" },
    { value: "m", label: "移动", description: "移动文件" },
    { value: "t", label: "重命名", description: "重命名文件" },
    { value: "s", label: "设置", description: "设置文件属性" },
    { value: "o", label: "打开", description: "打开文件" },
    { value: "x", label: "执行", description: "执行文件" },
    { value: "r", label: "读取", description: "读取文件内容" },
    { value: "w", label: "写入", description: "写入文件内容" },
  ]

  const REGISTRY_ACTIONS: ActionOption[] = [
    { value: "n", label: "新建键", description: "创建新注册表键" },
    { value: "d", label: "删除键/值", description: "删除注册表键或值" },
    { value: "q", label: "查询键/值", description: "查询注册表" },
    { value: "t", label: "重命名键", description: "重命名注册表键" },
    { value: "s", label: "设置值", description: "设置注册表值" },
    { value: "o", label: "打开键", description: "打开注册表键" },
    { value: "e", label: "枚举键/值", description: "枚举注册表" },
  ]

  const PROCESS_ACTIONS: ActionOption[] = [
    { value: "n", label: "创建进程", description: "创建新进程" },
    { value: "d", label: "结束进程", description: "终止进程" },
    { value: "o", label: "打开进程", description: "打开进程句柄" },
    { value: "l", label: "分配内存", description: "分配进程内存" },
    { value: "w", label: "写内存", description: "写入进程内存" },
  ]

  return (
    <div className="w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">访问控制策略配置</h1>
        <p className="text-muted-foreground">创建和管理 DAC (Discretionary Access Control) 策略</p>
      </div>

      <Tabs value={policyType} onValueChange={(v) => setPolicyType(v as PolicyType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fs">文件策略</TabsTrigger>
          <TabsTrigger value="reg">注册表策略</TabsTrigger>
          <TabsTrigger value="ps">进程策略</TabsTrigger>
          <TabsTrigger value="net">网络策略</TabsTrigger>
        </TabsList>

        {/* Common Header Section for fs, reg, ps */}
        {policyType !== "net" && (
          <TabsContent value={policyType} className="space-y-6 mt-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">策略头部</h2>
                  <Badge variant="outline">{policyType.toUpperCase()}</Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">版本</Label>
                    <Input
                      id="version"
                      placeholder="v1.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">策略名称 *</Label>
                    <Input
                      id="name"
                      placeholder="输入策略友好名称"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">优先级 (1-254)</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      max="254"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-host">目标主机</Label>
                    <Button
                      id="target-host"
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-transparent"
                      onClick={() => setIsHostDialogOpen(true)}
                    >
                      <Server className="mr-2 h-4 w-4" />
                      {selectedHostIds.size > 0 ? `已选择 ${selectedHostIds.size} 台主机` : "点击选择目标主机"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">策略主体</h2>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="except">例外进程 (可选)</Label>
                    <Input
                      id="except"
                      placeholder="例如: *\rcSvc.exe (支持 * # ? 通配符，多项用分号分隔)"
                      value={exceptSource}
                      onChange={(e) => setExceptSource(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">不受此策略限制的进程</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">主体进程 *</Label>
                    <Input
                      id="subject"
                      placeholder={
                        policyType === "fs"
                          ? "例如: *\\notepad.exe;*"
                          : policyType === "reg"
                            ? "例如: *\\regedit.exe;*"
                            : "例如: *\\taskmgr.exe;*"
                      }
                      value={subjectSource}
                      onChange={(e) => setSubjectSource(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">执行操作的进程 (支持通配符)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="object">
                      客体{policyType === "fs" ? "文件" : policyType === "reg" ? "注册表" : "进程"} *
                    </Label>
                    <Input
                      id="object"
                      placeholder={
                        policyType === "fs"
                          ? "例如: c:\\a.txt;*\\b.txt"
                          : policyType === "reg"
                            ? "例如: HKEY_CURRENT_USER\\AppEvents\\*"
                            : "例如: *\\calc.exe"
                      }
                      value={objectSource}
                      onChange={(e) => setObjectSource(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">被操作的目标 (支持通配符)</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">行为控制</h2>
                <Separator />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ActionCard
                      title="用户决断"
                      description="需要用户确认的操作"
                      actions={getCurrentActionStates().promptActions}
                      availableActions={getCurrentActions()}
                      onActionToggle={handlePromptActionToggle}
                      disabledActions={getCurrentActionStates().rejectActions}
                      badgeColor="outline"
                    />

                    <ActionCard
                      title="拒绝行为"
                      description="直接拒绝的操作"
                      actions={getCurrentActionStates().rejectActions}
                      availableActions={getCurrentActions()}
                      onActionToggle={handleRejectActionToggle}
                      disabledActions={getCurrentActionStates().promptActions}
                      badgeColor="destructive"
                    />

                    <ActionCard
                      title="审计行为"
                      description="仅记录日志的操作"
                      actions={getCurrentActionStates().auditActions}
                      availableActions={getCurrentActions()}
                      onActionToggle={handleAuditActionToggle}
                      badgeColor="secondary"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Network Policy Tab */}
        <TabsContent value="net" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">策略头部</h2>
                <Badge variant="outline">NET</Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="net-version">版本</Label>
                  <Input
                    id="net-version"
                    placeholder="v1.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="net-name">策略名称 *</Label>
                  <Input
                    id="net-name"
                    placeholder="输入网络策略名称"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="net-level">优先级 (1-254)</Label>
                  <Input
                    id="net-level"
                    type="number"
                    min="1"
                    max="254"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="net-target-host">目标主机</Label>
                  <Button
                    id="net-target-host"
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                    onClick={() => setIsHostDialogOpen(true)}
                  >
                    <Server className="mr-2 h-4 w-4" />
                    {selectedHostIds.size > 0 ? `已选择 ${selectedHostIds.size} 台主机` : "点击选择目标主机"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">规则配置</h2>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="direction">方向</Label>
                  <Select value={netDirection} onValueChange={(v) => setNetDirection(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">入站 (in)</SelectItem>
                      <SelectItem value="out">出站 (out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">动作</Label>
                  <Select value={netAction} onValueChange={(v) => setNetAction(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">允许 (allow)</SelectItem>
                      <SelectItem value="block">阻止 (block)</SelectItem>
                      <SelectItem value="bypass">绕过 (bypass)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile">网络配置文件</Label>
                  <Select value={netProfile} onValueChange={(v) => setNetProfile(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domain">域网络</SelectItem>
                      <SelectItem value="private">专用网络</SelectItem>
                      <SelectItem value="public">公用网络</SelectItem>
                      <SelectItem value="any">所有网络</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">协议和端口</h2>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protocol">协议类型</Label>
                  <Select value={netProtocol} onValueChange={(v) => setNetProtocol(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="icmp">ICMP</SelectItem>
                      <SelectItem value="any">所有协议</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localport">本地端口</Label>
                  <Input
                    id="localport"
                    placeholder="80,443,8080 或 any"
                    value={localPort}
                    onChange={(e) => setLocalPort(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remoteport">远程端口</Label>
                  <Input
                    id="remoteport"
                    placeholder="any 或具体端口"
                    value={remotePort}
                    onChange={(e) => setRemotePort(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">地址范围</h2>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="localaddr">本地地址</Label>
                  <Input
                    id="localaddr"
                    placeholder="any 或 IP/CIDR"
                    value={localAddress}
                    onChange={(e) => setLocalAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remoteaddr">远程地址</Label>
                  <Input
                    id="remoteaddr"
                    placeholder="192.168.1.0/24"
                    value={remoteAddress}
                    onChange={(e) => setRemoteAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">程序关联</h2>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="program">程序路径</Label>
                <Input
                  id="program"
                  placeholder="C:\\Program Files\\App\\app.exe"
                  value={programPath}
                  onChange={(e) => setProgramPath(e.target.value)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline">重置</Button>
        <Button onClick={handleExport}>生成策略</Button>
      </div>

      <Dialog open={isHostDialogOpen} onOpenChange={setIsHostDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>选择目标主机</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <HostSelector data={mockData} onSelectionChange={handleHostSelectionChange} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHostDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmHostSelection}>确认选择</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
