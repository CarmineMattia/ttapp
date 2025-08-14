-- TimeYeet Phase 1 Migration - Simplified Version
-- This script adds break tracking and overtime calculation features

-- Add break tracking columns to shifts table (only if they don't exist)
DO $$ 
BEGIN
    -- Add break_duration_ms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shifts' AND column_name = 'break_duration_ms') THEN
        ALTER TABLE shifts ADD COLUMN break_duration_ms BIGINT DEFAULT 0;
    END IF;
    
    -- Add total_work_duration_ms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shifts' AND column_name = 'total_work_duration_ms') THEN
        ALTER TABLE shifts ADD COLUMN total_work_duration_ms BIGINT DEFAULT 0;
    END IF;
    
    -- Add overtime_duration_ms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shifts' AND column_name = 'overtime_duration_ms') THEN
        ALTER TABLE shifts ADD COLUMN overtime_duration_ms BIGINT DEFAULT 0;
    END IF;
    
    -- Add last_pause_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shifts' AND column_name = 'last_pause_time') THEN
        ALTER TABLE shifts ADD COLUMN last_pause_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add last_resume_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shifts' AND column_name = 'last_resume_time') THEN
        ALTER TABLE shifts ADD COLUMN last_resume_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add is_overtime column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shifts' AND column_name = 'is_overtime') THEN
        ALTER TABLE shifts ADD COLUMN is_overtime BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add auto_logout_warning_sent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shifts' AND column_name = 'auto_logout_warning_sent') THEN
        ALTER TABLE shifts ADD COLUMN auto_logout_warning_sent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_shifts_break_duration ON shifts(break_duration_ms);
CREATE INDEX IF NOT EXISTS idx_shifts_overtime ON shifts(is_overtime);
CREATE INDEX IF NOT EXISTS idx_shifts_last_pause_time ON shifts(last_pause_time);

-- Update existing shifts to calculate initial values
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
WHERE total_work_duration_ms = 0 OR total_work_duration_ms IS NULL;

-- Create function to calculate shift durations
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

-- Create function to check for auto-logout
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

-- Verify the migration
SELECT 'Phase 1 migration completed successfully!' as status;
SELECT COUNT(*) as shifts_count FROM shifts; 