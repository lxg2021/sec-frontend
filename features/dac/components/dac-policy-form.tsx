"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { Toaster } from "@/shared/ui/toaster"
import { Shield, FileText, RefreshCw, Download, Server } from "lucide-react"

import { useDacPolicyForm } from "@/features/dac/hooks/use-dac-policy-form"
import { PolicyHeaderForm } from "./policy-header-form"
import { PolicyBodyForm } from "./policy-body-form"
import { ActionControlForm } from "./action-control-form"
import { NetworkPolicyForm } from "./network-policy-form"

import type { DacPolicyFormProps, FilePolicy, RegistryPolicy, ProcessPolicy, NetworkPolicy } from "@/features/dac/types"
import HostSelector from "@/shared/components/host-selector"
import { mockData } from "@/features/baseline/dispatch/mock/host-tree"
import { useToast } from "@/shared/hooks/use-toast"
import { useTranslations } from "next-intl"

export function DacPolicyForm({ onPolicyGenerate }: DacPolicyFormProps) {
  const t = useTranslations("pages.response.dac")
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false)
  const [isPolicyDetailOpen, setIsPolicyDetailOpen] = useState(false)
  const [generatedPolicy, setGeneratedPolicy] = useState<FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy | null>(null)
  
  const { toast } = useToast()

  const form = useDacPolicyForm()

  const handleHostSelectionChange = (nodes: any[], ids: Set<string>) => {
    form.setSelectedHosts(nodes)
    form.setSelectedHostIds(ids)
  }

  const handleConfirmHostSelection = () => {
    setIsHostDialogOpen(false)
  }

  const generatePolicy = () => {
    const { promptActions, rejectActions, auditActions } = form.getCurrentActionStates()

    const targetHosts = Array.from(form.selectedHostIds).join(",")

    const baseHeader = {
      version: form.version,
      from: "system",
      to: targetHosts,
      id: crypto.randomUUID(),
      group: "",
      name: form.policyName,
      level: Number.parseInt(form.level),
      domain: "",
      time: new Date().toISOString(),
    }

    if (form.policyType === "net") {
      const policy: NetworkPolicy = {
        header: { ...baseHeader, type: "net" },
        body: {
          rule: {
            direction: form.netDirection,
            action: form.netAction,
            profile: form.netProfile,
          },
          protocol: {
            type: form.netProtocol,
            localport: form.localPort,
            remoteport: form.remotePort,
          },
          address: {
            local: form.localAddress,
            remote: form.remoteAddress,
          },
          program: {
            path: form.programPath,
          },
        },
      }
      return policy
    } else {
      const basePolicy = {
        header: { ...baseHeader, type: form.policyType },
        body: {
          except: { type: "ps", source: form.exceptSource },
          subject: { type: "ps", source: form.subjectSource },
          object: {
            type: form.policyType === "reg" ? "rg" : form.policyType,
            source: form.objectSource,
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
    // Validate common required fields
    if (!form.policyName.trim()) {
      toast({
        title: t("validationFailed"),
        description: t("policyNameRequired"),
        variant: "destructive",
      })
      return
    }

    if (!form.version.trim()) {
      toast({
        title: t("validationFailed"),
        description: t("versionRequired"),
        variant: "destructive",
      })
      return
    }

    if (!form.level.trim() || Number.parseInt(form.level) < 1 || Number.parseInt(form.level) > 254) {
      toast({
        title: t("validationFailed"),
        description: t("levelInvalid"),
        variant: "destructive",
      })
      return
    }

    // Validate policy type specific fields
    if (form.policyType !== "net") {
      if (!form.subjectSource.trim()) {
        toast({
          title: t("validationFailed"),
          description: t("subjectRequired"),
          variant: "destructive",
        })
        return
      }

      if (!form.objectSource.trim()) {
        toast({
          title: t("validationFailed"),
          description: t("objectRequired"),
          variant: "destructive",
        })
        return
      }

      const { promptActions, rejectActions, auditActions } = form.getCurrentActionStates()
      if (promptActions.length === 0 && rejectActions.length === 0 && auditActions.length === 0) {
        toast({
          title: t("validationFailed"),
          description: t("actionsRequired"),
          variant: "destructive",
        })
        return
      }
    } else {
      if (!form.programPath.trim()) {
        toast({
          title: t("validationFailed"),
          description: t("programPathRequired"),
          variant: "destructive",
        })
        return
      }
    }

    // All validations passed, generate policy
    const policy = generatePolicy()
    setGeneratedPolicy(policy)

    if (onPolicyGenerate) {
      onPolicyGenerate(policy)
    }

    toast({
      title: t("policyGenerated"),
      description: t("policyGeneratedDescription"),
    })
  }

  const handleViewPolicyDetail = () => {
    if (!generatedPolicy) {
      toast({
        title: t("noPolicyTitle"),
        description: t("noPolicyDescription"),
        variant: "destructive",
      })
      return
    }
    setIsPolicyDetailOpen(true)
  }

  const getPolicyTypeLabel = (type: string) => {
    switch (type) {
      case "fs": return t("filePolicy")
      case "reg": return t("registryPolicy")
      case "ps": return t("processPolicy")
      case "net": return t("networkPolicy")
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
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Policy Type Tabs */}
        <Tabs value={form.policyType} onValueChange={(v) => form.setPolicyType(v as any)} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="fs" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img src="/icons/nodes/file-node.svg" alt={t("filePolicy")} className="w-4 h-4" />
                {t("filePolicy")}
              </TabsTrigger>
              <TabsTrigger value="reg" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img src="/icons/nodes/reg-key-node.svg" alt={t("registryPolicy")} className="w-4 h-4" />
                {t("registryPolicy")}
              </TabsTrigger>
              <TabsTrigger value="ps" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img src="/icons/nodes/process-node.svg" alt={t("processPolicy")} className="w-4 h-4" />
                {t("processPolicy")}
              </TabsTrigger>
              <TabsTrigger value="net" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <img src="/icons/nodes/net-node.svg" alt={t("networkPolicy")} className="w-4 h-4" />
                {t("networkPolicy")}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Common Policy Form for fs, reg, ps */}
          {form.policyType !== "net" && (
            <TabsContent value={form.policyType} className="space-y-6">
              <PolicyHeaderForm
                policyType={form.policyType}
                version={form.version}
                policyName={form.policyName}
                level={form.level}
                selectedHostIds={form.selectedHostIds}
                onVersionChange={form.setVersion}
                onPolicyNameChange={form.setPolicyName}
                onLevelChange={form.setLevel}
                onHostSelect={() => setIsHostDialogOpen(true)}
              />

              <PolicyBodyForm
                policyType={form.policyType}
                exceptSource={form.exceptSource}
                subjectSource={form.subjectSource}
                objectSource={form.objectSource}
                onExceptSourceChange={form.setExceptSource}
                onSubjectSourceChange={form.setSubjectSource}
                onObjectSourceChange={form.setObjectSource}
              />

              <ActionControlForm
                promptActions={form.getCurrentActionStates().promptActions}
                rejectActions={form.getCurrentActionStates().rejectActions}
                auditActions={form.getCurrentActionStates().auditActions}
                availableActions={form.getCurrentActions()}
                onPromptActionToggle={form.handlePromptActionToggle}
                onRejectActionToggle={form.handleRejectActionToggle}
                onAuditActionToggle={form.handleAuditActionToggle}
              />
            </TabsContent>
          )}

          {/* Network Policy Tab */}
          <TabsContent value="net" className="space-y-6">
            <PolicyHeaderForm
              policyType="net"
              version={form.version}
              policyName={form.policyName}
              level={form.level}
              selectedHostIds={form.selectedHostIds}
              onVersionChange={form.setVersion}
              onPolicyNameChange={form.setPolicyName}
              onLevelChange={form.setLevel}
              onHostSelect={() => setIsHostDialogOpen(true)}
              title={t("networkPolicyBasicInfo")}
              showBadge={true}
            />

            <NetworkPolicyForm
              netDirection={form.netDirection}
              netAction={form.netAction}
              netProfile={form.netProfile}
              netProtocol={form.netProtocol}
              localPort={form.localPort}
              remotePort={form.remotePort}
              localAddress={form.localAddress}
              remoteAddress={form.remoteAddress}
              programPath={form.programPath}
              onDirectionChange={form.setNetDirection}
              onActionChange={form.setNetAction}
              onProfileChange={form.setNetProfile}
              onProtocolChange={form.setNetProtocol}
              onLocalPortChange={form.setLocalPort}
              onRemotePortChange={form.setRemotePort}
              onLocalAddressChange={form.setLocalAddress}
              onRemoteAddressChange={form.setRemoteAddress}
              onProgramPathChange={form.setProgramPath}
            />
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
            {t("generatePolicy")}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={form.resetForm}
          >
            <RefreshCw className="w-4 h-4" />
            {t("reset")}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleViewPolicyDetail}
            disabled={!generatedPolicy}
          >
            <FileText className="w-4 h-4" />
            {t("policyDetails")}
          </Button>
        </div>

        {/* Host Selection Dialog */}
        <Dialog open={isHostDialogOpen} onOpenChange={setIsHostDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {t("selectTargetHosts")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto min-h-[400px]">
              <HostSelector data={mockData} onSelectionChange={handleHostSelectionChange} />
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {form.selectedHostIds.size > 0 ? t("selectedHosts", { count: form.selectedHostIds.size }) : t("noHostsSelected")}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsHostDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleConfirmHostSelection}>
                  {t("confirmSelection")}
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
                {t("policyDetailsJson")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-gray-50 rounded-md p-4">
              <pre className="text-sm whitespace-pre-wrap break-words">
                {generatedPolicy ? JSON.stringify(generatedPolicy, null, 2) : t("noPolicyData")}
              </pre>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {generatedPolicy ? t("policyType", { type: getPolicyTypeLabel(generatedPolicy.header.type) }) : t("noPolicy")}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (generatedPolicy) {
                      navigator.clipboard.writeText(JSON.stringify(generatedPolicy, null, 2))
                      toast({
                        title: t("copied"),
                        description: t("copiedDescription"),
                      })
                    }
                  }}
                >
                  {t("copyJson")}
                </Button>
                <Button onClick={() => setIsPolicyDetailOpen(false)}>
                  {t("close")}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
