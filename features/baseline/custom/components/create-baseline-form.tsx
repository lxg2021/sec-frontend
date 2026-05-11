"use client"

import { useTranslations } from "next-intl"
import { RefreshCw } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

interface CreateBaselineFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  displayName: string
  description: string
  selectedTemplateCount: number
  selectedItemCount: number
  errorMessage: string
  submitting: boolean
  onDisplayNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onReset: () => void
  onSubmit: () => void
}

export function CreateBaselineForm({
  open,
  onOpenChange,
  displayName,
  description,
  selectedTemplateCount,
  selectedItemCount,
  errorMessage,
  submitting,
  onDisplayNameChange,
  onDescriptionChange,
  onReset,
  onSubmit,
}: CreateBaselineFormProps) {
  const t = useTranslations("pages.baseline.custom")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-zinc-950">{t("createForm.title")}</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            {t("createForm.selectedDescription", { selectedItemCount, selectedTemplateCount })}
          </DialogDescription>
        </DialogHeader>

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
          </CardContent>
        </Card>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onReset} disabled={submitting} className="rounded-xl border-zinc-200 shadow-none">
            {t("createForm.reset")}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitting || selectedItemCount === 0}
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
