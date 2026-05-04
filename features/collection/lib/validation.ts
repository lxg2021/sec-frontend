export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // Chinese mobile phone number validation (11 digits starting with 1)
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}
