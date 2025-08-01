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
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Implement password reset flow
- [ ] Add email verification

## Database Schema
- [x] Set up users table (handled by Supabase Auth)
- [x] Create shifts table with required columns
- [x] Create teams table with required columns
- [x] Create team_members table for team associations
- [ ] Add indexes for performance optimization
- [ ] Set up RLS policies for teams and team_members
- [ ] Create views for team analytics
- [ ] Add triggers for updating team statistics

## Team Features (New Priority)
- [ ] Implement team creation flow
- [ ] Add team member invitation system
- [ ] Create team dashboard view
- [ ] Add team settings management
- [ ] Implement team member roles and permissions
- [ ] Add team activity feed
- [ ] Create team analytics dashboard
- [ ] Implement team export features

## Time Tracker Core
- [x] Basic clock in/out functionality
- [ ] Add break tracking
- [ ] Implement overtime calculation
- [ ] Add task tracking during shifts
- [ ] Create real-time status indicators
- [ ] Add shift notes and tags
- [ ] Implement automatic time rounding
- [ ] Add shift validation rules

## Dashboard Implementation
- [ ] Create main dashboard layout
- [ ] Add weekly/monthly view toggles
- [ ] Implement time statistics widgets
- [ ] Add recent activity feed
- [ ] Create team overview section
- [ ] Add quick actions panel
- [ ] Implement data visualization charts
- [ ] Add export options UI

## Settings and Profile
- [x] Basic profile management
- [ ] Add avatar customization
- [ ] Implement notification preferences
- [ ] Add timezone management
- [ ] Create display preferences
- [ ] Add account deletion flow
- [ ] Implement data export options
- [ ] Add API key management

## End-of-Shift Features
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

this is the list of the columns that are added to the shifts table:
ALTER TABLE shifts
ADD COLUMN department VARCHAR(255), -- For "COMMESSA" (e.g., "sviluppo")
ADD COLUMN project VARCHAR(255),    -- For "SOTTO COMMESSA/CLIENTE" (e.g., "tasks# 2149/2148/2134/ 2134/2155/2156")
ADD COLUMN notes TEXT;             -- For "NOTE VARIE