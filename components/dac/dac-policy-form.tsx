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
import { Server, HelpCircle, AlertCircle, FileText, RefreshCw, Download } from "lucide-react"
import type { PolicyType, NetworkPolicy, FilePolicy, RegistryPolicy, ProcessPolicy } from "@/components/dac/dacpolicy"
import { ActionCard, type ActionOption } from "@/components/dac/action-card"
import HostSelector from "@/components/hosts/HostSelector"
import { mockData } from "@/data/mockData"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Shield } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

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

  // 新增状态：策略详情对话框
  const [isPolicyDetailOpen, setIsPolicyDetailOpen] = useState(false)
  const [generatedPolicy, setGeneratedPolicy] = useState<FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy | null>(null)

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

  // 重置表单函数
  const resetForm = () => {
    setPolicyType("fs")
    setVersion("v1.0")
    setPolicyName("")
    setLevel("50")
    setExceptSource("")
    setSubjectSource("")
    setObjectSource("")

    setSelectedHosts([])
    setSelectedHostIds(new Set())

    setFsPromptActions([])
    setFsRejectActions([])
    setFsAuditActions([])

    setRegPromptActions([])
    setRegRejectActions([])
    setRegAuditActions([])

    setPsPromptActions([])
    setPsRejectActions([])
    setPsAuditActions([])

    // 重置网络策略状态
    setNetDirection("in")
    setNetAction("allow")
    setNetProfile("any")
    setNetProtocol("tcp")
    setLocalPort("80,443,8080")
    setRemotePort("any")
    setLocalAddress("any")
    setRemoteAddress("192.168.1.0/24")
    setProgramPath("C:\\Program Files\\App\\app.exe")

    // 重置生成的策略
    setGeneratedPolicy(null)

    toast({
      title: "表单已重置",
      description: "所有字段已恢复到初始状态",
    })
  }

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

    // 保存生成的策略用于详情展示
    setGeneratedPolicy(policy)

    if (onPolicyGenerate) {
      onPolicyGenerate(policy)
    }

    toast({
      title: "策略生成成功",
      description: "策略已生成，请查看控制台输出",
    })
  }

  // 查看策略详情
  const handleViewPolicyDetail = () => {
    if (!generatedPolicy) {
      toast({
        title: "暂无策略",
        description: "请先生成策略后再查看详情",
        variant: "destructive",
      })
      return
    }
    setIsPolicyDetailOpen(true)
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

  const getPolicyTypeLabel = (type: PolicyType) => {
    switch (type) {
      case "fs": return "文件系统"
      case "reg": return "注册表"
      case "ps": return "进程"
      case "net": return "网络"
      default: return type
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          {/* 页面标题区域 */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {/* 这里可以换成 Graph 图标 */}
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                访问控制
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Discretionary Access Control
              </p>
            </div>
          </div>
        </div>

        {/* Policy Type Tabs */}
        <Tabs value={policyType} onValueChange={(v) => setPolicyType(v as PolicyType)} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="fs" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img
                  src="/icons/nodes/file-node.svg"
                  alt="file"
                  className="w-4 h-4"
                />
                文件策略
              </TabsTrigger>
              <TabsTrigger value="reg" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img
                  src="/icons/nodes/reg-key-node.svg"
                  alt="file"
                  className="w-4 h-4"
                />
                注册表策略
              </TabsTrigger>
              <TabsTrigger value="ps" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img
                  src="/icons/nodes/process-node.svg"
                  alt="file"
                  className="w-4 h-4"
                />
                进程策略
              </TabsTrigger>
              <TabsTrigger value="net" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img
                  src="/icons/nodes/net-node.svg"
                  alt="file"
                  className="w-4 h-4"
                />
                网络策略
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Common Policy Form for fs, reg, ps */}
          {policyType !== "net" && (
            <TabsContent value={policyType} className="space-y-6">
              {/* Policy Header Card */}
              <Card className="p-6 border-l-4 border-l-primary shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">策略基础信息</h2>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="version" className="text-sm font-medium">版本</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            策略版本号，例如 v1.0
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="version"
                        placeholder="v1.0"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="name" className="text-sm font-medium">策略名称</Label>
                        <span className="text-red-500 text-sm">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            策略的友好名称，用于识别和管理
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="name"
                        placeholder={`${getPolicyTypeLabel(policyType)}访问控制策略`}
                        value={policyName}
                        onChange={(e) => setPolicyName(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="level" className="text-sm font-medium">优先级</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            策略优先级，数值越小优先级越高，范围 1-254
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <Input
                          id="level"
                          type="number"
                          min="1"
                          max="254"
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="bg-background pr-12"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Badge variant="outline" className="text-xs bg-muted">
                            1-254
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="target-host" className="text-sm font-medium">目标主机</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            应用此策略的目标主机
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Button
                        id="target-host"
                        variant="outline"
                        className="w-full justify-between h-10 bg-background hover:bg-muted/50"
                        onClick={() => setIsHostDialogOpen(true)}
                      >
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          <span className={selectedHostIds.size > 0 ? "font-medium" : "text-muted-foreground"}>
                            {selectedHostIds.size > 0 ? `${selectedHostIds.size} 台主机` : "选择主机"}
                          </span>
                        </div>
                        {selectedHostIds.size > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedHostIds.size}
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Policy Body Card */}
              <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">策略主体配置</h2>
                  </div>
                  <Separator />
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="except" className="text-sm font-medium">例外进程</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            不受此策略限制的进程
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="except"
                        placeholder="例如: *\rcSvc.exe (支持 * # ? 通配符，多项用分号分隔)"
                        value={exceptSource}
                        onChange={(e) => setExceptSource(e.target.value)}
                        className="bg-background"
                      />

                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="subject" className="text-sm font-medium">主体进程</Label>
                        <span className="text-red-500 text-sm">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            执行操作的进程路径，支持 * # ? 通配符
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="subject"
                        placeholder={
                          policyType === "fs"
                            ? "例如: *\\notepad.exe 或 C:\\Windows\\System32\\*.exe"
                            : policyType === "reg"
                              ? "例如: *\\regedit.exe 或 *\\powershell.exe"
                              : "例如: *\\taskmgr.exe 或 C:\\Program Files\\**\\*.exe"
                        }
                        value={subjectSource}
                        onChange={(e) => setSubjectSource(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="object" className="text-sm font-medium">
                          客体{policyType === "fs" ? "文件" : policyType === "reg" ? "注册表" : "进程"}
                        </Label>
                        <span className="text-red-500 text-sm">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            被操作的目标路径，支持 * # ? 通配符
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="object"
                        placeholder={
                          policyType === "fs"
                            ? "例如: C:\\Data\\*.txt 或 D:\\**\\*.log"
                            : policyType === "reg"
                              ? "例如: HKEY_CURRENT_USER\\Software\\* 或 HKEY_LOCAL_MACHINE\\**\\Run"
                              : "例如: *\\calc.exe 或 C:\\Windows\\System32\\*.exe"
                        }
                        value={objectSource}
                        onChange={(e) => setObjectSource(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Action Control Card */}
              <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">行为控制配置</h2>
                  </div>
                  <Separator />
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <ActionCard
                        title="用户决断"
                        description="需要用户确认的敏感操作"
                        actions={getCurrentActionStates().promptActions}
                        availableActions={getCurrentActions()}
                        onActionToggle={handlePromptActionToggle}
                        disabledActions={getCurrentActionStates().rejectActions}
                        badgeColor="outline"
                        className="border-yellow-200 bg-yellow-50/50"
                      />

                      <ActionCard
                        title="拒绝行为"
                        description="直接阻止的危险操作"
                        actions={getCurrentActionStates().rejectActions}
                        availableActions={getCurrentActions()}
                        onActionToggle={handleRejectActionToggle}
                        disabledActions={getCurrentActionStates().promptActions}
                        badgeColor="destructive"
                        className="border-red-200 bg-red-50/50"
                      />

                      <ActionCard
                        title="审计行为"
                        description="仅记录日志的监控操作"
                        actions={getCurrentActionStates().auditActions}
                        availableActions={getCurrentActions()}
                        onActionToggle={handleAuditActionToggle}
                        badgeColor="secondary"
                        className="border-blue-200 bg-blue-50/50"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}

          {/* Network Policy Tab */}
          <TabsContent value="net" className="space-y-6">
            {/* Network Policy Header */}
            <Card className="p-6 border-l-4 border-l-primary shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">网络策略基础信息</h2>
                    <Badge variant="secondary" className="text-xs">
                      网络控制
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="net-version" className="text-sm font-medium">版本</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          策略版本号，例如 v1.0
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="net-version"
                      placeholder="v1.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="net-name" className="text-sm font-medium">策略名称</Label>
                      <span className="text-red-500 text-sm">*</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          策略的友好名称，用于识别和管理
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="net-name"
                      placeholder="网络访问控制策略"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="net-level" className="text-sm font-medium">优先级</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          策略优先级，数值越小优先级越高，范围 1-254
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Input
                        id="net-level"
                        type="number"
                        min="1"
                        max="254"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="bg-background pr-12"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Badge variant="outline" className="text-xs bg-muted">
                          1-254
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="net-target-host" className="text-sm font-medium">目标主机</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          应用此策略的目标主机
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Button
                      id="net-target-host"
                      variant="outline"
                      className="w-full justify-between h-10 bg-background hover:bg-muted/50"
                      onClick={() => setIsHostDialogOpen(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        <span className={selectedHostIds.size > 0 ? "font-medium" : "text-muted-foreground"}>
                          {selectedHostIds.size > 0 ? `${selectedHostIds.size} 台主机` : "选择主机"}
                        </span>
                      </div>
                      {selectedHostIds.size > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedHostIds.size}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Network Rule Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">规则配置</h2>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="direction" className="text-sm font-medium">流量方向</Label>
                      <Select value={netDirection} onValueChange={(v) => setNetDirection(v as any)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">入站 (Inbound)</SelectItem>
                          <SelectItem value="out">出站 (Outbound)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="action" className="text-sm font-medium">处理动作</Label>
                      <Select value={netAction} onValueChange={(v) => setNetAction(v as any)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="allow">允许 (Allow)</SelectItem>
                          <SelectItem value="block">阻止 (Block)</SelectItem>
                          <SelectItem value="bypass">绕过 (Bypass)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="profile" className="text-sm font-medium">网络配置文件</Label>
                      <Select value={netProfile} onValueChange={(v) => setNetProfile(v as any)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="domain">域网络 (Domain)</SelectItem>
                          <SelectItem value="private">专用网络 (Private)</SelectItem>
                          <SelectItem value="public">公用网络 (Public)</SelectItem>
                          <SelectItem value="any">所有网络 (Any)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">协议和端口</h2>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="protocol" className="text-sm font-medium">协议类型</Label>
                      <Select value={netProtocol} onValueChange={(v) => setNetProtocol(v as any)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="udp">UDP</SelectItem>
                          <SelectItem value="icmp">ICMP</SelectItem>
                          <SelectItem value="any">所有协议 (Any)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="localport" className="text-sm font-medium">本地端口</Label>
                      <Input
                        id="localport"
                        placeholder="80,443,8080 或 any"
                        value={localPort}
                        onChange={(e) => setLocalPort(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="remoteport" className="text-sm font-medium">远程端口</Label>
                      <Input
                        id="remoteport"
                        placeholder="any 或具体端口"
                        value={remotePort}
                        onChange={(e) => setRemotePort(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-l-purple-500 shadow-sm">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">地址范围</h2>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="localaddr" className="text-sm font-medium">本地地址</Label>
                      <Input
                        id="localaddr"
                        placeholder="any 或 IP/CIDR"
                        value={localAddress}
                        onChange={(e) => setLocalAddress(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="remoteaddr" className="text-sm font-medium">远程地址</Label>
                      <Input
                        id="remoteaddr"
                        placeholder="192.168.1.0/24"
                        value={remoteAddress}
                        onChange={(e) => setRemoteAddress(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">程序关联</h2>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="program" className="text-sm font-medium">程序路径</Label>
                      <span className="text-red-500 text-sm">*</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          应用此网络规则的进程路径，支持通配符匹配多个程序
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="program"
                      placeholder="C:\\Program Files\\App\\app.exe"
                      value={programPath}
                      onChange={(e) => setProgramPath(e.target.value)}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      应用此网络规则的进程路径，支持通配符匹配多个程序
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">

          <Button
            size="lg"
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            生成策略
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={resetForm}
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleViewPolicyDetail}
            disabled={!generatedPolicy}
          >
            <FileText className="w-4 h-4" />
            策略详情
          </Button>

        </div>

        {/* Host Selection Dialog */}
        <Dialog open={isHostDialogOpen} onOpenChange={setIsHostDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                选择目标主机
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto min-h-[400px]">
              <HostSelector data={mockData} onSelectionChange={handleHostSelectionChange} />
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedHostIds.size > 0 ? `已选择 ${selectedHostIds.size} 台主机` : "未选择任何主机"}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsHostDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleConfirmHostSelection}>
                  确认选择
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Policy Detail Dialog */}
        <Dialog open={isPolicyDetailOpen} onOpenChange={setIsPolicyDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                策略详情 - JSON 格式
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-gray-50 rounded-md p-4">
              <pre className="text-sm whitespace-pre-wrap break-words">
                {generatedPolicy ? JSON.stringify(generatedPolicy, null, 2) : "暂无策略数据"}
              </pre>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {generatedPolicy ? `策略类型: ${getPolicyTypeLabel(generatedPolicy.header.type as PolicyType)}` : "无策略"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (generatedPolicy) {
                      navigator.clipboard.writeText(JSON.stringify(generatedPolicy, null, 2))
                      toast({
                        title: "已复制",
                        description: "策略JSON已复制到剪贴板",
                      })
                    }
                  }}
                >
                  复制JSON
                </Button>
                <Button onClick={() => setIsPolicyDetailOpen(false)}>
                  关闭
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </TooltipProvider >
  )
}