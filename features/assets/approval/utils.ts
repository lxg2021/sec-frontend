import type { Host, HostFilterOptions } from "@/features/assets/approval/types"

/**
 * Filter hosts based on the provided filter options
 */
export function filterHosts(hosts: Host[], filters: HostFilterOptions): Host[] {
  return hosts.filter((host) => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(host.status)) {
        return false
      }
    }

    // Group filter
    if (filters.groupIds && filters.groupIds.length > 0) {
      if (!host.group || !filters.groupIds.includes(host.group.id)) {
        return false
      }
    }

    // Owner filter
    if (filters.ownerIds && filters.ownerIds.length > 0) {
      if (!host.owner || !filters.ownerIds.includes(host.owner.user_id)) {
        return false
      }
    }

    // Ungrouped and Unowned filters (OR relationship)
    if (filters.ungrouped || filters.unowned) {
      const isUngrouped = !host.group
      const isUnowned = !host.owner

      // If both filters are enabled, host must match at least one condition (OR)
      if (filters.ungrouped && filters.unowned) {
        if (!isUngrouped && !isUnowned) {
          return false
        }
      }
      // If only ungrouped filter is enabled
      else if (filters.ungrouped && !isUngrouped) {
        return false
      }
      // If only unowned filter is enabled
      else if (filters.unowned && !isUnowned) {
        return false
      }
    }

    // Search text filter
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

/**
 * Validate host owner information
 */
// 验证规则和错误消息
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface FieldValidation {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 验证规则定义
export const HOST_VALIDATION_RULES: FieldValidation = {
  ownerName: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/, // 中英文和空格
  },
  ownerPhone: {
    pattern: /^(\d{3,4}-?\d{7,8}|1[3-9]\d{9})?$/, // 手机号或固定电话，可选
  },
  ownerEmail: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // 基本邮箱格式
  },
  ownerRole: {
    required: true,
  },
  groupId: {
    // 逻辑组ID验证
  },
};

// 错误消息
export const VALIDATION_MESSAGES = {
  ownerName: {
    required: '负责人姓名不能为空',
    minLength: '负责人姓名至少需要1个字符',
    maxLength: '负责人姓名不能超过50个字符',
    pattern: '负责人姓名只能包含中文、英文和空格',
  },
  ownerPhone: {
    pattern: '请输入有效的电话号码格式',
  },
  ownerEmail: {
    pattern: '请输入有效的邮箱地址',
  },
  ownerRole: {
    required: '负责人角色不能为空',
  },
};

// 验证函数
export function validateHostData(data: {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerRole: string;
  selectedGroupId?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // 验证负责人姓名
  if (HOST_VALIDATION_RULES.ownerName.required && !data.ownerName.trim()) {
    errors.ownerName = VALIDATION_MESSAGES.ownerName.required;
  } else if (data.ownerName.trim() && HOST_VALIDATION_RULES.ownerName.minLength && 
             data.ownerName.trim().length < HOST_VALIDATION_RULES.ownerName.minLength) {
    errors.ownerName = VALIDATION_MESSAGES.ownerName.minLength;
  } else if (data.ownerName.trim() && HOST_VALIDATION_RULES.ownerName.maxLength && 
             data.ownerName.trim().length > HOST_VALIDATION_RULES.ownerName.maxLength) {
    errors.ownerName = VALIDATION_MESSAGES.ownerName.maxLength;
  } else if (data.ownerName.trim() && HOST_VALIDATION_RULES.ownerName.pattern && 
             !HOST_VALIDATION_RULES.ownerName.pattern.test(data.ownerName.trim())) {
    errors.ownerName = VALIDATION_MESSAGES.ownerName.pattern;
  }

  // 验证电话号码
  if (data.ownerPhone.trim() && HOST_VALIDATION_RULES.ownerPhone.pattern && 
      !HOST_VALIDATION_RULES.ownerPhone.pattern.test(data.ownerPhone.trim())) {
    errors.ownerPhone = VALIDATION_MESSAGES.ownerPhone.pattern;
  }

  // 验证邮箱
  if (data.ownerEmail.trim() && HOST_VALIDATION_RULES.ownerEmail.pattern && 
      !HOST_VALIDATION_RULES.ownerEmail.pattern.test(data.ownerEmail.trim())) {
    errors.ownerEmail = VALIDATION_MESSAGES.ownerEmail.pattern;
  }

  // 验证角色
  if (HOST_VALIDATION_RULES.ownerRole.required && !data.ownerRole.trim()) {
    errors.ownerRole = VALIDATION_MESSAGES.ownerRole.required;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 实时验证单个字段
export function validateField(fieldName: string, value: string): string | null {
  const rules = HOST_VALIDATION_RULES[fieldName as keyof typeof HOST_VALIDATION_RULES];
  const messages = VALIDATION_MESSAGES[fieldName as keyof typeof VALIDATION_MESSAGES];

  if (!rules) return null;

  if (rules.required && !value.trim()) {
    return messages.required;
  }

  if (value.trim()) {
    if (rules.minLength && value.trim().length < rules.minLength) {
      return messages.minLength;
    }

    if (rules.maxLength && value.trim().length > rules.maxLength) {
      return messages.maxLength;
    }

    if (rules.pattern && !rules.pattern.test(value.trim())) {
      return messages.pattern;
    }
  }

  return null;
}