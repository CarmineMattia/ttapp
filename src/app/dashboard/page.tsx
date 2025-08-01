'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import Timer from '@/components/Timer';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Calendar,
  Target,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  FileText,
  ChevronDown
} from 'lucide-react';
import { db, type Shift } from '../../lib/database';
import { exportShiftsToExcel, exportShiftsToCSV, calculateTotalHours, formatDuration } from '@/utils/exportHelpers';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalShifts: 0,
    completedShifts: 0,
    averageHoursPerShift: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  // Load user and shifts data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const shiftsData = await db.getShifts(user.id);
        setShifts(shiftsData);
        
        // Calculate stats
        const totalHours = calculateTotalHours(shiftsData);
        const completedShifts = shiftsData.filter(s => s.status === 'completed').length;
        const averageHours = completedShifts > 0 ? totalHours / completedShifts : 0;
        
        setStats({
          totalHours,
          totalShifts: shiftsData.length,
          completedShifts,
          averageHoursPerShift: averageHours
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const handleShiftUpdate = async () => {
    if (user) {
      const shiftsData = await db.getShifts(user.id);
      setShifts(shiftsData);
      
      // Recalculate stats
      const totalHours = calculateTotalHours(shiftsData);
      const completedShifts = shiftsData.filter(s => s.status === 'completed').length;
      const averageHours = completedShifts > 0 ? totalHours / completedShifts : 0;
      
      setStats({
        totalHours,
        totalShifts: shiftsData.length,
        completedShifts,
        averageHoursPerShift: averageHours
      });
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    if (format === 'excel') {
      exportShiftsToExcel(shifts, 'my-shifts');
    } else {
      exportShiftsToCSV(shifts, 'my-shifts');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'paused':
        return 'Paused';
      default:
        return status;
    }
  };

  // Show loading while checking auth or loading data
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            {authLoading ? 'Checking authentication...' : 'Loading your data...'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your time tracking today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Total Hours</h3>
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(stats.totalHours)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.completedShifts} completed shifts
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Total Shifts</h3>
              <Target className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalShifts}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All time tracking sessions
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Completed</h3>
              <Users className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedShifts}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Finished sessions
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Avg. Hours</h3>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averageHoursPerShift.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Per completed shift
            </p>
          </div>
        </div>

        {/* Timer Component */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Time Tracking</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start, pause, and stop your work sessions.
            </p>
          </div>
          <Timer onShiftUpdate={handleShiftUpdate} />
        </div>

        {/* Shifts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Shifts</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View and manage all your time tracking shifts
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Search className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Filter className="h-4 w-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      <Download className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export to CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No shifts found. Start your first timer to begin tracking!
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => {
                    const duration = shift.end_time 
                      ? (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60)
                      : null;
                    
                    return (
                      <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {shift.project?.name || 'Unknown Project'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(shift.start_time).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(shift.start_time).toLocaleTimeString()} - {shift.end_time ? new Date(shift.end_time).toLocaleTimeString() : 'In Progress'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {duration ? formatDuration(duration) : 'In Progress'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shift.status)}`}>
                            {getStatusText(shift.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {shift.notes || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {shifts.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 