'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Clock, Edit2, Check, X, Trash2, Search, Coffee, TrendingUp } from 'lucide-react'
import { db, type Shift } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { formatDate, formatTime, type UserPreferences } from '@/utils/dateTimeUtils'
import { formatDurationShort, isOvertime, getOvertimeColor } from '@/utils/dateTimeUtils'

import { SearchFilters } from './SearchDialog'

interface ShiftsTableProps {
  onShiftUpdate?: () => void
  refreshTrigger?: number
  searchFilters?: SearchFilters
}

interface EditableShift extends Shift {
  isEditing?: boolean
  editData?: {
    start_time: string
    end_time: string
    notes: string
  }
}

export default function ShiftsTable({ onShiftUpdate, refreshTrigger, searchFilters }: ShiftsTableProps) {
  const [shifts, setShifts] = useState<EditableShift[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [shiftToDelete, setShiftToDelete] = useState<EditableShift | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  })

  useEffect(() => {
    loadShifts()
    loadUserPreferences()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadShifts()
    }
  }, [refreshTrigger])

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

  const loadShifts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const shiftsData = await db.getShifts(user.id)
      // Only show completed shifts
      const completedShifts = shiftsData.filter(shift => shift.status === 'completed')
      
      // Debug logging to see the data structure
      console.log('Shifts data:', completedShifts.map(shift => ({
        id: shift.id,
        project: shift.project?.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_duration_ms: shift.break_duration_ms,
        total_work_duration_ms: shift.total_work_duration_ms,
        overtime_duration_ms: shift.overtime_duration_ms,
        status: shift.status
      })))
      
      setShifts(completedShifts)
    } catch (error) {
      console.error('Error loading shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter shifts based on search criteria
  const filteredShifts = shifts.filter(shift => {
    if (!searchFilters) return true

    // Text search in notes and project name
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase()
      const notesMatch = shift.notes?.toLowerCase().includes(query) || false
      const projectMatch = shift.project?.name.toLowerCase().includes(query) || false
      if (!notesMatch && !projectMatch) return false
    }

    // Project filter
    if (searchFilters.projectFilter && shift.project?.name !== searchFilters.projectFilter) {
      return false
    }

    // Status filter
    if (searchFilters.statusFilter && shift.status !== searchFilters.statusFilter) {
      return false
    }

    // Date range filter
    if (searchFilters.dateFrom) {
      const shiftDate = new Date(shift.start_time).toISOString().split('T')[0]
      if (shiftDate < searchFilters.dateFrom) return false
    }

    if (searchFilters.dateTo) {
      const shiftDate = new Date(shift.start_time).toISOString().split('T')[0]
      if (shiftDate > searchFilters.dateTo) return false
    }

    return true
  })

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const durationMs = end - start
    return Math.floor(durationMs / (1000 * 60 * 60 * 1000)) // Convert to hours
  }

  const handleDoubleClick = (shift: EditableShift) => {
    setShifts(shifts.map(s => 
      s.id === shift.id 
        ? { 
            ...s, 
            isEditing: true, 
            editData: {
              start_time: s.start_time,
              end_time: s.end_time || '',
              notes: s.notes || ''
            }
          }
        : { ...s, isEditing: false }
    ))
  }

  const handleSave = async (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId)
    if (!shift || !shift.editData) return

    try {
      const { error } = await supabase
        .from('shifts')
        .update({
          start_time: shift.editData.start_time,
          end_time: shift.editData.end_time || null,
          notes: shift.editData.notes || null
        })
        .eq('id', shiftId)

      if (error) throw error

      // Update local state
      setShifts(shifts.map(s => 
        s.id === shiftId 
          ? { 
              ...s, 
              ...shift.editData,
              isEditing: false,
              editData: undefined
            }
          : s
      ))

      onShiftUpdate?.()
    } catch (error) {
      console.error('Error updating shift:', error)
    }
  }

  const handleCancel = (shiftId: string) => {
    setShifts(shifts.map(s => 
      s.id === shiftId 
        ? { ...s, isEditing: false, editData: undefined }
        : s
    ))
  }

  const handleInputChange = (shiftId: string, field: string, value: string) => {
    setShifts(shifts.map(s => 
      s.id === shiftId 
        ? { 
            ...s, 
            editData: { 
              ...s.editData!, 
              [field]: value 
            }
          }
        : s
    ))
  }

  const handleDeleteClick = (shift: EditableShift) => {
    setShiftToDelete(shift)
    setShowDeleteConfirmation(true)
  }

  const handleDeleteConfirm = async () => {
    if (!shiftToDelete) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftToDelete.id)

      if (error) throw error

      setShifts(shifts.filter(s => s.id !== shiftToDelete.id))
      onShiftUpdate?.()
    } catch (error) {
      console.error('Error deleting shift:', error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirmation(false)
      setShiftToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false)
    setShiftToDelete(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading shifts...</div>
      </div>
    )
  }

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No completed shifts yet</p>
        <p className="text-sm text-muted-foreground">Complete a shift to see it here</p>
      </div>
    )
  }

  if (searchFilters && Object.values(searchFilters).some(value => value !== '') && filteredShifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Search className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No shifts match your search criteria</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Work Time</TableHead>
              <TableHead>Break Time</TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShifts.map((shift) => {
              const workDuration = shift.total_work_duration_ms || 0
              const breakDuration = shift.break_duration_ms || 0
              const overtimeDuration = shift.overtime_duration_ms || 0
              const hasOvertime = isOvertime(workDuration)
              
              return (
                <TableRow 
                  key={shift.id}
                  className={`group ${shift.isEditing ? 'bg-muted/50' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {shift.project?.name}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {shift.isEditing ? (
                      <Input
                        type="date"
                        value={shift.editData?.start_time.split('T')[0] || ''}
                        onChange={(e) => {
                          const newDate = e.target.value
                          const currentTime = shift.editData?.start_time.split('T')[1] || '00:00:00'
                          handleInputChange(shift.id, 'start_time', `${newDate}T${currentTime}`)
                        }}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(shift.start_time, userPreferences)}</span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {shift.isEditing ? (
                      <div className="space-y-1">
                        <Input
                          type="time"
                          value={shift.editData?.start_time.split('T')[1]?.substring(0, 5) || ''}
                          onChange={(e) => {
                            const currentDate = shift.editData?.start_time.split('T')[0] || ''
                            handleInputChange(shift.id, 'start_time', `${currentDate}T${e.target.value}:00`)
                          }}
                          className="h-6 text-xs"
                        />
                        <Input
                          type="time"
                          value={shift.editData?.end_time.split('T')[1]?.substring(0, 5) || ''}
                          onChange={(e) => {
                            const currentDate = shift.editData?.end_time.split('T')[0] || ''
                            handleInputChange(shift.id, 'end_time', `${currentDate}T${e.target.value}:00`)
                          }}
                          className="h-6 text-xs"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatTime(shift.start_time, userPreferences)}</span>
                        </div>
                        {shift.end_time && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatTime(shift.end_time, userPreferences)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {formatDurationShort(workDuration)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Coffee className="h-3 w-3 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-600">
                        {formatDurationShort(breakDuration)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {hasOvertime ? (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-purple-600" />
                        <span className={`text-sm font-medium ${getOvertimeColor(true)}`}>
                          {formatDurationShort(overtimeDuration)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={shift.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {shift.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {shift.isEditing ? (
                      <Textarea
                        value={shift.editData?.notes || ''}
                        onChange={(e) => handleInputChange(shift.id, 'notes', e.target.value)}
                        className="h-20 text-xs"
                        placeholder="Add notes..."
                      />
                    ) : (
                      <div 
                        className="max-w-[200px] cursor-pointer"
                        onDoubleClick={() => handleDoubleClick(shift)}
                      >
                        <p className="text-sm text-muted-foreground truncate">
                          {shift.notes || 'No notes'}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {shift.isEditing ? (
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(shift.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(shift.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDoubleClick(shift)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(shift)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shift</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>Are you sure you want to delete this shift? This action cannot be undone.</p>
            
            {shiftToDelete && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium">Project: {shiftToDelete.project?.name}</div>
                  <div className="text-muted-foreground">
                    Date: {formatDate(shiftToDelete.start_time, userPreferences)}
                  </div>
                  <div className="text-muted-foreground">
                    Duration: {formatDurationShort(shiftToDelete.total_work_duration_ms || 0)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDeleteCancel} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 