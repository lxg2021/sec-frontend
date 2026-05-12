"use client"

import { useTranslations } from "next-intl"
import { RefreshCw } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"

interface CreateBaselineFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  displayName: string
  description: string
  standard: string
  profile: string
  baselineVersion: string
  metadata: {
    product: string
    os_version: string
  } | null
  selectedTemplateCount: number
  selectedItemCount: number
  errorMessage: string
  submitting: boolean
  submitDisabled: boolean
  onDisplayNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onStandardChange: (value: string) => void
  onProfileChange: (value: string) => void
  onBaselineVersionChange: (value: string) => void
  onReset: () => void
  onSubmit: () => void
}

export function CreateBaselineForm({
  open,
  onOpenChange,
  displayName,
  description,
  standard,
  profile,
  baselineVersion,
  metadata,
  selectedTemplateCount,
  selectedItemCount,
  errorMessage,
  submitting,
  submitDisabled,
  onDisplayNameChange,
  onDescriptionChange,
  onStandardChange,
  onProfileChange,
  onBaselineVersionChange,
  onReset,
  onSubmit,
}: CreateBaselineFormProps) {
  const t = useTranslations("pages.baseline.custom")
  const standardOptions = [
    { value: "cis", label: "CIS" },
    { value: "dod", label: "DoD" },
    { value: "msft", label: "Microsoft" },
    { value: "tls", label: "TLS" },
    { value: "intune", label: "Intune" },
    { value: "custom", label: t("templateSelector.standards.custom") },
    { value: "other", label: "Other" },
  ]
  const profileOptions = [
    { value: "machine", label: t("templateSelector.profiles.machine") },
    { value: "user", label: t("templateSelector.profiles.user") },
    { value: "both", label: t("templateSelector.profiles.both") },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-zinc-950">{t("createForm.title")}</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            {t("createForm.selectedDescription", { selectedItemCount, selectedTemplateCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-zinc-200/80 shadow-sm">
            <CardHeader className="border-b border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/60 pb-4">
              <CardTitle className="text-base font-semibold text-foreground">{t("createForm.infoTitle")}</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">{t("createForm.infoDescription")}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              {errorMessage ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="display-name">
                  {t("createForm.baselineName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(event) => onDisplayNameChange(event.target.value)}
                  placeholder={t("createForm.baselineNamePlaceholder")}
                  className="h-10 rounded-xl border-zinc-200 shadow-none focus-visible:border-blue-300"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">{t("createForm.descriptionLabel")}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  placeholder={t("createForm.descriptionPlaceholder")}
                  className="min-h-28 resize-none rounded-xl border-zinc-200 shadow-none focus-visible:border-blue-300"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="baseline-version">
                  {t("createForm.baselineVersionLabel")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="baseline-version"
                  value={baselineVersion}
                  onChange={(event) => onBaselineVersionChange(event.target.value)}
                  placeholder={t("createForm.baselineVersionPlaceholder")}
                  className="h-10 rounded-xl border-zinc-200 shadow-none focus-visible:border-blue-300"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 shadow-sm">
            <CardHeader className="border-b border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/60 pb-4">
              <CardTitle className="text-base font-semibold text-foreground">{t("createForm.templateMetadataTitle")}</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">{t("createForm.templateMetadataDescription")}</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="metadata-standard">{t("createForm.standardLabel")}</Label>
                <Select value={standard} onValueChange={onStandardChange}>
                  <SelectTrigger id="metadata-standard" className="h-10 rounded-xl border-zinc-200 bg-white shadow-none focus:border-blue-300">
                    <SelectValue placeholder={t("createForm.standardPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {standardOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metadata-product">{t("createForm.productLabel")}</Label>
                <Input id="metadata-product" value={metadata?.product ?? ""} readOnly className="h-10 rounded-xl border-zinc-200 bg-zinc-50 text-zinc-700 shadow-none" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metadata-os-version">{t("createForm.osVersionLabel")}</Label>
                <Input id="metadata-os-version" value={metadata?.os_version ?? ""} readOnly className="h-10 rounded-xl border-zinc-200 bg-zinc-50 text-zinc-700 shadow-none" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metadata-profile">
                  {t("createForm.profileLabel")} <span className="text-destructive">*</span>
                </Label>
                <Select value={profile} onValueChange={onProfileChange}>
                  <SelectTrigger id="metadata-profile" className="h-10 rounded-xl border-zinc-200 bg-white shadow-none focus:border-blue-300">
                    <SelectValue placeholder={t("createForm.profilePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {profileOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onReset} disabled={submitting} className="rounded-xl border-zinc-200 shadow-none">
            {t("createForm.reset")}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled || submitting || selectedItemCount === 0}
            className="rounded-xl bg-gradient-to-r from-zinc-950 to-zinc-800 shadow-sm shadow-zinc-300/40 hover:from-zinc-900 hover:to-zinc-700"
          >
            {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {t("createForm.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
