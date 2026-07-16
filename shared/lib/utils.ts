import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

let numericRequestSequence = Math.floor(Math.random() * 1_000_000)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createRequestId() {
  return createNumericRequestId()
}

export function createUuidRequestId() {
  return uuidv4()
}

export function createNumericRequestId() {
  numericRequestSequence = (numericRequestSequence + 1) % 1_000_000
  const sequence = numericRequestSequence
    .toString()
    .padStart(6, "0")
  return `${Date.now()}${sequence}`
}
