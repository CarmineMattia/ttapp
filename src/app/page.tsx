'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { supabase, checkConnection } from '../../lib/supabase'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Auth from '@/components/Auth'
import Profile from '@/components/Profile'
import { exportFerrariniFormat } from '@/utils/exportHelpers'
import ExportDialog from '@/components/ExportDialog'

export default function Home() {
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [shifts, setShifts] = useState<{
    id?: number;
    start_time: string;
    end_time?: string;
    duration?: string;
  }[]>([])
  
  // Helper function to consistently format dates
  // Add user state
const [user, setUser] = useState<{
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: string | undefined;
  };
  user_metadata: {
    [key: string]: string | number | boolean | null | undefined;
  };
  aud: string;
  created_at: string;
} | null>(null)
  
  // Add auth state check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
  
    return () => subscription.unsubscribe()
  }, [])
  
  // Update datetime format to use 24h
    const formatDate = (isoString: string) => {
      try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).format(date);
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
      }
    };
  
    // Update datetime format to use 24h
    const formatDateTime = (isoString: string) => {
      try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date);
      } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid time';
      }
    };
  
  // Format duration to be more readable
  const formatDuration = (durationStr: string | undefined) => {
    if (!durationStr) return '-';
    
    const durationNum = parseFloat(durationStr);
    
    // If less than 1 minute, show seconds
    if (durationNum < 1) {
      const seconds = Math.round(durationNum * 60);
      return `${seconds}s`;
    }
    
    // If less than 60 minutes, show minutes
    if (durationNum < 60) {
      return `${Math.floor(durationNum)}m ${Math.round((durationNum % 1) * 60)}s`;
    }
    
    // If 60+ minutes, show hours and minutes
    const hours = Math.floor(durationNum / 60);
    const minutes = Math.floor(durationNum % 60);
    return `${hours}h ${minutes}m`;
  };
  
  // Load session state from localStorage on mount
  useEffect(() => {
    setIsMounted(true)
    
    // Restore session state from localStorage if available
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('timeYeetSession')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        setIsTracking(true)
        setStartTime(new Date(session.startTime))
      }
    }
  }, [])

  // Connection check
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const result = await checkConnection()
        console.log('Connection check result:', result)
        setIsConnected(result)
      } catch (error) {
        console.error('Connection check error:', error)
        setIsConnected(false)
      }
    }
    
    if (isMounted) {
      checkConnectionStatus()
    }
  }, [isMounted])

  // Fetch shifts
  useEffect(() => {
    const fetchShifts = async () => {
      if (isConnected) {
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .order('start_time', { ascending: false })
        
        if (error) {
          console.error('Error fetching shifts:', error)
        } else {
          setShifts(data || [])
        }
      }
    }
    
    fetchShifts()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('shifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, fetchShifts)
      .subscribe()
      
    return () => {
      subscription.unsubscribe()
    }
  }, [isConnected])

  const handleStart = async () => {
    try {
      setIsLoading(true)
      const now = new Date()
      setStartTime(now)
      setIsTracking(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      const { data, error } = await supabase.from('shifts').insert({
        start_time: now.toISOString(),
        user_id: user.id
      }).select()
      
      if (error) {
        console.error('Error starting shift:', error.message, error.details, error.hint)
        alert(`Failed to start shift: ${error.message}`)
        setIsTracking(false)
        setStartTime(null)
      } else {
        console.log('Shift started successfully:', data)
        localStorage.setItem('timeYeetSession', JSON.stringify({
          startTime: now.toISOString(),
          shiftId: data[0]?.id
        }))
      }
    } catch (err) {
      console.error('Error starting shift:', err)
      setIsTracking(false)
      setStartTime(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    try {
      setIsLoading(true)
      const endTime = new Date()
      const duration = startTime 
        ? ((endTime.getTime() - startTime.getTime()) / 60000).toFixed(2) 
        : '0:00'

      // Get shift ID from localStorage if available
      let shiftId = null
      const savedSession = localStorage.getItem('timeYeetSession')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        shiftId = session.shiftId
      }

      // If we have a shift ID from localStorage, use it directly
      if (shiftId) {
        const { data, error } = await supabase
          .from('shifts')
          .update({
            end_time: endTime.toISOString(),
            duration
          })
          .eq('id', shiftId)
          .select();
        
        if (error) {
          console.error('Error stopping shift:', error)
          alert(`Failed to stop shift: ${error.message}`)
        } else {
          console.log('Shift ended successfully:', data)
          setIsTracking(false)
          setStartTime(null)
          // Clear session from localStorage
          localStorage.removeItem('timeYeetSession')
          
          // Refresh shifts
          const { data: updatedShifts } = await supabase
            .from('shifts')
            .select('*')
            .order('start_time', { ascending: false });
            
          if (updatedShifts) {
            setShifts(updatedShifts);
          }
        }
      } else {
        // Fallback to the previous method if no shift ID in localStorage
        // Find the current active shift
        const { data: currentShift, error: fetchError } = await supabase
          .from('shifts')
          .select('*')
          .eq('start_time', startTime!.toISOString())
          .single();
        
        if (fetchError) {
          console.error('Error finding current shift:', fetchError);
          return;
        }
        
        // Update the shift with end time and duration
        const { data, error } = await supabase
          .from('shifts')
          .update({
            end_time: endTime.toISOString(),
            duration
          })
          .eq('id', currentShift.id)
          .select();
        
        if (error) {
          console.error('Error stopping shift:', error)
          alert(`Failed to stop shift: ${error.message}`)
        } else {
          console.log('Shift ended successfully:', data)
          setIsTracking(false)
          setStartTime(null)
          // Clear session from localStorage
          localStorage.removeItem('timeYeetSession')
          
          // Refresh shifts
          const { data: updatedShifts } = await supabase
            .from('shifts')
            .select('*')
            .order('start_time', { ascending: false });
            
          if (updatedShifts) {
            setShifts(updatedShifts);
          }
        }
      }
    } catch (err) {
      console.error('Error stopping shift:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: string, month: number | undefined, year: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')
  
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
  
      const userName = profile ? 
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
        user.email
  
      const startDate = new Date(year, (month ?? 1) - 1, 1)
      const endDate = new Date(year, month ?? 1, 0)
  
      const { data: monthShifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
  
      exportFerrariniFormat({
        month,
        year,
        userName: userName || '',
        shifts: monthShifts || [],
      })
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export timesheet')
    }
  }

  const [activeView, setActiveView] = useState<'timesheet' | 'profile'>('timesheet')

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">TimeYeet</h1>
        {user && (
          <div className="space-x-2">
            <Button 
              variant={activeView === 'timesheet' ? 'default' : 'outline'}
              onClick={() => setActiveView('timesheet')}
            >
              Timesheet
            </Button>
            <Button 
              variant={activeView === 'profile' ? 'default' : 'outline'}
              onClick={() => setActiveView('profile')}
            >
              Profile
            </Button>
            <Button 
              variant="outline" 
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {isMounted && (
        <>
          {!user ? (
            <Auth />
          ) : (
            <>
              {activeView === 'timesheet' ? (
                <div>
                  <div className="mt-2 text-sm">
                    Connection status: {isConnected === null ? 'Checking...' : isConnected ? '✅ Connected' : '❌ Not connected'}
                  </div>
                  <div className="mt-4 space-x-4">
                    <Button 
                      onClick={handleStart} 
                      disabled={isTracking || isLoading || !isConnected}
                    >
                      {isLoading && isTracking === false ? 'Starting...' : 'Start Shift'}
                    </Button>
                    <Button 
                      onClick={handleStop} 
                      disabled={!isTracking || isLoading}
                    >
                      {isLoading && isTracking ? 'Stopping...' : 'Stop Shift'}
                    </Button>
                  </div>

                  {/* Shift Table */}
                  <div className="mt-8">
                    <Table>
                      <TableCaption>Your recent shifts</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>End Time</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shifts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">No shifts recorded yet</TableCell>
                          </TableRow>
                        ) : (
                          shifts.map((shift) => (
                            <TableRow key={shift.id || shift.start_time}>
                              <TableCell>{formatDate(shift.start_time)}</TableCell>
                              <TableCell>{formatDateTime(shift.start_time)}</TableCell>
                              <TableCell>
                                {shift.end_time ? formatDateTime(shift.end_time) : 'In progress'}
                              </TableCell>
                              <TableCell>{formatDuration(shift.duration)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Export Dialog */}
                  <div className="mt-4">
                    <ExportDialog onExport={handleExport} disabled={shifts.length === 0} />
                  </div>
                </div>
              ) : (
                <Profile />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
