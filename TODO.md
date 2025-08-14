# TimeYeet TODO List

## Core Application Setup ✅
- [x] Set up Next.js 15 project
- [x] Configure TypeScript
- [x] Set up Supabase project and connection
- [x] Configure environment variables
- [x] Set up TailwindCSS

## Authentication and User Management ✅
- [x] Implement Supabase Auth
- [x] Create sign up/sign in components
- [x] Set up protected routes
- [x] Implement user profile management
- [x] Add user account deletion functionality
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Implement password reset flow
- [ ] Add email verification

## Database Schema
- [x] Set up users table (handled by Supabase Auth)
- [x] Create shifts table with required columns
- [x] Create teams table with required columns
- [x] Create team_members table for team associations
- [x] Add missing fields to employees table (surname, date_of_birth, profile_image, phone)
- [x] Add DELETE policies for user data management
- [x] Create avatars storage bucket with RLS policies
- [x] Add break tracking and overtime calculation fields to shifts table
- [x] Add auto-logout tracking fields to shifts table
- [x] Create database triggers for automatic calculations
- [ ] Add indexes for performance optimization
- [ ] Set up RLS policies for teams and team_members
- [ ] Create views for team analytics
- [ ] Add triggers for updating team statistics

## User Data Management ✅
- [x] Add missing database fields (surname, date_of_birth, profile_image)
- [x] Update avatar URLs for all users
- [x] Create missing employee records for profile-only users
- [x] Implement complete user account deletion
- [x] Add proper RLS policies for user deletion
- [x] Add confirmation dialogs for dangerous actions

## Phase 1: Core Time Tracking Features ✅
- [x] Basic clock in/out functionality
- [x] Add break tracking with pause/resume functionality
- [x] Implement overtime calculation (after 8 hours)
- [x] Add visual overtime indicators (purple highlight)
- [x] Create auto-logout after 12 hours with notifications
- [x] Add break duration tracking in database
- [x] Implement work duration calculation (excluding breaks)
- [x] Add overtime duration tracking
- [x] Create auto-logout warning component
- [x] Update Timer component with break and overtime display
- [x] Enhance ShiftsTable with break and overtime columns
- [x] Update dashboard statistics with break and overtime data
- [x] Add database triggers for automatic calculations
- [x] Create utility functions for time calculations

## Team Features (Phase 2 Priority)
- [ ] Implement team creation flow
- [ ] Add team member invitation system
- [ ] Create team dashboard view
- [ ] Add team settings management
- [ ] Implement team member roles and permissions
- [ ] Add team activity feed
- [ ] Create team analytics dashboard
- [ ] Implement team export features

## Time Tracker Core (Phase 1 Complete)
- [x] Basic clock in/out functionality
- [x] Add break tracking
- [x] Implement overtime calculation
- [ ] Add task tracking during shifts
- [x] Create real-time status indicators
- [ ] Add shift notes and tags
- [ ] Implement automatic time rounding
- [ ] Add shift validation rules

## Dashboard Implementation (Phase 2 Priority)
- [x] Create main dashboard layout
- [x] Add enhanced statistics with break and overtime data
- [x] Implement time statistics widgets
- [ ] Add weekly/monthly view toggles
- [ ] Add recent activity feed
- [ ] Create team overview section
- [ ] Add quick actions panel
- [ ] Implement data visualization charts
- [ ] Add export options UI

## Settings and Profile
- [x] Basic profile management
- [x] Avatar customization and generation
- [x] Real image upload functionality
- [x] Password change functionality
- [x] Account deletion with data cleanup
- [x] Add timezone settings
- [x] Add date and time format preferences
- [x] Implement time preferences in shifts table and components
- [ ] Implement notification preferences
- [ ] Create data export functionality

## End-of-Shift Features (Phase 2 Priority)
- [ ] Create shift summary view
- [ ] Implement task completion checklist
- [ ] Add next shift preparation notes
- [ ] Create shift report generation
- [ ] Add shift approval workflow
- [ ] Implement overtime request system

## Security and Performance
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Set up error monitoring
- [ ] Implement caching strategy
- [ ] Add performance monitoring
- [ ] Create backup strategy
- [ ] Implement audit logging

## Deployment
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Set up monitoring and alerts
- [ ] Create deployment documentation
- [ ] Implement zero-downtime updates
- [ ] Set up staging environment

## Documentation
- [ ] Create API documentation
- [ ] Write user guide
- [ ] Add developer documentation
- [ ] Create deployment guide
- [ ] Write contribution guidelines
- [ ] Add security documentation

## Phase 2: Enhanced Features (Next Priority)
- [ ] Add data visualization charts (Recharts)
- [ ] Implement weekly/monthly view toggles
- [ ] Create team management features
- [ ] Add advanced reporting and analytics
- [ ] Implement mobile responsiveness improvements
- [ ] Add notification system
- [ ] Create end-of-shift experience features
- [ ] Implement task tracking during shifts

this is the list of the columns that are added to the shifts table:
ALTER TABLE shifts
ADD COLUMN department VARCHAR(255), -- For "COMMESSA" (e.g., "sviluppo")
ADD COLUMN project VARCHAR(255),    -- For "SOTTO COMMESSA/CLIENTE" (e.g., "tasks# 2149/2148/2134/ 2134/2155/2156")
ADD COLUMN notes TEXT;             -- For "NOTE VARIE"