# TimeYeet Project TODOs

## Priority 1 - Core Security & Basic Features
- [✅] Implement user authentication using Supabase Auth
- [✅] Add user_id column to the shifts table
- [✅] Create proper Row Level Security (RLS) policies:
  - [✅] Create policy for INSERT operations
  - [✅] Create policy for SELECT operations
  - [✅] Create policy for UPDATE operations
  - [✅] Create policy for DELETE operations
- [✅] Add CSV/Excel export functionality
  - [✅] Implement export library
  - [✅] Add export button
  - [✅] Include total hours calculation
  - [ ] Custom "Ferrarini-style" CSV format
    - [ ] Custom header format
    - [ ] Specific data arrangement
    - [ ] Special formatting rules
    - [ ] Template system for different export styles

## Priority 2 - Essential Features
- [ ] Add ability to edit shift details
- [ ] Add ability to delete shifts
- [ ] Add shift reflection system
  - [ ] End-of-shift accomplishment prompts
  - [ ] Dynamic engaging questions
  - [ ] Save reflections with shifts
- [✅] Add user profile page

## Priority 3 - Enhanced Features
- [ ] Implement Zen Mode
  - [ ] 45/15 Pomodoro-style timer
  - [ ] Lock-in feature
  - [ ] Break reminders
  - [ ] Focus statistics
- [ ] Add notification system
  - [ ] Browser notifications
  - [ ] Custom reminders
  - [ ] Random inspirational messages
- [ ] Add reporting/analytics features
  - [ ] Daily summary
  - [ ] Weekly overview
  - [ ] Monthly statistics

## Priority 4 - UI/UX Improvements
- [✅] Add loading indicators
- [ ] Improve error handling and user feedback
- [ ] Add confirmation dialogs
- [ ] Make UI responsive for mobile devices
- [ ] Add achievement system
  - [ ] Focus streaks
  - [ ] Productivity milestones
  - [ ] Weekly goals

## Priority 5 - Deployment & Infrastructure
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Set up monitoring and error tracking
- [ ] Implement data backup system

## Nice to Have
- [ ] Voice commands
- [ ] Custom Zen mode intervals
- [ ] Integration with other productivity apps
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Weekly productivity insights email









this is the list of the columns that are added to the shifts table:
ALTER TABLE shifts
ADD COLUMN department VARCHAR(255), -- For "COMMESSA" (e.g., "sviluppo")
ADD COLUMN project VARCHAR(255),    -- For "SOTTO COMMESSA/CLIENTE" (e.g., "tasks# 2149/2148/2134/ 2134/2155/2156")
ADD COLUMN notes TEXT;             -- For "NOTE VARIE"