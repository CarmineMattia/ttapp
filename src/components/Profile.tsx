'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from '../../lib/supabase'

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  birth_date: string | null
  language: string
  department: string | null
}

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id)

      if (error) throw error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!profile) return <div>No profile found</div>

  return (
    <form onSubmit={updateProfile} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Profile Settings</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="text"
          value={profile.email}
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">First Name</label>
        <Input
          type="text"
          value={profile.first_name || ''}
          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Last Name</label>
        <Input
          type="text"
          value={profile.last_name || ''}
          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input
          type="tel"
          value={profile.phone || ''}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Birth Date</label>
        <Input
          type="date"
          value={profile.birth_date || ''}
          onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Department</label>
        <Input
          type="text"
          value={profile.department || ''}
          onChange={(e) => setProfile({ ...profile, department: e.target.value })}
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}