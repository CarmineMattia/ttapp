-- TimeYeet Database Setup
-- This script creates all necessary tables, policies, and sample data for the TimeYeet application

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Create employees table
-- This table stores user profile information
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
-- This table stores work projects and categories
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shifts table
-- This table stores time tracking sessions
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX idx_shifts_project_id ON shifts(project_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);

-- Insert sample projects
-- These are example projects that users can start with
INSERT INTO projects (name, description) VALUES
  ('Project Alpha', 'Main development project'),
  ('Project Beta', 'Testing and quality assurance'),
  ('Project Gamma', 'Documentation and research'),
  ('Project Delta', 'Client meetings and communication');

-- Enable Row Level Security (RLS)
-- This ensures users can only access their own data
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own employee data" ON employees;
DROP POLICY IF EXISTS "Users can insert own employee data" ON employees;
DROP POLICY IF EXISTS "Users can update own employee data" ON employees;

DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;

DROP POLICY IF EXISTS "Users can view own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can insert own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can update own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can delete own shifts" ON shifts;

-- Create RLS policies for employees table
-- Users can only view, insert, and update their own employee record
CREATE POLICY "Users can view own employee data" ON employees
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own employee data" ON employees
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own employee data" ON employees
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for projects table
-- All authenticated users can view and insert projects
CREATE POLICY "Authenticated users can view projects" ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert projects" ON projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for shifts table
-- Users can only view, insert, update, and delete their own shifts
CREATE POLICY "Users can view own shifts" ON shifts
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Users can insert own shifts" ON shifts
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

CREATE POLICY "Users can update own shifts" ON shifts
  FOR UPDATE USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Users can delete own shifts" ON shifts
  FOR DELETE USING (auth.uid()::text = employee_id::text);

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as projects_count FROM projects;
SELECT COUNT(*) as employees_count FROM employees;
SELECT COUNT(*) as shifts_count FROM shifts; 