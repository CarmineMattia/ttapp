'use client'

import { useState } from 'react'
import { Search, X, Calendar, FileText, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export interface SearchFilters {
  query: string
  projectFilter: string
  statusFilter: string
  dateFrom: string
  dateTo: string
}

interface SearchDialogProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  currentFilters: SearchFilters
  projects: string[]
}

export function SearchDialog({ onSearch, onClear, currentFilters, projects }: SearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(currentFilters)

  const handleSearch = () => {
    onSearch(filters)
    setOpen(false)
  }

  const handleClear = () => {
    const emptyFilters: SearchFilters = {
      query: '',
      projectFilter: '',
      statusFilter: '',
      dateFrom: '',
      dateTo: ''
    }
    setFilters(emptyFilters)
    onClear()
    setOpen(false)
  }

  const hasActiveFilters = Object.values(currentFilters).some(value => value !== '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative ${hasActiveFilters ? 'text-primary' : ''}`}
        >
          <Search className="h-4 w-4" />
          {hasActiveFilters && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
            >
              !
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Shifts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Search in notes and project names</Label>
            <Input
              id="search-query"
              placeholder="Search for specific text..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            />
          </div>

          {/* Project Filter */}
          <div className="space-y-2">
            <Label htmlFor="project-filter">Project</Label>
            <select
              id="project-filter"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              value={filters.projectFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, projectFilter: e.target.value }))}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              value={filters.statusFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-sm">From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-sm">To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {currentFilters.query && (
                  <Badge variant="secondary" className="text-xs">
                    Query: {currentFilters.query}
                  </Badge>
                )}
                {currentFilters.projectFilter && (
                  <Badge variant="secondary" className="text-xs">
                    Project: {currentFilters.projectFilter}
                  </Badge>
                )}
                {currentFilters.statusFilter && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {currentFilters.statusFilter}
                  </Badge>
                )}
                {currentFilters.dateFrom && (
                  <Badge variant="secondary" className="text-xs">
                    From: {currentFilters.dateFrom}
                  </Badge>
                )}
                {currentFilters.dateTo && (
                  <Badge variant="secondary" className="text-xs">
                    To: {currentFilters.dateTo}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClear}>
              Clear All
            </Button>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 