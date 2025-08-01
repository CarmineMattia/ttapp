import { PasswordValidation, getPasswordRequirementsList } from '@/utils/passwordValidation'

interface PasswordRequirementsProps {
  validation: PasswordValidation
  showOnly?: boolean
}

export default function PasswordRequirements({ validation, showOnly = false }: PasswordRequirementsProps) {
  const requirementsList = getPasswordRequirementsList()
  
  if (showOnly && validation.isValid) {
    return null
  }

  return (
    <div className="text-sm space-y-1">
      <div className="font-medium text-gray-700 dark:text-gray-300">Password Requirements:</div>
      {requirementsList.map(({ key, label }) => (
        <div 
          key={key}
          className={`flex items-center ${
            validation.requirements[key as keyof typeof validation.requirements] 
              ? 'text-green-600' 
              : 'text-red-500'
          }`}
        >
          <span className="mr-2">✓</span>
          {label}
        </div>
      ))}
    </div>
  )
} 