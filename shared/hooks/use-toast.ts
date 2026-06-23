"use client"

import * as React from "react"
import { toast as sonnerToast, type ExternalToast } from "sonner"

import type { ToastProps } from "@/shared/ui/toast"

type ToastVariant =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "loading"

type ToasterToast = Omit<
  Partial<ToastProps>,
  "id" | "title" | "description" | "action" | "variant"
> &
  Omit<ExternalToast, "id" | "description"> & {
    id?: string | number
    title?: React.ReactNode
    description?: React.ReactNode
    variant?: ToastVariant
  }

type Toast = Omit<ToasterToast, "id">

function getMessageParts(title?: React.ReactNode, description?: React.ReactNode) {
  const message = title ?? description ?? ""
  const details = title && description ? description : undefined
  return { message, details }
}

function showToast({
  id,
  title,
  description,
  variant = "default",
  ...options
}: ToasterToast) {
  const { message, details } = getMessageParts(title, description)
  const toastOptions: ExternalToast = {
    ...options,
    id,
    description: details,
  }

  switch (variant) {
    case "success":
      return sonnerToast.success(message, toastOptions)
    case "info":
      return sonnerToast.info(message, toastOptions)
    case "warning":
      return sonnerToast.warning(message, toastOptions)
    case "destructive":
      return sonnerToast.error(message, toastOptions)
    case "loading":
      return sonnerToast.loading(message, toastOptions)
    default:
      return sonnerToast(message, toastOptions)
  }
}

function toast(props: Toast) {
  const id = showToast(props)

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: ToasterToast) => showToast({ ...props, ...next, id }),
  }
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
    toasts: [] as ToasterToast[],
  }
}

export { useToast, toast, type ToastVariant }
