export interface PasswordRequirements {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
  notSameAsEmail: boolean
}

export interface PasswordValidation {
  isValid: boolean
  requirements: PasswordRequirements
}

export const validatePassword = (password: string, email: string = ''): PasswordValidation => {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notSameAsEmail: email ? password.toLowerCase() !== email.toLowerCase() : true
  }
  
  return {
    isValid: Object.values(requirements).every(Boolean),
    requirements
  }
}

export const getPasswordRequirementsList = () => [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'hasUpperCase', label: 'One uppercase letter' },
  { key: 'hasLowerCase', label: 'One lowercase letter' },
  { key: 'hasNumber', label: 'One number' },
  { key: 'hasSpecialChar', label: 'One special character (!@#$%^&*)' },
  { key: 'notSameAsEmail', label: 'Different from email address' }
] 