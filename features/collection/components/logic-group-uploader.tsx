"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { FileText, Download, CheckCircle2, AlertCircle, X, Building2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Progress } from "@/shared/ui/progress"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { parseLogicGroupFile, generateLogicGroupTemplate } from "@/features/collection/lib/logic-group-parser"
import type { LogicGroupUploaderProps } from "@/features/collection/mock/logic-group-uploader-props"
import { useTranslations } from "next-intl"

export function LogicGroupUploader({
  onGroupsUploaded,
  onBeforeUpload,
  disabled = false,
  texts = {},
}: LogicGroupUploaderProps) {
  const t = useTranslations("pages.collection.logicGroupUploader")
  const defaultTexts = {
    title: t("title"),
    description: t("description"),
    dragDropText: t("dragDropText"),
    dragDropHint: t("dragDropHint"),
    uploadingText: t("uploadingText"),
    successText: t("successText"),
    errorText: t("errorText"),
    retryButtonText: t("retryButtonText"),
    resetButtonText: t("resetButtonText"),
    downloadTemplateText: t("downloadTemplateText"),
    ...texts,
  }

  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setErrorMessage("")

    if (!file.name.endsWith(".yml") && !file.name.endsWith(".yaml")) {
      setUploadStatus("error")
      setErrorMessage(t("yamlOnly"))
      return
    }

    if (onBeforeUpload) {
      try {
        const isValid = await onBeforeUpload(file)
        if (!isValid) {
          setUploadStatus("error")
          setErrorMessage(t("validationFailed"))
          return
        }
      } catch (error) {
        setUploadStatus("error")
        setErrorMessage(error instanceof Error ? error.message : t("validationFailed"))
        return
      }
    }

    setUploadStatus("uploading")
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const text = await file.text()
      const parsedGroups = parseLogicGroupFile(text)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus("success")

      onGroupsUploaded(parsedGroups, file.name)
    } catch (error) {
      clearInterval(progressInterval)
      setUploadStatus("error")
      setErrorMessage(error instanceof Error ? error.message : t("parseFailed"))
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateLogicGroupTemplate()
    const blob = new Blob([template], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "logic-group-template.yml"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setUploadStatus("idle")
    setUploadProgress(0)
    setFileName("")
    setErrorMessage("")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>

          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
              {defaultTexts.title}
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {defaultTexts.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            {defaultTexts.downloadTemplateText}
          </Button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-border"}
            ${uploadStatus === "idle" && !disabled ? "hover:border-primary/50 hover:bg-accent/50" : ""}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input
            type="file"
            accept=".yml,.yaml"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadStatus === "uploading" || disabled}
          />

          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {uploadStatus === "idle" && (
              <>
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">{defaultTexts.dragDropText}</p>
                  <p className="text-xs text-muted-foreground">{defaultTexts.dragDropHint}</p>
                </div>
              </>
            )}

            {uploadStatus === "uploading" && (
              <>
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="w-full max-w-xs space-y-2">
                  <p className="text-sm font-medium">
                    {defaultTexts.uploadingText} {fileName}
                  </p>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                </div>
              </>
            )}

            {uploadStatus === "success" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600">{defaultTexts.successText}</p>
                  <p className="text-xs text-muted-foreground">{fileName}</p>
                  <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 bg-transparent">
                    <X className="h-4 w-4" />
                    {defaultTexts.resetButtonText}
                  </Button>
                </div>
              </>
            )}

            {uploadStatus === "error" && (
              <>
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">{defaultTexts.errorText}</p>
                  <p className="text-xs text-muted-foreground">{errorMessage}</p>
                  <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 bg-transparent">
                    <X className="h-4 w-4" />
                    {defaultTexts.retryButtonText}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {uploadStatus === "error" && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
