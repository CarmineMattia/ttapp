'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'
import { validatePassword } from '@/utils/passwordValidation'
import PasswordRequirements from '@/components/PasswordRequirements'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState(validatePassword('', ''))

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordValidation(validatePassword(value, ''))
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth')
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TimeYeet</h1>
            <div className="mt-8 text-center space-y-4">
              <div className="text-green-600 dark:text-green-400 text-lg">
                Password updated successfully!
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to login page...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TimeYeet</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Set your new password</p>
        </div>
        
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          {/* Password requirements */}
          {password && (
            <PasswordRequirements validation={passwordValidation} />
          )}
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/auth')}
          >
            Back to Login
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
} 