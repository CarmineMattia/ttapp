'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/lib/auth-context'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  HelpCircle, 
  Search,
  LogOut,
  User,
  Plus,
  Mail,
  BarChart3,
  FolderOpen,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth'
  }

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: FolderOpen, label: 'Projects', href: '/projects' },
  ]

  const documentItems = [
    { icon: FileText, label: 'Data Library', href: '/data-library' },
    { icon: FileText, label: 'Reports', href: '/reports' },
    { icon: FileText, label: 'Word Assistant', href: '/word-assistant' },
  ]

  const utilityItems = [
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: HelpCircle, label: 'Get Help', href: '/help' },
    { icon: Search, label: 'Search', href: '/search' },
  ]

  return (
    <div className={`bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">TimeYeet</h1>
              <p className="text-xs text-gray-400">Time tracking app</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Create */}
      <div className="p-4 border-b border-gray-800">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {!isCollapsed && "Quick Create"}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-4 space-y-6">
        <div>
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => window.location.href = item.href}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {!isCollapsed && item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Documents Section */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Documents
            </h3>
          )}
          <div className="space-y-2">
            {documentItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => window.location.href = item.href}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {!isCollapsed && item.label}
              </Button>
            ))}
            {!isCollapsed && (
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <MoreHorizontal className="w-4 h-4 mr-3" />
                More
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-800 space-y-4">
        {/* Utility Items */}
        <div className="space-y-2">
          {utilityItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => window.location.href = item.href}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {!isCollapsed && item.label}
            </Button>
          ))}
        </div>

        {/* Dark Mode Toggle */}
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Dark Mode</span>
            <div className="w-10 h-6 bg-gray-700 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-800">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-300 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 