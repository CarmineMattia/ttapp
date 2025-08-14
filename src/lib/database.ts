import { supabase } from '@/lib/supabase'

// Types
export interface Employee {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Shift {
  id: string
  employee_id: string
  project_id: string
  start_time: string
  end_time?: string
  notes?: string
  status: 'in_progress' | 'completed' | 'paused'
  created_at: string
  // New fields for break tracking and overtime
  break_duration_ms?: number
  total_work_duration_ms?: number
  overtime_duration_ms?: number
  last_pause_time?: string
  last_resume_time?: string
  is_overtime?: boolean
  auto_logout_warning_sent?: boolean
  employee?: Employee
  project?: Project
}

// Database operations
export const db = {
  // Employee operations
  async getEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as Employee[]
  },

  async createEmployee(name: string, email: string, userId: string) {
    const { data, error } = await supabase
      .from('employees')
      .insert([{ 
        id: userId, // Use the user's ID as the employee ID
        name, 
        email 
      }])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data as Employee
  },

  async getEmployeeByUserId(userId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data as Employee | null
  },

  async ensureEmployeeExists(userId: string, email: string) {
    let employee = await this.getEmployeeByUserId(userId)
    
    if (!employee) {
      const name = email.split('@')[0] // Use email prefix as name
      employee = await this.createEmployee(name, email, userId)
    }
    
    return employee
  },

  // Project operations
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name')
    
    if (error) {
      throw error
    }
    
    return data as Project[]
  },

  async createProject(name: string, description?: string) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ name, description }])
      .select()
      .single()
    
    if (error) throw error
    return data as Project
  },

  // Shift operations
  async getShifts(userId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employee:employees(*),
        project:projects(*)
      `)
      .eq('employee_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Shift[]
  },

  async startShift(userId: string, projectId: string, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          employee_id: userId,
          project_id: projectId,
          start_time: new Date().toISOString(),
          notes: notes || null,
          status: 'in_progress',
          break_duration_ms: 0,
          total_work_duration_ms: 0,
          overtime_duration_ms: 0,
          is_overtime: false,
          auto_logout_warning_sent: false
        }])
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()
      
      if (error) throw error
      return data as Shift
    } catch (error) {
      // If the new columns don't exist yet, fall back to basic start
      console.warn('New columns not found, using basic start:', error)
      
      const { data, error: basicError } = await supabase
        .from('shifts')
        .insert([{
          employee_id: userId,
          project_id: projectId,
          start_time: new Date().toISOString(),
          notes: notes || null,
          status: 'in_progress'
        }])
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()
      
      if (basicError) throw basicError
      return data as Shift
    }
  },

  async stopShift(shiftId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', shiftId)
      .select(`
        *,
        employee:employees(*),
        project:projects(*)
      `)
      .single()
    
    if (error) throw error
    return data as Shift
  },

  async pauseShift(shiftId: string) {
    const now = new Date().toISOString()
    
    try {
      const { data, error } = await supabase
        .from('shifts')
        .update({
          status: 'paused',
          last_pause_time: now
        })
        .eq('id', shiftId)
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()
      
      if (error) throw error
      return data as Shift
    } catch (error) {
      // If the new columns don't exist yet, fall back to basic pause
      console.warn('New columns not found, using basic pause:', error)
      
      const { data, error: basicError } = await supabase
        .from('shifts')
        .update({
          status: 'paused'
        })
        .eq('id', shiftId)
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()
      
      if (basicError) throw basicError
      return data as Shift
    }
  },

  async resumeShift(shiftId: string) {
    const now = new Date().toISOString()
    
    try {
      // First, get the current shift to calculate break duration
      const { data: currentShift, error: fetchError } = await supabase
        .from('shifts')
        .select('last_pause_time, break_duration_ms')
        .eq('id', shiftId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Calculate additional break time
      const additionalBreakMs = currentShift.last_pause_time 
        ? new Date(now).getTime() - new Date(currentShift.last_pause_time).getTime()
        : 0
      
      const newBreakDuration = (currentShift.break_duration_ms || 0) + additionalBreakMs
      
      const { data, error } = await supabase
        .from('shifts')
        .update({
          status: 'in_progress',
          last_resume_time: now,
          break_duration_ms: newBreakDuration
        })
        .eq('id', shiftId)
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()
      
      if (error) throw error
      return data as Shift
    } catch (error) {
      // If the new columns don't exist yet, fall back to basic resume
      console.warn('New columns not found, using basic resume:', error)
      
      const { data, error: basicError } = await supabase
        .from('shifts')
        .update({
          status: 'in_progress'
        })
        .eq('id', shiftId)
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()
      
      if (basicError) throw basicError
      return data as Shift
    }
  },

  async getCurrentShift(userId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employee:employees(*),
        project:projects(*)
      `)
      .eq('employee_id', userId)
      .in('status', ['in_progress', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data as Shift | null
  },

  // Check for auto-logout warning
  async checkAutoLogoutWarning(userId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, start_time, auto_logout_warning_sent')
      .eq('employee_id', userId)
      .eq('status', 'in_progress')
      .eq('auto_logout_warning_sent', false)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    
    if (data) {
      const shiftStartTime = new Date(data.start_time).getTime()
      const now = new Date().getTime()
      const hoursElapsed = (now - shiftStartTime) / (1000 * 60 * 60)
      
      // Check if shift has been running for more than 12 hours
      if (hoursElapsed >= 12) {
        // Mark warning as sent
        await supabase
          .from('shifts')
          .update({ auto_logout_warning_sent: true })
          .eq('id', data.id)
        
        return {
          shouldWarn: true,
          hoursElapsed: Math.floor(hoursElapsed),
          shiftId: data.id
        }
      }
    }
    
    return { shouldWarn: false }
  },

  // Force stop shift for auto-logout
  async forceStopShift(shiftId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed',
        notes: (await supabase
          .from('shifts')
          .select('notes')
          .eq('id', shiftId)
          .single()).data?.notes + '\n[Auto-logout after 12 hours]'
      })
      .eq('id', shiftId)
      .select(`
        *,
        employee:employees(*),
        project:projects(*)
      `)
      .single()
    
    if (error) throw error
    return data as Shift
  },

  // User deletion operations
  async deleteUser(userId: string) {
    // 1. Delete all user's shifts
    const { error: shiftsError } = await supabase
      .from('shifts')
      .delete()
      .eq('employee_id', userId)

    if (shiftsError) {
      console.error('Error deleting shifts:', shiftsError)
      throw shiftsError
    }

    // 2. Delete employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .delete()
      .eq('id', userId)

    if (employeeError) {
      console.error('Error deleting employee:', employeeError)
      throw employeeError
    }

    // 3. Delete profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw profileError
    }

    // 4. Delete Supabase Auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      throw authError
    }
  }
} 