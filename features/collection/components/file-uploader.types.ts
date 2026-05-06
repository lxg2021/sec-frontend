import type { CollectionImportData } from "@/features/collection/types"

export interface FileUploaderProps {
  onFileUploaded: (data: CollectionImportData, fileName: string) => void
  onBeforeUpload?: (file: File) => Promise<boolean> | boolean
  templateData?: object
  templateFileName?: string
  accept?: string[]
  acceptDisplay?: string
  disabled?: boolean
  texts?: {
    title?: string
    description?: string
    dragDropText?: string
    dragDropHint?: string
    uploadingText?: string
    successText?: string
    errorText?: string
    retryButtonText?: string
    resetButtonText?: string
    downloadTemplateText?: string
  }
}
