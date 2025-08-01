'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'
import { validatePassword } from '@/utils/passwordValidation'
import PasswordRequirements from './PasswordRequirements'
import AvatarPreview from './AvatarPreview'

export default function Auth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [registrationSent, setRegistrationSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordValidation, setPasswordValidation] = useState(validatePassword('', ''))
  const [profileImage, setProfileImage] = useState<string>('')

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordValidation(validatePassword(value, email))
  }

  // Update password validation when email changes
  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password, email))
    }
  }, [email, password])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // For registration, check if email already exists in employees table
    if (isRegister) {
      try {
        const { data: existingProfiles, error: checkError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', email.toLowerCase().trim())
        
        if (!checkError && existingProfiles && existingProfiles.length > 0) {
          setError('An account with this email already exists. Please try logging in instead.')
          setLoading(false)
          return
        }
      } catch (checkError) {
        // If we can't check due to schema cache issues, proceed with registration
        // The registration will fail naturally if email exists
        console.log('Could not check existing email due to schema issues, proceeding with registration')
      }
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }
    
    // Check if password is provided
    if (!password.trim()) {
      setError('Please enter your password')
      setLoading(false)
      return
    }

    // Validate registration fields
    if (isRegister) {
      if (!name.trim()) {
        setError('Please enter your first name')
        setLoading(false)
        return
      }
      if (!surname.trim()) {
        setError('Please enter your last name')
        setLoading(false)
        return
      }
      if (!dateOfBirth) {
        setError('Please enter your date of birth')
        setLoading(false)
        return
      }
      
      // Validate date of birth (must be at least 13 years old)
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      if (age < 13) {
        setError('You must be at least 13 years old to register')
        setLoading(false)
        return
      }
    }
    
    // Validate password for registration
    if (isRegister && !passwordValidation.isValid) {
      setError('Please meet all password requirements')
      setLoading(false)
      return
    }
    
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        // Handle specific Supabase Auth errors
        if (error) {
          // Check for existing user errors
          if (error.message?.includes('User already registered') || 
              error.message?.includes('already been registered') ||
              error.message?.includes('duplicate key value violates unique constraint') ||
              error.message?.includes('already exists') ||
              error.code === '23505') {
            setError('An account with this email already exists. Please try logging in instead.')
            return
          }
          throw error
        }
        
        // If registration successful, create employee profile
        if (data.user) {
          console.log('Saving profile with image:', profileImage) // Debug log
          
          // Insert minimal profile with only the most basic fields
          const { error: profileError } = await supabase
            .from('employees')
            .insert({
              id: data.user.id,
              name: name.trim(),
              email: email.toLowerCase().trim()
            })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
            console.error('Profile error details:', JSON.stringify(profileError, null, 2))
            
            // For profile creation errors, show a more specific message
            console.error('Profile creation error details:', {
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint
            })
            
            // Check for specific error types
            if (profileError.code === 'PGRST204') {
              // Schema cache issue - column not found
              setError('Database schema issue detected. Some profile fields are not recognized. Please refresh the page and try again, or contact support.')
            } else if (profileError.code === '23505' || profileError.message?.includes('duplicate key value violates unique constraint')) {
              // Unique constraint violation - likely email already exists
              if (profileError.message?.includes('email') || profileError.message?.includes('duplicate key value violates unique constraint')) {
                setError('An account with this email already exists. Please try logging in instead.')
                // Clean up the created user since profile creation failed
                try {
                  await supabase.auth.admin.deleteUser(data.user.id)
                } catch (deleteError) {
                  console.error('Error cleaning up user:', deleteError)
                }
              } else {
                setError('This account information conflicts with an existing account. Please try different details.')
              }
            } else if (profileError.code === '23502') {
              // Not null violation
              setError('Please fill in all required fields.')
            } else if (profileError.code === '23503') {
              // Foreign key violation
              setError('Invalid account information provided.')
            } else if (profileError.message?.includes('network') || profileError.message?.includes('fetch')) {
              setError('Network error. Please check your connection and try again.')
            } else if (profileError.message?.includes('400') || profileError.message?.includes('Bad Request')) {
              // HTTP 400 often indicates constraint violations
              setError('An account with this email already exists. Please try logging in instead.')
              // Clean up the created user since profile creation failed
              try {
                await supabase.auth.admin.deleteUser(data.user.id)
              } catch (deleteError) {
                console.error('Error cleaning up user:', deleteError)
              }
            } else {
              setError(`Registration failed: ${profileError.message || 'Unknown error'}. Please try again.`)
            }
            return
          } else {
            console.log('Profile created successfully with image') // Debug log
            
            // Try to update additional fields separately in case of schema cache issues
            const updateData: any = {}
            if (surname) updateData.surname = surname.trim()
            if (dateOfBirth) updateData.date_of_birth = dateOfBirth
            if (profileImage) updateData.profile_image = profileImage
            
            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from('employees')
                .update(updateData)
                .eq('id', data.user.id)
              
              if (updateError) {
                console.warn('Could not update additional profile fields:', updateError.message)
                // Don't fail the registration for this, just log it
              } else {
                console.log('Successfully updated additional profile fields')
              }
            }
            
            // Only show success message if profile creation was successful
            if (data.user && !data.user.email_confirmed_at) {
              setRegistrationSent(true)
            }
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Auth error:', error) // Debug log
      console.error('Auth error details:', JSON.stringify(error, null, 2)) // Debug log
      
      // Improve error messages for better UX
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before logging in.')
      } else if (error.message?.includes('User already registered') || 
                 error.message?.includes('already been registered') ||
                 error.message?.includes('duplicate key value violates unique constraint') ||
                 error.code === '23505') {
        setError('An account with this email already exists. Please try logging in instead.')
      } else {
        setError(error.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) throw error
      
      setResetSent(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowResetForm(false)
    setResetSent(false)
    setRegistrationSent(false)
    setError(null)
  }

  const resetRegistrationForm = () => {
    setRegistrationSent(false)
    setEmail('')
    setPassword('')
    setName('')
    setSurname('')
    setDateOfBirth('')
    setProfileImage('')
    setPasswordValidation(validatePassword('', ''))
    setError(null)
  }

  if (showResetForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
        {resetSent ? (
          <div className="text-center space-y-4">
            <div className="text-green-600 dark:text-green-400">
              Password reset email sent! Check your inbox.
            </div>
            <Button onClick={resetForm} variant="outline">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4 w-full">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={resetForm}
            >
              Back to Login
            </Button>
          </form>
        )}
      </div>
    )
  }

  if (registrationSent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">Check Your Email</h2>
        <div className="text-center space-y-4">
          <div className="text-green-600 dark:text-green-400">
            Registration successful! Please check your email to confirm your account.
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We've sent a confirmation link to <strong>{email}</strong>
          </p>
          <div className="space-y-2">
            <Button onClick={resetRegistrationForm} variant="outline" className="w-full">
              Register Another Account
            </Button>
            <Button 
              onClick={() => {
                setIsRegister(false)
                resetRegistrationForm()
              }} 
              variant="ghost" 
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleAuth} className="space-y-4 w-full">
        {isRegister && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="First Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                />
              </div>
              <div>
                <Label htmlFor="surname">Last Name</Label>
                <Input
                  id="surname"
                  type="text"
                  placeholder="Last Name"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required={isRegister}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required={isRegister}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Avatar Preview Section */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-medium mb-3 block">Profile Picture</Label>
              <AvatarPreview
                name={name}
                surname={surname}
                email={email}
                onAvatarChange={setProfileImage}
              />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
          />
        </div>
        
        {/* Password requirements for registration */}
        {isRegister && password && (
          <PasswordRequirements validation={passwordValidation} />
        )}
        
        {error && <div className="text-red-500 text-sm">{error}</div>}
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Loading...' : isRegister ? 'Register' : 'Login'}
        </Button>
        
        {/* Forgot Password button - only show on login */}
        {!isRegister && (
          <Button
            type="button"
            variant="link"
            className="w-full text-sm"
            onClick={() => setShowResetForm(true)}
          >
            Forgot Password?
          </Button>
        )}
        
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setIsRegister(!isRegister)
            setError(null)
            setPassword('')
            setName('')
            setSurname('')
            setDateOfBirth('')
            setProfileImage('')
            setPasswordValidation(validatePassword('', ''))
          }}
        >
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </Button>
      </form>
    </div>
  )
}