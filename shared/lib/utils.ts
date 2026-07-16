import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createRequestId() {
  return uuidv4()
}

export function createNumericRequestId() {
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")
  return `${Date.now()}${random}`
}
