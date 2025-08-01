'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Clock, Edit2, Check, X, MoreHorizontal, Trash2, Search } from 'lucide-react'
import { db, type Shift } from '@/lib/database'
import { supabase } from '@/lib/supabase'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [shiftToDelete, setShiftToDelete] = useState<EditableShift | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadShifts()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadShifts()
    }
  }, [refreshTrigger])

  const loadShifts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const shiftsData = await db.getShifts(user.id)
      // Only show completed shifts
      const completedShifts = shiftsData.filter(shift => shift.status === 'completed')
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
      const searchLower = searchFilters.query.toLowerCase()
      const notesMatch = shift.notes?.toLowerCase().includes(searchLower) || false
      const projectMatch = shift.project?.name?.toLowerCase().includes(searchLower) || false
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const durationMs = end - start
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleDoubleClick = (shift: EditableShift) => {
    setEditingId(shift.id)
    setShifts(prev => prev.map(s => 
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
        : s
    ))
  }

  const handleSave = async (shiftId: string) => {
    try {
      const shift = shifts.find(s => s.id === shiftId)
      if (!shift?.editData) return

      const { data, error } = await supabase
        .from('shifts')
        .update({
          start_time: shift.editData.start_time,
          end_time: shift.editData.end_time,
          notes: shift.editData.notes
        })
        .eq('id', shiftId)
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()

      if (error) throw error

      setShifts(prev => prev.map(s => 
        s.id === shiftId 
          ? { ...data, isEditing: false, editData: undefined }
          : s
      ))
      setEditingId(null)
      onShiftUpdate?.()
    } catch (error) {
      console.error('Error updating shift:', error)
    }
  }

  const handleCancel = (shiftId: string) => {
    setShifts(prev => prev.map(s => 
      s.id === shiftId 
        ? { ...s, isEditing: false, editData: undefined }
        : s
    ))
    setEditingId(null)
  }

  const handleInputChange = (shiftId: string, field: string, value: string) => {
    setShifts(prev => prev.map(s => 
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

      // Remove from local state
      setShifts(prev => prev.filter(s => s.id !== shiftToDelete.id))
      setShowDeleteConfirmation(false)
      setShiftToDelete(null)
      onShiftUpdate?.()
    } catch (error) {
      console.error('Error deleting shift:', error)
    } finally {
      setDeleting(false)
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
               <TableHead>Duration</TableHead>
               <TableHead>Status</TableHead>
               <TableHead>Notes</TableHead>
               <TableHead className="w-[50px]"></TableHead>
             </TableRow>
           </TableHeader>
                  <TableBody>
          {filteredShifts.map((shift) => (
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
                      <span className="text-sm">{formatDate(shift.start_time)}</span>
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
                        <span className="text-sm">{formatTime(shift.start_time)}</span>
                      </div>
                      {shift.end_time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatTime(shift.end_time)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                
                               <TableCell>
                   {shift.end_time ? (
                     <Badge variant="outline" className="text-xs">
                       {calculateDuration(shift.start_time, shift.end_time)}
                     </Badge>
                   ) : (
                     <Badge variant="outline" className="text-xs text-muted-foreground">
                       In Progress
                     </Badge>
                   )}
                 </TableCell>
                 
                 <TableCell>
                   <Badge 
                     variant={shift.status === 'completed' ? 'default' : 'secondary'}
                     className={`text-xs ${
                       shift.status === 'completed' 
                         ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                         : shift.status === 'in_progress'
                         ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                         : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                     }`}
                   >
                     {shift.status === 'completed' ? 'Completed' : 
                      shift.status === 'in_progress' ? 'In Progress' : 
                      shift.status === 'paused' ? 'Paused' : shift.status}
                   </Badge>
                 </TableCell>
                 
                 <TableCell>
                  {shift.isEditing ? (
                    <Textarea
                      value={shift.editData?.notes || ''}
                      onChange={(e) => handleInputChange(shift.id, 'notes', e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                      placeholder="Add notes..."
                    />
                  ) : (
                    <div 
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onDoubleClick={() => handleDoubleClick(shift)}
                    >
                      {shift.notes || (
                        <span className="italic">Double-click to add notes</span>
                      )}
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
                     <div className="flex items-center space-x-1">
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => handleDoubleClick(shift)}
                         className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <Edit2 className="h-3 w-3" />
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => handleDeleteClick(shift)}
                         className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                   )}
                 </TableCell>
              </TableRow>
            ))}
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
             <p className="text-sm text-muted-foreground">
               Are you sure you want to delete this shift? This action cannot be undone.
             </p>
             
             {shiftToDelete && (
               <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                 <div className="text-sm">
                   <div className="font-medium text-red-900 dark:text-red-100">
                     Project: {shiftToDelete.project?.name}
                   </div>
                   <div className="text-red-700 dark:text-red-300">
                     Date: {formatDate(shiftToDelete.start_time)}
                   </div>
                   <div className="text-red-700 dark:text-red-300">
                     Duration: {shiftToDelete.end_time ? calculateDuration(shiftToDelete.start_time, shiftToDelete.end_time) : 'In Progress'}
                   </div>
                 </div>
               </div>
             )}
             
             <div className="flex space-x-2">
               <Button
                 onClick={handleDeleteConfirm}
                 disabled={deleting}
                 variant="destructive"
                 className="flex-1"
               >
                 {deleting ? 'Deleting...' : 'Yes, Delete Shift'}
               </Button>
               <Button
                 variant="outline"
                 onClick={handleDeleteCancel}
                 disabled={deleting}
                 className="flex-1"
               >
                 Cancel
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </>
   )
 } 