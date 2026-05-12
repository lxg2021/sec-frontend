"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"

import type {
  ToastActionElement,
  ToastProps,
} from "@/shared/ui/toast"

type ToasterToast = Partial<ToastProps> & {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive"
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
  variant,
}: ToasterToast) {
  const { message, details } = getMessageParts(title, description)

  if (variant === "destructive") {
    return sonnerToast.error(message, {
      id,
      description: details,
    })
  }

  return sonnerToast(message, {
    id,
    description: details,
  })
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
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
    toasts: [] as ToasterToast[],
  }
}

export { useToast, toast }
