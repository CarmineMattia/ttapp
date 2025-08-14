'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/database'
import { formatTimeUntilAutoLogout, getAutoLogoutColor } from '@/utils/dateTimeUtils'
import { useAuth } from '@/lib/auth-context'

interface AutoLogoutWarningProps {
  shiftId: string
  startTime: string
  onShiftUpdate?: () => void
}

export default function AutoLogoutWarning({ shiftId, startTime, onShiftUpdate }: AutoLogoutWarningProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [hoursElapsed, setHoursElapsed] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()
  const { signOut } = useAuth()

  useEffect(() => {
    const updateTime = () => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      const elapsed = now - start
      const hours = elapsed / (1000 * 60 * 60)
      
      setHoursElapsed(hours)
      
      if (hours >= 12) {
        setTimeRemaining(0)
        if (!isOpen) {
          setIsOpen(true)
        }
      } else {
        const remaining = (12 * 60 * 60 * 1000) - elapsed
        setTimeRemaining(remaining)
        
        // Show warning when approaching 12 hours (at 11.5 hours)
        if (hours >= 11.5 && !isOpen) {
          setIsOpen(true)
        }
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [startTime, isOpen])

  const handleContinue = () => {
    setIsOpen(false)
    toast({
      title: 'Warning Acknowledged',
      description: 'Please remember to take breaks and log out when your shift ends.',
      variant: 'default',
    })
  }

  const handleForceLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      // Force stop the shift
      await db.forceStopShift(shiftId)
      
      toast({
        title: 'Shift Auto-Stopped',
        description: 'Your shift has been automatically stopped after 12 hours.',
        variant: 'default',
      })
      
      // Update parent component
      onShiftUpdate?.()
      
      // Sign out the user
      await signOut()
    } catch (error) {
      console.error('Error during auto-logout:', error)
      toast({
        title: 'Error',
        description: 'Failed to auto-logout. Please manually stop your shift.',
        variant: 'destructive',
      })
    } finally {
      setIsLoggingOut(false)
      setIsOpen(false)
    }
  }

  const getWarningMessage = () => {
    if (hoursElapsed >= 12) {
      return {
        title: 'Auto-Logout Required',
        description: 'Your shift has been running for over 12 hours. For your safety and compliance with labor laws, you will be automatically logged out.',
        severity: 'critical'
      }
    } else if (hoursElapsed >= 11.5) {
      return {
        title: 'Approaching Auto-Logout',
        description: `Your shift has been running for ${Math.floor(hoursElapsed)} hours. You will be automatically logged out in ${formatTimeUntilAutoLogout(timeRemaining)}.`,
        severity: 'warning'
      }
    }
    
    return {
      title: 'Long Shift Warning',
      description: 'You have been working for an extended period. Please consider taking a break.',
      severity: 'info'
    }
  }

  const warning = getWarningMessage()

  return (
    <>
      {/* Floating indicator for long shifts */}
      {hoursElapsed >= 10 && (
        <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg border ${getAutoLogoutColor(hoursElapsed)} bg-white dark:bg-gray-800 z-50`}>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {Math.floor(hoursElapsed)}h elapsed
            </span>
          </div>
        </div>
      )}

      {/* Auto-logout warning dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className={`h-5 w-5 ${
                warning.severity === 'critical' ? 'text-red-500' : 
                warning.severity === 'warning' ? 'text-orange-500' : 'text-blue-500'
              }`} />
              <span>{warning.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {warning.description}
            </p>
            
            {hoursElapsed >= 12 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Auto-logout will occur in 30 seconds</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              {hoursElapsed < 12 ? (
                <Button onClick={handleContinue} variant="outline">
                  Continue Working
                </Button>
              ) : (
                <Button 
                  onClick={handleForceLogout} 
                  variant="destructive"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging Out...' : 'Logout Now'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 