'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Shuffle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, type UserPreferences } from '@/utils/dateTimeUtils'

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
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  })

  useEffect(() => {
    getProfile()
    loadUserPreferences()
    testStorageAccess()
  }, [])

  const testStorageAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('Testing storage access for user:', user.id)
      
      // Test if we can list files in the avatars bucket
      const { data: files, error } = await supabase.storage
        .from('avatars')
        .list('', {
          limit: 1
        })

      if (error) {
        console.error('Storage access test failed:', error)
      } else {
        console.log('Storage access test successful, files found:', files?.length || 0)
      }
    } catch (error) {
      console.error('Error testing storage access:', error)
    }
  }

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('timezone, avatar_config')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setUserPreferences({
          timezone: data.timezone || 'UTC',
          dateFormat: data.avatar_config?.dateFormat || 'MM/DD/YYYY',
          timeFormat: data.avatar_config?.timeFormat || '12h'
        })
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
    }
  }

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
     
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
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
          date_of_birth: employee.date_of_birth,
          profile_image: employee.profile_image
        })
        .eq('id', user.id)

      if (error) throw error
      
      setSuccess('Profile updated successfully!')
     
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateNewAvatar = async () => {
    if (!employee) return
    
    const newAvatar = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${employee.id}-${Date.now()}`
    
    try {
      // Update profile with new avatar URL in the database
      const { error } = await supabase
        .from('employees')
        .update({ profile_image: newAvatar })
        .eq('id', employee.id)

      if (error) {
        setError('Failed to update avatar. Please try again.')
        return
      }

      // Update local state
      setEmployee(prev => prev ? { ...prev, profile_image: newAvatar } : null)

      setSuccess('Avatar updated successfully!')
    } catch (error: unknown) {
      console.error('Error updating avatar:', error)
      setError(`Failed to update avatar: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !employee) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.')
      return
    }

    setUploadingImage(true)
    setError(null)
    try {
      console.log('Starting image upload for employee:', employee.id)
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${employee.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}` // Remove 'avatars/' prefix as it's handled by the bucket

      console.log('Uploading file:', filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)

      // Update profile with new image URL in the database
      const { error: updateError } = await supabase
        .from('employees')
        .update({ profile_image: publicUrl })
        .eq('id', employee.id)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Database update successful')

      // Update local state
      setEmployee(prev => prev ? { ...prev, profile_image: publicUrl } : null)

      setSuccess('Profile image updated successfully!')
    } catch (error: unknown) {
      console.error('Error uploading image:', error)
      setError(`Failed to upload image: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
    } finally {
      setUploadingImage(false)
      // Reset file input
      event.target.value = ''
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
          <div className="relative">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-border bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => document.getElementById('profile-avatar-upload')?.click()}
            >
              {employee.profile_image ? (
                <>
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
                </>
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full"
              onClick={generateNewAvatar}
              disabled={uploadingImage}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            {/* Hidden file input */}
            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Click the profile image to upload a new photo, or use the shuffle button to generate a random avatar
          </p>
          {uploadingImage && (
            <p className="text-sm text-blue-600">
              Uploading image...
            </p>
          )}
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
            value={employee.created_at ? formatDate(employee.created_at, userPreferences) : 'N/A'}
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