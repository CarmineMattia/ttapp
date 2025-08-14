-- TimeYeet Database Migration
-- This script adds new fields to existing employees table

-- Add new columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS surname TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Update existing records to have default values
-- Set surname to empty string for existing records
UPDATE employees 
SET surname = '' 
WHERE surname IS NULL;

-- Set date_of_birth to a default date for existing records
UPDATE employees 
SET date_of_birth = '1990-01-01' 
WHERE date_of_birth IS NULL;

-- Generate default profile images for existing records using DiceBear
UPDATE employees 
SET profile_image = 'https://api.dicebear.com/9.x/pixel-art/svg?seed=' || id 
WHERE profile_image IS NULL;

-- Make the new columns NOT NULL after setting default values
ALTER TABLE employees 
ALTER COLUMN surname SET NOT NULL,
ALTER COLUMN date_of_birth SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN employees.surname IS 'User last name';
COMMENT ON COLUMN employees.date_of_birth IS 'User date of birth for age verification';
COMMENT ON COLUMN employees.profile_image IS 'URL to user profile image (DiceBear avatar)';

-- Fix RLS policy for registration
-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own employee data" ON employees;

-- Create a new policy that allows insertion during registration
CREATE POLICY "Users can insert own employee data" ON employees
  FOR INSERT WITH CHECK (
    -- Allow insertion if user is authenticated and inserting their own record
    (auth.uid()::text = id::text) OR
    -- Allow insertion during registration (when auth.uid() might be null but we're creating a new user)
    (auth.uid() IS NULL AND id IS NOT NULL)
  );

-- ===== PHASE 1: BREAK TRACKING AND OVERTIME CALCULATION =====

-- Add break tracking columns to shifts table
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS break_duration_ms BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_work_duration_ms BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_duration_ms BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pause_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_resume_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_overtime BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_logout_warning_sent BOOLEAN DEFAULT FALSE;

-- Add comments for the new columns
COMMENT ON COLUMN shifts.break_duration_ms IS 'Total break time in milliseconds';
COMMENT ON COLUMN shifts.total_work_duration_ms IS 'Total actual work time (excluding breaks) in milliseconds';
COMMENT ON COLUMN shifts.overtime_duration_ms IS 'Overtime duration beyond 8 hours in milliseconds';
COMMENT ON COLUMN shifts.last_pause_time IS 'Timestamp of the last pause action';
COMMENT ON COLUMN shifts.last_resume_time IS 'Timestamp of the last resume action';
COMMENT ON COLUMN shifts.is_overtime IS 'Flag indicating if the shift has exceeded 8 hours';
COMMENT ON COLUMN shifts.auto_logout_warning_sent IS 'Flag to prevent multiple auto-logout warnings';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_break_duration ON shifts(break_duration_ms);
CREATE INDEX IF NOT EXISTS idx_shifts_overtime ON shifts(is_overtime);
CREATE INDEX IF NOT EXISTS idx_shifts_last_pause_time ON shifts(last_pause_time);

-- Update existing shifts to calculate break and work duration
-- This is a one-time migration for existing data
UPDATE shifts 
SET 
  total_work_duration_ms = CASE 
    WHEN end_time IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
    ELSE 
      EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000
  END,
  overtime_duration_ms = CASE 
    WHEN EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) > 28800 THEN -- 8 hours in seconds
      (EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) - 28800) * 1000
    ELSE 0
  END,
  is_overtime = CASE 
    WHEN EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) > 28800 THEN TRUE
    ELSE FALSE
  END
WHERE total_work_duration_ms = 0;

-- Create a function to calculate work duration and overtime
CREATE OR REPLACE FUNCTION calculate_shift_durations()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total work duration (excluding breaks)
  NEW.total_work_duration_ms = CASE 
    WHEN NEW.end_time IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) * 1000 - COALESCE(NEW.break_duration_ms, 0)
    ELSE 
      EXTRACT(EPOCH FROM (NOW() - NEW.start_time)) * 1000 - COALESCE(NEW.break_duration_ms, 0)
  END;
  
  -- Calculate overtime (beyond 8 hours = 28,800,000 milliseconds)
  NEW.overtime_duration_ms = CASE 
    WHEN NEW.total_work_duration_ms > 28800000 THEN 
      NEW.total_work_duration_ms - 28800000
    ELSE 0
  END;
  
  -- Set overtime flag
  NEW.is_overtime = (NEW.overtime_duration_ms > 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate durations
DROP TRIGGER IF EXISTS trigger_calculate_shift_durations ON shifts;
CREATE TRIGGER trigger_calculate_shift_durations
  BEFORE INSERT OR UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_shift_durations();

-- Create a function to check for auto-logout (12 hours = 43,200,000 milliseconds)
CREATE OR REPLACE FUNCTION check_auto_logout()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if shift has been running for more than 12 hours
  IF NEW.status = 'in_progress' AND 
     EXTRACT(EPOCH FROM (NOW() - NEW.start_time)) > 43200 AND -- 12 hours in seconds
     NOT NEW.auto_logout_warning_sent THEN
    -- Set the warning flag to prevent multiple warnings
    NEW.auto_logout_warning_sent = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-logout check
DROP TRIGGER IF EXISTS trigger_check_auto_logout ON shifts;
CREATE TRIGGER trigger_check_auto_logout
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION check_auto_logout(); 