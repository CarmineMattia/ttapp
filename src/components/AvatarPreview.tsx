'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { generateRandomAvatar, generateAvatarFromName, generateAvatarFromEmail } from '@/utils/avatarGenerator'
import { RefreshCw, User } from 'lucide-react'

interface AvatarPreviewProps {
  name: string
  surname: string
  email: string
  onAvatarChange: (avatarUrl: string) => void
  className?: string
}

export default function AvatarPreview({ 
  name, 
  surname, 
  email, 
  onAvatarChange, 
  className = "" 
}: AvatarPreviewProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Generate initial avatar when component mounts
  useEffect(() => {
    if (name && surname) {
      const fullName = `${name} ${surname}`.trim()
      const newAvatarUrl = generateAvatarFromName(fullName)
      console.log('Generated avatar from name:', newAvatarUrl) // Debug log
      setAvatarUrl(newAvatarUrl)
      onAvatarChange(newAvatarUrl)
    } else if (email) {
      const newAvatarUrl = generateAvatarFromEmail(email)
      console.log('Generated avatar from email:', newAvatarUrl) // Debug log
      setAvatarUrl(newAvatarUrl)
      onAvatarChange(newAvatarUrl)
    } else {
      const newAvatarUrl = generateRandomAvatar()
      console.log('Generated random avatar:', newAvatarUrl) // Debug log
      setAvatarUrl(newAvatarUrl)
      onAvatarChange(newAvatarUrl)
    }
  }, [name, surname, email, onAvatarChange])

  const handleRegenerateAvatar = async () => {
    setIsLoading(true)
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newAvatarUrl = generateRandomAvatar()
    setAvatarUrl(newAvatarUrl)
    onAvatarChange(newAvatarUrl)
    setIsLoading(false)
  }

  const handleRegenerateFromName = async () => {
    if (!name && !surname) return
    
    setIsLoading(true)
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const fullName = `${name} ${surname}`.trim()
    const newAvatarUrl = generateAvatarFromName(fullName)
    setAvatarUrl(newAvatarUrl)
    onAvatarChange(newAvatarUrl)
    setIsLoading(false)
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-border bg-muted flex items-center justify-center">
          {avatarUrl ? (
            <>
              <img
                src={avatarUrl}
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
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-2 w-full">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRegenerateAvatar}
          disabled={isLoading}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Random Avatar
        </Button>
        
        {(name || surname) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerateFromName}
            disabled={isLoading}
            className="w-full"
          >
            <User className="w-4 h-4 mr-2" />
            Generate from Name
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Your profile picture will be generated using DiceBear's Pixel Art style
      </p>
    </div>
  )
} 