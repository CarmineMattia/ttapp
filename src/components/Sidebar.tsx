'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/lib/auth-context'
import { ThemeToggleSimple } from '@/components/theme-toggle'
import { supabase } from '@/lib/supabase'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  HelpCircle, 
  Search,
  LogOut,
  User,
  Plus,
  Mail,
  BarChart3,
  FolderOpen,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<{ name: string; surname: string; profile_image?: string } | null>(null)

  useEffect(() => {
    async function fetchUserProfile() {
      if (user) {
        console.log('Fetching profile for user ID:', user.id) // Debug log
        console.log('User object:', user) // Debug log
        try {
          // First, let's test if we can connect to the database at all
          const { data: testData, error: testError } = await supabase
            .from('employees')
            .select('count')
            .limit(1)
          
          console.log('Database connection test - data:', testData, 'error:', testError) // Debug log
          
          // First try to select all columns, if that fails, try with just basic columns
          let { data, error } = await supabase
            .from('employees')
            .select('name, surname, profile_image')
            .eq('id', user.id)
            .single()
          
          // If the query fails due to missing columns, try with just the basic columns
          if (error && error.code === '42703') {
            console.log('Database schema needs migration, using basic columns')
            const { data: basicData, error: basicError } = await supabase
              .from('employees')
              .select('name, email')
              .eq('id', user.id)
              .single()
            
            if (!basicError && basicData) {
              // Create a profile object with default values
              data = {
                name: basicData.name || 'User',
                surname: 'Name', // Default value
                profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
              }
              error = null
            } else {
              data = basicData
              error = basicError
            }
          }
          
          console.log('Supabase response - data:', data, 'error:', error) // Debug log
          
          if (!error && data) {
            console.log('Fetched user profile:', data) // Debug log
            setUserProfile(data)
          } else {
            console.error('Error fetching user profile:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            
                         // If profile doesn't exist, try to create a basic one
             if (error && error.code === 'PGRST116') { // No rows returned
               console.log('Profile not found, creating basic profile...') // Debug log
               try {
                 // Try to create profile with all columns first
                 let { data: newProfile, error: createError } = await supabase
                   .from('employees')
                   .insert({
                     id: user.id,
                     name: 'User',
                     surname: 'Name',
                     date_of_birth: '1990-01-01',
                     email: user.email || '',
                     profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
                   })
                   .select()
                   .single()
                 
                 // If that fails due to missing columns, try with basic columns
                 if (createError && createError.code === '42703') {
                   console.log('Creating profile with basic columns due to missing schema')
                   const { data: basicProfile, error: basicCreateError } = await supabase
                     .from('employees')
                     .insert({
                       id: user.id,
                       name: 'User',
                       email: user.email || ''
                     })
                     .select()
                     .single()
                   
                   if (!basicCreateError && basicProfile) {
                     newProfile = {
                       name: basicProfile.name || 'User',
                       surname: 'Name',
                       profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
                     }
                     createError = null
                   } else {
                     newProfile = basicProfile
                     createError = basicCreateError
                   }
                 }
                
                if (!createError && newProfile) {
                  console.log('Created basic profile:', newProfile) // Debug log
                  setUserProfile(newProfile)
                } else {
                  console.error('Error creating profile:', createError)
                }
              } catch (createException) {
                console.error('Exception creating profile:', createException)
              }
            }
          }
        } catch (error) {
          console.error('Exception fetching user profile:', error)
        }
      } else {
        console.log('No user found, skipping profile fetch') // Debug log
      }
    }

    fetchUserProfile()
    
    // Set up a subscription to listen for changes to the user's profile
    if (user) {
      const channel = supabase
        .channel('user_profile_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employees',
            filter: `id=eq.${user.id}`
          },
          () => {
            // Refresh profile data when changes occur
            fetchUserProfile()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth'
  }

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: FolderOpen, label: 'Projects', href: '/projects' },
  ]

  const documentItems = [
    { icon: FileText, label: 'Data Library', href: '/data-library' },
    { icon: FileText, label: 'Reports', href: '/reports' },
    { icon: FileText, label: 'Word Assistant', href: '/word-assistant' },
  ]

  const utilityItems = [
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: HelpCircle, label: 'Get Help', href: '/help' },
    { icon: Search, label: 'Search', href: '/search' },
  ]

  return (
    <div className={`bg-sidebar text-sidebar-foreground h-screen flex flex-col transition-all duration-300 border-r border-sidebar-border ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">T</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">TimeYeet</h1>
              <p className="text-xs text-sidebar-accent-foreground">Time tracking app</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Create */}
      <div className="p-4 border-b border-sidebar-border">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          {!isCollapsed && "Quick Create"}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-4 space-y-6">
        <div>
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start text-sidebar-accent-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => window.location.href = item.href}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {!isCollapsed && item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Documents Section */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-sidebar-accent-foreground uppercase tracking-wider mb-3">
              Documents
            </h3>
          )}
          <div className="space-y-2">
            {documentItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start text-sidebar-accent-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => window.location.href = item.href}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {!isCollapsed && item.label}
              </Button>
            ))}
            {!isCollapsed && (
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-accent-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <MoreHorizontal className="w-4 h-4 mr-3" />
                More
              </Button>
            )}
          </div>
        </div>
      </div>

              {/* Bottom Section */}
        <div className="p-4 border-t border-sidebar-border space-y-4">
          {/* Utility Items */}
          <div className="space-y-2">
            {utilityItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start text-sidebar-accent-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => window.location.href = item.href}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {!isCollapsed && item.label}
              </Button>
            ))}
          </div>

          {/* Dark Mode Toggle */}
          {!isCollapsed && <ThemeToggleSimple />}

          {/* User Profile */}
          <div className="flex items-center space-x-3 pt-4 border-t border-sidebar-border">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center overflow-hidden relative">
              {userProfile?.profile_image ? (
                <>
                  <img
                    src={userProfile.profile_image}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to user icon if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <User className="w-4 h-4 text-sidebar-accent-foreground hidden absolute" />
                </>
              ) : (
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userProfile ? `${userProfile.name} ${userProfile.surname}` : user?.email || 'User'}
                </p>
                <p className="text-xs text-sidebar-accent-foreground truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-sidebar-accent-foreground hover:text-sidebar-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
    </div>
  )
} 