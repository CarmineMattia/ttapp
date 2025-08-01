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