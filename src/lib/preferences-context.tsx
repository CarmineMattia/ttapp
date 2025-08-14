'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { UserPreferences } from '@/utils/dateTimeUtils'

interface PreferencesContextType {
  preferences: UserPreferences
  loading: boolean
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences>({
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPreferences()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('timezone, avatar_config')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setPreferences({
          timezone: data.timezone || 'UTC',
          dateFormat: data.avatar_config?.dateFormat || 'MM/DD/YYYY',
          timeFormat: data.avatar_config?.timeFormat || '12h'
        })
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return

    try {
      const updatedPreferences = { ...preferences, ...newPreferences }
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          timezone: updatedPreferences.timezone,
          avatar_config: {
            dateFormat: updatedPreferences.dateFormat,
            timeFormat: updatedPreferences.timeFormat
          }
        })

      if (error) {
        throw error
      }

      setPreferences(updatedPreferences)
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    }
  }

  const value = {
    preferences,
    loading,
    updatePreferences
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
} 