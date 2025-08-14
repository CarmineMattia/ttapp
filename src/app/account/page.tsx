'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Lock, Save, Eye, EyeOff, Trash2, AlertTriangle, Globe, Calendar, Shuffle } from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    name: '',
    surname: '',
    email: '',
    profile_image: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth')
    }
  }, [user, authLoading, router])

  const fetchProfile = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('name, surname, email, profile_image')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Set default values if profile doesn't exist
        setProfile({
          name: user.user_metadata?.name || 'User',
          surname: user.user_metadata?.surname || 'Name',
          email: user.email || '',
          profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
        })
      } else if (data) {
        setProfile({
          name: data.name || 'User',
          surname: data.surname || 'Name',
          email: data.email || user.email || '',
          profile_image: data.profile_image || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
        })
      }

      // Fetch user preferences from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('timezone, avatar_config')
        .eq('id', user.id)
        .single()

      if (!profileError && profileData) {
        setPreferences({
          timezone: profileData.timezone || 'UTC',
          dateFormat: profileData.avatar_config?.dateFormat || 'MM/DD/YYYY',
          timeFormat: profileData.avatar_config?.timeFormat || '12h'
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [user])

  const testStorageAccess = async () => {
    try {
      console.log('Testing storage access...')
      
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

  useEffect(() => {
    if (user) {
      fetchProfile()
      testStorageAccess()
    }
  }, [user, fetchProfile])

  const handleProfileUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('employees')
        .upsert({
          id: user.id,
          name: profile.name,
          surname: profile.surname,
          email: profile.email,
          profile_image: profile.profile_image
        })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully!",
        })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateNewAvatar = async () => {
    if (!user) return
    
    const newAvatar = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}-${Date.now()}`
    
    try {
      // Update profile with new avatar URL in the database
      const { error } = await supabase
        .from('employees')
        .update({ profile_image: newAvatar })
        .eq('id', user.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update avatar. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setProfile(prev => ({ ...prev, profile_image: newAvatar }))

      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      })
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      console.log('Uploading file to path:', filePath)
      console.log('File details:', { name: file.name, size: file.size, type: file.type })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new image URL in the database
      const { error: updateError } = await supabase
        .from('employees')
        .update({ profile_image: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setProfile(prev => ({ ...prev, profile_image: publicUrl }))

      toast({
        title: "Success",
        description: "Profile image updated successfully!",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handlePreferencesUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          timezone: preferences.timezone,
          avatar_config: {
            dateFormat: preferences.dateFormat,
            timeFormat: preferences.timeFormat
          }
        })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update preferences. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Preferences updated successfully!",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Error",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive",
      })
      return
    }

    setDeletingAccount(true)
    try {
      // 1. Delete all user's shifts
      const { error: shiftsError } = await supabase
        .from('shifts')
        .delete()
        .eq('employee_id', user.id)

      if (shiftsError) {
        console.error('Error deleting shifts:', shiftsError)
        toast({
          title: "Error",
          description: "Failed to delete user data. Please try again.",
          variant: "destructive",
        })
        return
      }

      // 2. Delete user's employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .delete()
        .eq('id', user.id)

      if (employeeError) {
        console.error('Error deleting employee record:', employeeError)
        toast({
          title: "Error",
          description: "Failed to delete user profile. Please try again.",
          variant: "destructive",
        })
        return
      }

      // 3. Delete user's profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        console.error('Error deleting profile record:', profileError)
        // Continue anyway as this is not critical
      }

      // 4. Delete the user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

      if (authError) {
        console.error('Error deleting auth user:', authError)
        toast({
          title: "Error",
          description: "Failed to delete account. Please contact support.",
          variant: "destructive",
        })
        return
      }

      // 5. Sign out and redirect
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      })

      await signOut()
      router.push('/auth')
      
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting your account.",
        variant: "destructive",
      })
    } finally {
      setDeletingAccount(false)
      setShowDeleteDialog(false)
      setDeleteConfirmation('')
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Checking authentication...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information.
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <AvatarImage src={profile.profile_image} alt="Profile" />
                  <AvatarFallback>
                    {profile.name.charAt(0)}{profile.surname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
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
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">
                  Click the profile image to upload a new photo, or use the shuffle button to generate a random avatar
                </p>
                {uploadingImage && (
                  <p className="text-sm text-blue-600 mt-1">
                    Uploading image...
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Last Name</Label>
                <Input
                  id="surname"
                  value={profile.surname}
                  onChange={(e) => setProfile(prev => ({ ...prev, surname: e.target.value }))}
                  placeholder="Enter your last name"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleProfileUpdate} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handlePasswordChange} 
              disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full md:w-auto"
            >
              <Lock className="w-4 h-4 mr-2" />
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </CardTitle>
            <CardDescription>
              Customize your application preferences for timezone, date, and time display.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))} value={preferences.timezone}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Asia/Shanghai (CST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                    <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All times will be displayed in your selected timezone
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select onValueChange={(value) => setPreferences(prev => ({ ...prev, dateFormat: value }))} value={preferences.dateFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/25/2024)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (25/12/2024)</SelectItem>
                    <SelectItem value="YYYY/MM/DD">YYYY/MM/DD (2024/12/25)</SelectItem>
                    <SelectItem value="MM-DD-YYYY">MM-DD-YYYY (12-25-2024)</SelectItem>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (25-12-2024)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-25)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How dates will be displayed throughout the app
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select onValueChange={(value) => setPreferences(prev => ({ ...prev, timeFormat: value }))} value={preferences.timeFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a time format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How times will be displayed throughout the app
                </p>
              </div>
            </div>

            <Button 
              onClick={handlePreferencesUpdate} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {loading ? 'Saving Preferences...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">User ID</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {user?.id || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Sign In</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email Verified</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.email_confirmed_at ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dangerous Actions */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Dangerous Actions
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              These actions are irreversible. Please proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                This action will permanently delete your account and all associated data including:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 mb-4">
                <li>• All your time tracking shifts and data</li>
                <li>• Your profile information</li>
                <li>• Account settings and preferences</li>
                <li>• All associated records</li>
              </ul>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                <strong>This action cannot be undone.</strong>
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full md:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-red-600 dark:text-red-400">
              This action is permanent and cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                To confirm deletion, please type <strong>DELETE</strong> in the field below:
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="border-red-300 focus:border-red-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmation('')
              }}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || deletingAccount}
            >
              {deletingAccount ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
} 