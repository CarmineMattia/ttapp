'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Play, Pause, Square, AlertCircle, Coffee, Clock, TrendingUp } from 'lucide-react'
import { db, type Project, type Shift } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { formatTime as formatTimeWithPreferences, type UserPreferences } from '@/utils/dateTimeUtils'
import { 
  formatDuration, 
  formatDurationShort, 
  calculateWorkDuration, 
  isOvertime, 
  getOvertimeColor, 
  getOvertimeBgColor 
} from '@/utils/dateTimeUtils'
import AutoLogoutWarning from './AutoLogoutWarning'

interface TimerProps {
  onShiftUpdate?: () => void
}

export default function Timer({ onShiftUpdate }: TimerProps) {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [workDuration, setWorkDuration] = useState(0)
  const [breakDuration, setBreakDuration] = useState(0)
  const [isOvertimeActive, setIsOvertimeActive] = useState(false)
  const [localPauseTime, setLocalPauseTime] = useState<Date | null>(null)
  const [lastPauseDuration, setLastPauseDuration] = useState(0)
  const [showPauseSummary, setShowPauseSummary] = useState(false)
  const [accumulatedBreakTime, setAccumulatedBreakTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [notes, setNotes] = useState('')
  const [showStopConfirmation, setShowStopConfirmation] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [userPreferences, setUserPreferences] = useState({
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  })

  useEffect(() => {
    loadData()
    loadUserPreferences()
  }, [])

  // Initialize break duration when current shift changes
  useEffect(() => {
    if (currentShift) {
      const breakTime = currentShift.break_duration_ms || 0
      setBreakDuration(breakTime)
      setAccumulatedBreakTime(breakTime)
    }
  }, [currentShift])

  const loadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw authError
      }
      
      if (!user) {
        return
      }
      
      // Load projects
      const projectsData = await db.getProjects()
      setProjects(projectsData)
      
      // Load current shift (in_progress only)
      const currentShiftData = await db.getCurrentShift(user.id)
      setCurrentShift(currentShiftData)
      
      // Load all shifts to get active ones
      const allShiftsData = await db.getShifts(user.id)
      // const activeShiftsData = allShiftsData.filter(s => s.status === 'in_progress' || s.status === 'paused')
      // setActiveShifts(activeShiftsData) // This line was removed as per the edit hint
      
    } catch (error: unknown) {
      console.error('Error loading data:', error)
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

  // Timer effect with break tracking and overtime calculation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (currentShift) {
      interval = setInterval(() => {
        const startTime = new Date(currentShift.start_time).getTime()
        const now = new Date().getTime()
        const totalElapsed = now - startTime
        
        // Always update elapsed time (total time since start)
        setElapsedTime(Math.floor(totalElapsed / 1000))
        
        if (currentShift.status === 'in_progress') {
          // When running: work time = total elapsed - accumulated break time
          const currentBreakTime = currentShift.break_duration_ms || 0
          const actualWorkTime = totalElapsed - currentBreakTime
          
          setWorkDuration(actualWorkTime)
          setBreakDuration(currentBreakTime)
          setAccumulatedBreakTime(currentBreakTime)
          setIsOvertimeActive(isOvertime(actualWorkTime))
        } else if (currentShift.status === 'paused') {
          // When paused: work time stays the same, break time accumulates
          const currentBreakTime = currentShift.break_duration_ms || 0
          
          // Use local pause time if available, otherwise fall back to database
          const pauseStartTime = localPauseTime 
            ? localPauseTime.getTime()
            : (currentShift.last_pause_time 
                ? new Date(currentShift.last_pause_time).getTime()
                : now)
          
          // Calculate additional break time since pause started
          const additionalBreakTime = now - pauseStartTime
          const totalBreakTime = currentBreakTime + additionalBreakTime
          
          // Work time = total elapsed - total break time
          const actualWorkTime = totalElapsed - totalBreakTime
          
          setBreakDuration(totalBreakTime)
          setAccumulatedBreakTime(totalBreakTime)
          setWorkDuration(actualWorkTime)
          setIsOvertimeActive(isOvertime(actualWorkTime))
        }
      }, 1000)
    } else {
      setElapsedTime(0)
      setWorkDuration(0)
      setBreakDuration(0)
      setIsOvertimeActive(false)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [currentShift, localPauseTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartShift = async () => {
    if (!selectedProject) {
      setError('Please select a project')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('❌ Auth error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }
      
      if (!user) {
        console.error('❌ No user found')
        throw new Error('User not authenticated')
      }
      
      const newShift = await db.startShift(user.id, selectedProject, notes)
      setCurrentShift(newShift)
      setElapsedTime(0)
      setWorkDuration(0)
      setBreakDuration(0)
      setIsOvertimeActive(false)
      setLocalPauseTime(null)
      setAccumulatedBreakTime(0)
      setIsOpen(false)
      setSelectedProject('')
      setNotes('')
      onShiftUpdate?.()
    } catch (error: unknown) {
      console.error('Error starting shift:', error)
      setError(`Failed to start shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopShift = async () => {
    if (!currentShift) return
    
    setIsLoading(true)
    
    try {
      await db.stopShift(currentShift.id)
      setCurrentShift(null)
      setElapsedTime(0)
      setWorkDuration(0)
      setBreakDuration(0)
      setIsOvertimeActive(false)
      setLocalPauseTime(null)
      setAccumulatedBreakTime(0)
      setShowStopConfirmation(false)
      onShiftUpdate?.()
    } catch (error) {
      setError('Failed to stop shift')
      console.error('Error stopping shift:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopClick = () => {
    setShowStopConfirmation(true)
  }

  const handlePauseShift = async () => {
    if (!currentShift) return
    
    setIsLoading(true)
    
    try {
      // Set local pause time immediately
      setLocalPauseTime(new Date())
      
      const pausedShift = await db.pauseShift(currentShift.id)
      setCurrentShift(pausedShift)
      // Update break duration immediately after pause
      setBreakDuration(pausedShift.break_duration_ms || 0)
      onShiftUpdate?.()
    } catch (error) {
      setError('Failed to pause shift')
      console.error('Error pausing shift:', error)
      // Reset local pause time if pause failed
      setLocalPauseTime(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeShift = async () => {
    if (!currentShift) return
    
    setIsLoading(true)
    
    try {
      // Calculate accumulated break time before clearing local pause time
      let newAccumulatedBreakTime = accumulatedBreakTime
      
      if (localPauseTime) {
        const pauseDuration = Date.now() - localPauseTime.getTime()
        newAccumulatedBreakTime += pauseDuration
        
        setLastPauseDuration(pauseDuration)
        setShowPauseSummary(true)
        
        // Hide the summary after 5 seconds
        setTimeout(() => {
          setShowPauseSummary(false)
          setLastPauseDuration(0)
        }, 5000)
      }
      
      // Clear local pause time
      setLocalPauseTime(null)
      
      const resumedShift = await db.resumeShift(currentShift.id)
      setCurrentShift(resumedShift)
      
      // Update accumulated break time from the database response
      const updatedBreakTime = resumedShift.break_duration_ms || 0
      setAccumulatedBreakTime(updatedBreakTime)
      setBreakDuration(updatedBreakTime)
      
      onShiftUpdate?.()
    } catch (error) {
      setError('Failed to resume shift')
      console.error('Error resuming shift:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'text-green-600'
      case 'paused':
        return 'text-yellow-600'
      case 'completed':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'Running'
      case 'paused':
        return 'Paused'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  const getTimerBgColor = (status: string, isOvertime: boolean) => {
    if (status === 'paused') {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }
    if (isOvertime) {
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  }

  const getTimerTextColor = (status: string, isOvertime: boolean) => {
    if (status === 'paused') {
      return 'text-yellow-900 dark:text-yellow-100'
    }
    if (isOvertime) {
      return 'text-red-900 dark:text-red-100'
    }
    return 'text-green-900 dark:text-green-100'
  }

  const getTimerSubTextColor = (status: string, isOvertime: boolean) => {
    if (status === 'paused') {
      return 'text-yellow-700 dark:text-yellow-300'
    }
    if (isOvertime) {
      return 'text-red-700 dark:text-red-300'
    }
    return 'text-green-700 dark:text-green-300'
  }

  return (
    <div className="space-y-4">
      {/* Current Timer Display */}
      {currentShift && (
        <div className={`border rounded-lg p-4 ${getTimerBgColor(currentShift.status, isOvertimeActive)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-medium ${getTimerTextColor(currentShift.status, isOvertimeActive)}`}>
                Current Shift
                {isOvertimeActive && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Overtime
                  </span>
                )}
                {currentShift.status === 'paused' && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Pause className="h-3 w-3 mr-1" />
                    Paused
                  </span>
                )}
              </h3>
              <p className={`text-sm ${getTimerSubTextColor(currentShift.status, isOvertimeActive)}`}>
                {currentShift.project?.name}
              </p>
              <p className={`text-sm font-medium ${getStatusColor(currentShift.status)}`}>
                {getStatusText(currentShift.status)}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-mono font-bold ${getTimerTextColor(currentShift.status, isOvertimeActive)}`}>
                {formatTime(elapsedTime)}
              </div>
              <p className={`text-xs ${getTimerSubTextColor(currentShift.status, isOvertimeActive)}`}>
                Started at {formatTimeWithPreferences(currentShift.start_time, userPreferences)}
              </p>
            </div>
          </div>
          
          {/* Break and Work Duration Display */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Time</span>
              </div>
              <div className="text-lg font-mono font-bold text-green-600">
                {formatDuration(workDuration)}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
              <div className="flex items-center space-x-2 mb-1">
                <Coffee className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Break Time</span>
              </div>
              <div className="text-lg font-mono font-bold text-yellow-600">
                {formatDuration(breakDuration)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            {currentShift.status === 'in_progress' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePauseShift}
                  disabled={isLoading}
                  className="flex items-center space-x-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStopClick}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop</span>
                </Button>
              </>
            )}
            
            {currentShift.status === 'paused' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResumeShift}
                  disabled={isLoading}
                  className="flex items-center space-x-2 border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Play className="h-4 w-4" />
                  <span>Resume</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStopClick}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pause Summary Display */}
      {showPauseSummary && lastPauseDuration > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Coffee className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Break Completed
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You just took a {formatDuration(lastPauseDuration)} break. 
            Total break time today: {formatDuration(accumulatedBreakTime)} 💪
          </p>
        </div>
      )}

      {/* Auto-logout warning */}
      {currentShift && (
        <AutoLogoutWarning
          shiftId={currentShift.id}
          startTime={currentShift.start_time}
          onShiftUpdate={onShiftUpdate}
        />
      )}

      {/* Start New Shift Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full" 
            disabled={!!currentShift}
          >
            <Play className="h-4 w-4 mr-2" />
            Start New Shift
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Shift</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this shift..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartShift} disabled={isLoading}>
                {isLoading ? 'Starting...' : 'Start Shift'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stop Confirmation Dialog */}
      <Dialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Shift</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>Are you sure you want to stop your current shift?</p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowStopConfirmation(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleStopShift} disabled={isLoading}>
                {isLoading ? 'Stopping...' : 'Stop Shift'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 