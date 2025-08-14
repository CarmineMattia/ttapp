'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/lib/auth-context'
import { ThemeToggleSimple } from '@/components/theme-toggle'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  ChevronDown,
  Bell,
  CreditCard
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
          
          // Try to fetch the complete profile with all columns
          let { data, error } = await supabase
            .from('employees')
            .select('name, surname, email, profile_image')
            .eq('id', user.id)
            .single()
          
          console.log('Initial profile fetch - data:', data, 'error:', error) // Debug log
          
          // If the query fails due to missing columns, try with just basic columns
          if (error && error.code === '42703') {
            console.log('Database schema needs migration, using basic columns')
            const { data: basicData, error: basicError } = await supabase
              .from('employees')
              .select('name, email')
              .eq('id', user.id)
              .single()
            
            console.log('Basic profile fetch - data:', basicData, 'error:', basicError) // Debug log
            
            if (!basicError && basicData) {
              // Create a profile object with default values
              data = {
                name: basicData.name || 'User',
                surname: 'Name', // Default value
                email: basicData.email || user.email || '',
                profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
              }
              error = null
            } else {
              data = basicData
              error = basicError
            }
          }
          
          console.log('Final profile data:', data, 'error:', error) // Debug log
          
          if (!error && data) {
            console.log('Fetched user profile:', data) // Debug log
            setUserProfile({
              name: data.name || 'User',
              surname: data.surname || 'Name',
              profile_image: data.profile_image || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
            })
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
                
                console.log('Profile creation attempt - data:', newProfile, 'error:', createError) // Debug log
                
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
                  
                  console.log('Basic profile creation - data:', basicProfile, 'error:', basicCreateError) // Debug log
                  
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
                 setUserProfile({
                   name: newProfile.name || 'User',
                   surname: newProfile.surname || 'Name',
                   profile_image: newProfile.profile_image || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
                 })
               } else {
                 console.error('Error creating profile:', createError)
                 // Set default profile even if creation fails
                 setUserProfile({
                   name: 'User',
                   surname: 'Name',
                   profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
                 })
               }
             } catch (createException) {
               console.error('Exception creating profile:', createException)
               // Set default profile even if creation fails
               setUserProfile({
                 name: 'User',
                 surname: 'Name',
                 profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
               })
             }
           } else {
             // Set default profile for other errors
             setUserProfile({
               name: 'User',
               surname: 'Name',
               profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
             })
           }
         }
       } catch (error) {
         console.error('Exception fetching user profile:', error)
         // Set default profile even if fetch fails
         setUserProfile({
           name: 'User',
           surname: 'Name',
           profile_image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
         })
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

  // Get display name for the profile
  const getDisplayName = () => {
    if (userProfile && userProfile.name && userProfile.surname) {
      return `${userProfile.name} ${userProfile.surname}`
    }
    return user?.email || 'User'
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto hover:bg-sidebar-accent"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center overflow-hidden relative flex-shrink-0">
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
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-sidebar-accent-foreground truncate">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  )}
                  {!isCollapsed && (
                    <ChevronDown className="w-4 h-4 text-sidebar-accent-foreground flex-shrink-0" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 bg-popover border-border" 
              align="start" 
              alignOffset={1000}
              sideOffset={-50}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.location.href = '/account'}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.location.href = '/notifications'}
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.location.href = '/billing'}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </div>
  )
} 