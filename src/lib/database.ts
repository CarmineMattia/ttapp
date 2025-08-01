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
      // First, ensure the employee exists
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')
      
      await this.ensureEmployeeExists(userId, user.email || '')
      
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          employee_id: userId,
          project_id: projectId,
          start_time: new Date().toISOString(),
          notes,
          status: 'in_progress'
        }])
        .select(`
          *,
          employee:employees(*),
          project:projects(*)
        `)
        .single()
      
      if (error) {
        throw error
      }
      
      return data as Shift
    } catch (error) {
      throw error
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
    const { data, error } = await supabase
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
    
    if (error) throw error
    return data as Shift
  },

  async resumeShift(shiftId: string) {
    const { data, error } = await supabase
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
    
    if (error) throw error
    return data as Shift
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
  }
} 