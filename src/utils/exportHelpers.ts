import * as XLSX from 'xlsx-js-style'
import { Shift } from '@/lib/database'

export const exportShiftsToExcel = (shifts: Shift[], filename: string = 'shifts-export') => {
  // Prepare data for export
  const exportData = shifts.map(shift => ({
    'Employee': shift.employee?.name || 'Unknown',
    'Project': shift.project?.name || 'Unknown',
    'Date': new Date(shift.start_time).toLocaleDateString(),
    'Start Time': new Date(shift.start_time).toLocaleTimeString(),
    'End Time': shift.end_time ? new Date(shift.end_time).toLocaleTimeString() : 'In Progress',
    'Duration (Hours)': shift.end_time 
      ? ((new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60)).toFixed(2)
      : 'In Progress',
    'Status': shift.status === 'in_progress' ? 'In Progress' : 
              shift.status === 'completed' ? 'Completed' : 
              shift.status === 'paused' ? 'Paused' : shift.status,
    'Notes': shift.notes || ''
  }))

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)

  // Style the header row
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center' }
  }

  // Apply styles to header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellAddress]) continue
    ws[cellAddress].s = headerStyle
  }

  // Style data rows
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!ws[cellAddress]) continue
      
      // Add alternating row colors
      ws[cellAddress].s = {
        fill: { fgColor: { rgb: row % 2 === 0 ? 'F2F2F2' : 'FFFFFF' } },
        alignment: { horizontal: 'left' }
      }
    }
  }

  // Set column widths
  ws['!cols'] = [
    { width: 15 }, // Employee
    { width: 15 }, // Project
    { width: 12 }, // Date
    { width: 12 }, // Start Time
    { width: 12 }, // End Time
    { width: 15 }, // Duration
    { width: 12 }, // Status
    { width: 30 }  // Notes
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Shifts')

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]
  const finalFilename = `${filename}-${timestamp}.xlsx`

  // Save the file
  XLSX.writeFile(wb, finalFilename)
}

export const exportShiftsToCSV = (shifts: Shift[], filename: string = 'shifts-export') => {
  // Prepare data for export
  const exportData = shifts.map(shift => ({
    'Employee': shift.employee?.name || 'Unknown',
    'Project': shift.project?.name || 'Unknown',
    'Date': new Date(shift.start_time).toLocaleDateString(),
    'Start Time': new Date(shift.start_time).toLocaleTimeString(),
    'End Time': shift.end_time ? new Date(shift.end_time).toLocaleTimeString() : 'In Progress',
    'Duration (Hours)': shift.end_time 
      ? ((new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60)).toFixed(2)
      : 'In Progress',
    'Status': shift.status === 'in_progress' ? 'In Progress' : 
              shift.status === 'completed' ? 'Completed' : 
              shift.status === 'paused' ? 'Paused' : shift.status,
    'Notes': shift.notes || ''
  }))

  // Convert to CSV
  const headers = Object.keys(exportData[0])
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      }).join(',')
    )
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().split('T')[0]
  const finalFilename = `${filename}-${timestamp}.csv`
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const calculateTotalHours = (shifts: Shift[]): number => {
  return shifts.reduce((total, shift) => {
    if (shift.end_time && shift.status === 'completed') {
      const startTime = new Date(shift.start_time).getTime()
      const endTime = new Date(shift.end_time).getTime()
      return total + (endTime - startTime) / (1000 * 60 * 60)
    }
    return total
  }, 0)
}

export const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return `${wholeHours}h ${minutes}m`
}