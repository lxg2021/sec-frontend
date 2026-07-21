import type { Host, HostFilterOptions } from "@/features/assets/approval/types"

export function filterHosts(hosts: Host[], filters: HostFilterOptions): Host[] {
  return hosts.filter((host) => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(host.status)) {
      return false
    }

    if (filters.groupIds && filters.groupIds.length > 0) {
      if (!host.group || !filters.groupIds.includes(host.group.id)) {
        return false
      }
    }

    if (filters.ownerIds && filters.ownerIds.length > 0) {
      if (!host.owner || !filters.ownerIds.includes(host.owner.user_id)) {
        return false
      }
    }

    if (filters.ungrouped || filters.unowned) {
      const isUngrouped = !host.group
      const isUnowned = !host.owner

      if (filters.ungrouped && filters.unowned) {
        if (!isUngrouped && !isUnowned) {
          return false
        }
      } else if (filters.ungrouped && !isUngrouped) {
        return false
      } else if (filters.unowned && !isUnowned) {
        return false
      }
    }

    if (filters.searchText && filters.searchText.trim() !== "") {
      const searchLower = filters.searchText.toLowerCase()
      const matchesHostname = host.hostname.toLowerCase().includes(searchLower)
      const matchesIp = host.ip.some((ip) => ip.toLowerCase().includes(searchLower))
      const matchesMac = host.macs.some((mac) => mac.toLowerCase().includes(searchLower))
      const matchesOwner = host.owner?.owner_name.toLowerCase().includes(searchLower)
      const matchesGroup = host.group?.name.toLowerCase().includes(searchLower)

      if (!matchesHostname && !matchesIp && !matchesMac && !matchesOwner && !matchesGroup) {
        return false
      }
    }

    return true
  })
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => boolean
}

export interface FieldValidation {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export const HOST_VALIDATION_RULES: FieldValidation = {
  ownerName: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/,
  },
  ownerPhone: {
    pattern: /^(\d{3,4}-?\d{7,8}|1[3-9]\d{9})?$/,
  },
  ownerEmail: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  ownerRole: {
    required: true,
  },
  groupId: {},
}

export const DEFAULT_VALIDATION_MESSAGES = {
  ownerName: {
    required: "Owner name is required.",
    minLength: "Owner name must contain at least 1 character.",
    maxLength: "Owner name cannot exceed 50 characters.",
    pattern: "Owner name can only contain Chinese, English, and spaces.",
  },
  ownerPhone: {
    pattern: "Enter a valid phone number.",
  },
  ownerEmail: {
    pattern: "Enter a valid email address.",
  },
  ownerRole: {
    required: "Owner role is required.",
  },
}

export type ValidationMessages = typeof DEFAULT_VALIDATION_MESSAGES

export function validateHostData(
  data: {
    ownerName: string
    ownerPhone: string
    ownerEmail: string
    ownerRole: string
    selectedGroupId?: string
  },
  messages: ValidationMessages = DEFAULT_VALIDATION_MESSAGES,
): ValidationResult {
  const errors: Record<string, string> = {}

  if (HOST_VALIDATION_RULES.ownerName.required && !data.ownerName.trim()) {
    errors.ownerName = messages.ownerName.required
  } else if (
    data.ownerName.trim() &&
    HOST_VALIDATION_RULES.ownerName.minLength &&
    data.ownerName.trim().length < HOST_VALIDATION_RULES.ownerName.minLength
  ) {
    errors.ownerName = messages.ownerName.minLength
  } else if (
    data.ownerName.trim() &&
    HOST_VALIDATION_RULES.ownerName.maxLength &&
    data.ownerName.trim().length > HOST_VALIDATION_RULES.ownerName.maxLength
  ) {
    errors.ownerName = messages.ownerName.maxLength
  } else if (
    data.ownerName.trim() &&
    HOST_VALIDATION_RULES.ownerName.pattern &&
    !HOST_VALIDATION_RULES.ownerName.pattern.test(data.ownerName.trim())
  ) {
    errors.ownerName = messages.ownerName.pattern
  }

  if (
    data.ownerPhone.trim() &&
    HOST_VALIDATION_RULES.ownerPhone.pattern &&
    !HOST_VALIDATION_RULES.ownerPhone.pattern.test(data.ownerPhone.trim())
  ) {
    errors.ownerPhone = messages.ownerPhone.pattern
  }

  if (
    data.ownerEmail.trim() &&
    HOST_VALIDATION_RULES.ownerEmail.pattern &&
    !HOST_VALIDATION_RULES.ownerEmail.pattern.test(data.ownerEmail.trim())
  ) {
    errors.ownerEmail = messages.ownerEmail.pattern
  }

  if (HOST_VALIDATION_RULES.ownerRole.required && !data.ownerRole.trim()) {
    errors.ownerRole = messages.ownerRole.required
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateField(
  fieldName: string,
  value: string,
  messages: ValidationMessages = DEFAULT_VALIDATION_MESSAGES,
): string | null {
  const rules = HOST_VALIDATION_RULES[fieldName as keyof typeof HOST_VALIDATION_RULES]
  const fieldMessages = messages[fieldName as keyof typeof messages]

  if (!rules || !fieldMessages) return null

  if (rules.required && !value.trim() && "required" in fieldMessages) {
    return fieldMessages.required
  }

  if (value.trim()) {
    if ("minLength" in fieldMessages && rules.minLength && value.trim().length < rules.minLength) {
      return fieldMessages.minLength
    }

    if ("maxLength" in fieldMessages && rules.maxLength && value.trim().length > rules.maxLength) {
      return fieldMessages.maxLength
    }

    if ("pattern" in fieldMessages && rules.pattern && !rules.pattern.test(value.trim())) {
      return fieldMessages.pattern
    }
  }

  return null
}
