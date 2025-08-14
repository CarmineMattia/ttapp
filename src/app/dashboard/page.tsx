'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import Timer from '@/components/Timer';
import ShiftsTable from '@/components/ShiftsTable';
import { supabase } from '@/lib/supabase';
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
  ChevronDown,
  Coffee
} from 'lucide-react';
import { db, type Shift } from '../../lib/database';
import { exportShiftsToExcel, exportShiftsToCSV, calculateTotalHours, formatDuration } from '@/utils/exportHelpers';
import { checkAndFixUserProfiles, getUserProfile } from '@/utils/databaseCheck';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchDialog, type SearchFilters } from '@/components/SearchDialog';
import { formatDurationShort, isOvertime } from '@/utils/dateTimeUtils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userProfile, setUserProfile] = useState<{ name: string; surname: string } | null>(null);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalShifts: 0,
    completedShifts: 0,
    averageHoursPerShift: 0,
    totalBreakTime: 0,
    totalOvertime: 0,
    overtimeShifts: 0
  });
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    projectFilter: '',
    statusFilter: '',
    dateFrom: '',
    dateTo: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  // Load user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        console.log('Dashboard: Fetching profile for user ID:', user.id);
        
        const { data, error } = await supabase
          .from('employees')
          .select('name, surname, email')
          .eq('id', user.id)
          .single();

        console.log('Dashboard: Profile fetch result - data:', data, 'error:', error);

        if (error) {
          console.error('Dashboard: Error fetching user profile:', error);
          // Set default values if profile doesn't exist
          setUserProfile({
            name: user.user_metadata?.name || 'User',
            surname: user.user_metadata?.surname || 'Name'
          });
        } else if (data) {
          console.log('Dashboard: Successfully fetched profile:', data);
          setUserProfile({
            name: data.name || 'User',
            surname: data.surname || 'Name'
          });
        }
      } catch (error) {
        console.error('Dashboard: Exception fetching user profile:', error);
        setUserProfile({
          name: 'User',
          surname: 'Name'
        });
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Load user and shifts data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const shiftsData = await db.getShifts(user.id);
        setShifts(shiftsData);
        
        // Calculate enhanced stats with break and overtime data
        const completedShifts = shiftsData.filter(s => s.status === 'completed');
        const totalWorkHours = completedShifts.reduce((total, shift) => {
          return total + ((shift.total_work_duration_ms || 0) / (1000 * 60 * 60));
        }, 0);
        
        const totalBreakHours = completedShifts.reduce((total, shift) => {
          return total + ((shift.break_duration_ms || 0) / (1000 * 60 * 60));
        }, 0);
        
        const totalOvertimeHours = completedShifts.reduce((total, shift) => {
          return total + ((shift.overtime_duration_ms || 0) / (1000 * 60 * 60));
        }, 0);
        
        const overtimeShifts = completedShifts.filter(shift => 
          isOvertime(shift.total_work_duration_ms || 0)
        ).length;
        
        const averageHours = completedShifts.length > 0 ? totalWorkHours / completedShifts.length : 0;
        
        setStats({
          totalHours: totalWorkHours,
          totalShifts: shiftsData.length,
          completedShifts: completedShifts.length,
          averageHoursPerShift: averageHours,
          totalBreakTime: totalBreakHours,
          totalOvertime: totalOvertimeHours,
          overtimeShifts: overtimeShifts
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
      
      // Recalculate enhanced stats
      const completedShifts = shiftsData.filter(s => s.status === 'completed');
      const totalWorkHours = completedShifts.reduce((total, shift) => {
        return total + ((shift.total_work_duration_ms || 0) / (1000 * 60 * 60));
      }, 0);
      
      const totalBreakHours = completedShifts.reduce((total, shift) => {
        return total + ((shift.break_duration_ms || 0) / (1000 * 60 * 60));
      }, 0);
      
      const totalOvertimeHours = completedShifts.reduce((total, shift) => {
        return total + ((shift.overtime_duration_ms || 0) / (1000 * 60 * 60));
      }, 0);
      
      const overtimeShifts = completedShifts.filter(shift => 
        isOvertime(shift.total_work_duration_ms || 0)
      ).length;
      
      const averageHours = completedShifts.length > 0 ? totalWorkHours / completedShifts.length : 0;
      
      setStats({
        totalHours: totalWorkHours,
        totalShifts: shiftsData.length,
        completedShifts: completedShifts.length,
        averageHoursPerShift: averageHours,
        totalBreakTime: totalBreakHours,
        totalOvertime: totalOvertimeHours,
        overtimeShifts: overtimeShifts
      });

      // Trigger table refresh
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    if (format === 'excel') {
      exportShiftsToExcel(shifts, 'my-shifts');
    } else {
      exportShiftsToCSV(shifts, 'my-shifts');
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleClearSearch = () => {
    setSearchFilters({
      query: '',
      projectFilter: '',
      statusFilter: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Get unique projects for the search filter
  const uniqueProjects = Array.from(new Set(
    shifts
      .map(shift => shift.project?.name)
      .filter(Boolean) as string[]
  )).sort();

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

  // Get display name
  const displayName = userProfile 
    ? `${userProfile.name} ${userProfile.surname}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {displayName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's what's happening with your time tracking today.
              </p>
            </div>
            {/* Debug button - remove in production */}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                console.log('🔍 Debug: Checking database...')
                await checkAndFixUserProfiles()
                if (user) {
                  await getUserProfile(user.id)
                }
              }}
              className="text-xs"
            >
              Debug DB
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Work Hours</h3>
              <Clock className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalHours.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.completedShifts} completed shifts
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Break Time</h3>
              <Coffee className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalBreakTime.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total break time
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Overtime</h3>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalOvertime.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.overtimeShifts} overtime shifts
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Avg. Hours</h3>
              <Target className="h-4 w-4 text-blue-500" />
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
              Start, pause, and stop your work sessions with break tracking and overtime calculation.
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
                  View and manage all your time tracking shifts with break and overtime details
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <SearchDialog
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  currentFilters={searchFilters}
                  projects={uniqueProjects}
                />
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
          
          <div className="p-6">
            <ShiftsTable 
              onShiftUpdate={handleShiftUpdate} 
              refreshTrigger={refreshTrigger} 
              searchFilters={searchFilters}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 