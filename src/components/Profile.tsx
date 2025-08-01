'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'
import { User } from 'lucide-react'

interface Employee {
  id: string
  name: string
  surname: string
  date_of_birth: string
  email: string
  profile_image?: string
  created_at: string
}

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setEmployee(data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!employee) return
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      // Validate required fields
      if (!employee.name.trim()) {
        setError('First name is required')
        return
      }
      if (!employee.surname.trim()) {
        setError('Last name is required')
        return
      }
      if (!employee.date_of_birth) {
        setError('Date of birth is required')
        return
      }

      // Validate age (must be at least 13 years old)
      const birthDate = new Date(employee.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      if (age < 13) {
        setError('You must be at least 13 years old')
        return
      }

      const { error } = await supabase
        .from('employees')
        .update({
          name: employee.name.trim(),
          surname: employee.surname.trim(),
          date_of_birth: employee.date_of_birth
        })
        .eq('id', user.id)

      if (error) throw error
      
      setSuccess('Profile updated successfully!')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading profile...</div>
  if (!employee) return <div className="text-center py-8 text-red-500">No profile found</div>

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={updateProfile} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">Profile Settings</h2>
        
        {/* Profile Avatar Display */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-border bg-muted flex items-center justify-center">
            {employee.profile_image ? (
              <img
                src={employee.profile_image}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to user icon if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <User className="w-12 h-12 text-muted-foreground hidden" />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Profile picture generated with DiceBear Pixel Art
          </p>
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={employee.email}
            disabled
            className="bg-gray-100 dark:bg-gray-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">First Name</Label>
            <Input
              id="name"
              type="text"
              value={employee.name}
              onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="surname">Last Name</Label>
            <Input
              id="surname"
              type="text"
              value={employee.surname}
              onChange={(e) => setEmployee({ ...employee, surname: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={employee.date_of_birth}
            onChange={(e) => setEmployee({ ...employee, date_of_birth: e.target.value })}
            required
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <Label htmlFor="createdAt">Member Since</Label>
          <Input
            id="createdAt"
            type="text"
            value={new Date(employee.created_at).toLocaleDateString()}
            disabled
            className="bg-gray-100 dark:bg-gray-800"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  )
}