export interface UserPreferences {
  timezone: string
  dateFormat: string
  timeFormat: string
}

/**
 * Format a date according to user preferences
 */
export function formatDate(date: Date | string, preferences: UserPreferences): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: preferences.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }

  const formatted = dateObj.toLocaleDateString('en-US', options)
  
  // Apply custom date format
  switch (preferences.dateFormat) {
    case 'DD/MM/YYYY':
      return formatted.split('/').reverse().join('/')
    case 'YYYY/MM/DD':
      return formatted.split('/').reverse().join('/')
    case 'MM-DD-YYYY':
      return formatted.replace(/\//g, '-')
    case 'DD-MM-YYYY':
      return formatted.split('/').reverse().join('-')
    case 'YYYY-MM-DD':
      return formatted.split('/').reverse().join('-')
    default:
      return formatted
  }
}

/**
 * Format a time according to user preferences
 */
export function formatTime(date: Date | string, preferences: UserPreferences): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: preferences.timezone,
    hour: preferences.timeFormat === '12h' ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12: preferences.timeFormat === '12h'
  }

  return dateObj.toLocaleTimeString('en-US', options)
}

/**
 * Format a date and time according to user preferences
 */
export function formatDateTime(date: Date | string, preferences: UserPreferences): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const dateStr = formatDate(dateObj, preferences)
  const timeStr = formatTime(dateObj, preferences)
  
  return `${dateStr} ${timeStr}`
}

/**
 * Get current time in user's timezone
 */
export function getCurrentTimeInTimezone(preferences: UserPreferences): string {
  return formatTime(new Date(), preferences)
}

/**
 * Get current date in user's timezone
 */
export function getCurrentDateInTimezone(preferences: UserPreferences): string {
  return formatDate(new Date(), preferences)
}

/**
 * Convert a date to user's timezone
 */
export function convertToUserTimezone(date: Date | string, preferences: UserPreferences): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Create a new date object in the user's timezone
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000)
  const userTimezoneOffset = new Date(utc).toLocaleString('en-US', { timeZone: preferences.timezone })
  
  return new Date(userTimezoneOffset)
} 

// New utility functions for Phase 1 features
export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

export const formatDurationShort = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export const calculateWorkDuration = (startTime: string, endTime?: string, breakDurationMs: number = 0): number => {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : new Date().getTime()
  return Math.max(0, end - start - breakDurationMs)
}

export const calculateOvertimeDuration = (workDurationMs: number): number => {
  const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
  return Math.max(0, workDurationMs - EIGHT_HOURS_MS)
}

export const isOvertime = (workDurationMs: number): boolean => {
  const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000
  return workDurationMs > EIGHT_HOURS_MS
}

export const shouldAutoLogout = (startTime: string): boolean => {
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000 // 12 hours in milliseconds
  const start = new Date(startTime).getTime()
  const now = new Date().getTime()
  return (now - start) >= TWELVE_HOURS_MS
}

export const getTimeUntilAutoLogout = (startTime: string): number => {
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
  const start = new Date(startTime).getTime()
  const now = new Date().getTime()
  const elapsed = now - start
  return Math.max(0, TWELVE_HOURS_MS - elapsed)
}

export const formatTimeUntilAutoLogout = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  } else {
    return `${minutes}m remaining`
  }
}

// Color utilities for overtime indicators
export const getOvertimeColor = (isOvertime: boolean): string => {
  return isOvertime ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
}

export const getOvertimeBgColor = (isOvertime: boolean): string => {
  return isOvertime ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
}

export const getAutoLogoutColor = (hoursElapsed: number): string => {
  if (hoursElapsed >= 12) return 'text-red-600 dark:text-red-400'
  if (hoursElapsed >= 11) return 'text-orange-600 dark:text-orange-400'
  if (hoursElapsed >= 10) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-gray-600 dark:text-gray-400'
} 