'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Play, Pause, Square, AlertCircle } from 'lucide-react'
import { db, type Project, type Shift } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface TimerProps {
  onShiftUpdate?: () => void
}

export default function Timer({ onShiftUpdate }: TimerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showStopConfirmation, setShowStopConfirmation] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [notes, setNotes] = useState('')
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [activeShifts, setActiveShifts] = useState<Shift[]>([])

  // Get user and load data
  useEffect(() => {
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
        const activeShiftsData = allShiftsData.filter(s => s.status === 'in_progress' || s.status === 'paused')
        setActiveShifts(activeShiftsData)
        
      } catch (error: any) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (currentShift) {
      // Calculate initial elapsed time for paused shifts
      if (currentShift.status === 'paused') {
        const startTime = new Date(currentShift.start_time).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - startTime) / 1000))
      }
      
      // Start timer for in_progress shifts
      if (currentShift.status === 'in_progress') {
        interval = setInterval(() => {
          const startTime = new Date(currentShift.start_time).getTime()
          const now = new Date().getTime()
          setElapsedTime(Math.floor((now - startTime) / 1000))
        }, 1000)
      }
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentShift])

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
      setIsOpen(false)
      setSelectedProject('')
      setNotes('')
      onShiftUpdate?.()
    } catch (error: any) {
      console.error('Error starting shift:', error)
      setError(`Failed to start shift: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopShift = async () => {
    if (!currentShift) return
    
    setIsLoading(true)
    
    try {
      const stoppedShift = await db.stopShift(currentShift.id)
      setCurrentShift(null)
      setElapsedTime(0)
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
      const pausedShift = await db.pauseShift(currentShift.id)
      setCurrentShift(pausedShift)
      onShiftUpdate?.()
    } catch (error) {
      setError('Failed to pause shift')
      console.error('Error pausing shift:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeShift = async () => {
    if (!currentShift) return
    
    setIsLoading(true)
    
    try {
      const resumedShift = await db.resumeShift(currentShift.id)
      setCurrentShift(resumedShift)
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

  return (
    <div className="space-y-4">
      {/* Current Timer Display */}
      {currentShift && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Current Shift
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {currentShift.project?.name}
              </p>
              <p className={`text-sm font-medium ${getStatusColor(currentShift.status)}`}>
                {getStatusText(currentShift.status)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Started at {new Date(currentShift.start_time).toLocaleTimeString()}
              </p>
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
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopClick}
                  disabled={isLoading}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop
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
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopClick}
                  disabled={isLoading}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Start New Shift or Resume Paused Shift */}
      {!currentShift && (
        <div className="space-y-3">
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Play className="w-4 h-4 mr-2" />
                Start Timer
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Shift</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
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
              
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this shift..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleStartShift}
                  disabled={isLoading || !selectedProject}
                  className="flex-1"
                >
                  {isLoading ? 'Starting...' : 'Start Shift'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      )}

      {/* Stop Confirmation Dialog */}
      <Dialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Shift</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to stop this shift? This action cannot be undone.
            </p>
            
            {currentShift && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium">Project: {currentShift.project?.name}</div>
                  <div className="text-muted-foreground">
                    Duration: {formatTime(elapsedTime)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={handleStopShift}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? 'Stopping...' : 'Yes, Stop Shift'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStopConfirmation(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 