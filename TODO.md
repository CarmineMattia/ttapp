# TimeYeet Project TODOs - Feature Breakdown

## Core Clocking & Session Management
- [✅] Implement user authentication (Supabase Auth)
- [ ] Implement Swipe Gestures:
  - [ ] Swipe up to clock in
  - [ ] Swipe down to clock out
- [ ] Implement Status System:
  - [ ] Color-coded status: Green (working), Yellow (paused), Grey (logged off)
  - [ ] Background shifts based on status (Green/Yellow/Grey)
- [ ] Implement Pause/Play Functionality:
  - [ ] Pause Button (⏸️): Freezes timer, switches to yellow, triggers frosty blur effect
  - [ ] Play Button (▶️): Resumes timer, returns to green, lifts freeze effect
  - [ ] Track break time separately based on Pause/Play usage
  - [ ] Implement Pause/Play button UI and logic swap
- [ ] Implement Overtime Mode:
  - [ ] Auto-trigger after 8 hours if not logged off
  - [ ] Highlight swipe button border in purple
  - [ ] Track and display "Extra Hours" (purple stat pill)
- [ ] Implement Auto-logout:
  - [ ] Auto-logout after 12 hours (Italy's legal shift limit)
  - [ ] Display notification ("Max shift reached—rest now!")
  - [ ] Visual cue on auto-logout (Red flash?)
- [ ] Implement Main Clock-in UI (Swipe Zone):
  - [ ] Large circular swipe zone
  - [ ] Gradient border (Green-Yellow-Grey, shifting to Purple in overtime)
  - [ ] Animated arrow icon (Up/Down)
  - [ ] Frosty blur effect on pause ("iced over" clock numbers)
  - [ ] "Shift Ended" text fade-in on log off
- [ ] Implement Main UI Displays:
  - [ ] Digital clock display (e.g., "16:15, April 03, 2025")
  - [ ] Live work counter (e.g., "5h 10m")
  - [ ] Stats pills: Break Time (Yellow), Total Hours (Green), Extra Hours (Purple)
- [ ] Implement Feedback:
  - [ ] Sound feedback on swipes
  - [ ] Haptic feedback on swipes

## User Views & Data Management
- [✅] Add user_id column to shifts table
- [✅] Add department, project, notes columns to shifts table
- [ ] Implement User Table View:
  - [ ] Display daily start/end times, total hours, break time, extra hours (purple if applicable)
  - [ ] Allow editing past shifts directly in the table
  - [ ] Allow adding new shifts directly in the table (consider adding notes field here)
  - [ ] Allow deleting shifts
- [ ] Implement User Calendar View:
  - [ ] Display view-only calendar
  - [ ] Add visual indicators ("oil ticks" / small marks) on days worked
- [✅] Add user profile page

## Admin Dashboard & Reporting
- [ ] Build Admin Dashboard UI (Inspired by ShadCN UI v4 / Tailwind CSS)
- [ ] Implement Data Visualization:
  - [ ] Add sleek graphs for key metrics
- [ ] Implement Filtering:
  - [ ] Filter data by date range
  - [ ] Filter data by employee/person
- [ ] Display Metrics:
  - [ ] Total hours per employee
  - [ ] Total break time per employee
  - [ ] Total overtime per employee
- [ ] Implement Export Functionality:
  - [✅] Basic CSV/Excel export library integration
  - [✅] Add export button to dashboard
  - [✅] Include total hours calculation in basic export
  - [ ] Implement custom "Ferrarini-style" CSV format
    - [ ] Custom header format
    - [ ] Specific data arrangement
    - [ ] Special formatting rules
    - [ ] Consider template system if multiple custom formats needed
  - [ ] Implement PDF export option
- [ ] Add Reporting/Analytics Features (Consider integration into dashboard vs. separate reports):
  - [ ] Daily summary view/report
  - [ ] Weekly overview view/report
  - [ ] Monthly statistics view/report

## End-of-Shift Experience
- [ ] Implement "Perla del Giorno" Modal:
  - [ ] Fetch/display random Italian aphorism after clock-out
  - [ ] Include "Close" button
- [ ] Implement Mood Check Modal:
  - [ ] Display 5 custom mood emojis (e.g., 😊 Focused, 😴 Tired, 💪 Motivated, 🤔 Stressed, 🙅‍♂️ IDK)
  - [ ] Add subtle animations to emojis
  - [ ] Log selected mood with the shift record
  - [ ] Display "Grazie!" confirmation message
- [ ] Add Shift Reflection System (Evaluate overlap/integration with Mood Check):
  - [ ] End-of-shift accomplishment prompts (if separate from mood)
  * [ ] Dynamic/engaging questions (if separate from mood)
  * [ ] Save reflection text with shift record

## Team Features
- [ ] Implement Team Visibility:
  - [ ] Display a list or grid of team members
  - [ ] Show real-time status: Logged in (green), Paused (yellow), Logged off (grey)
- [ ] Implement "Team" Tab on Main Interface:
  - [ ] Add two-people icon button (e.g., right edge)
  - [ ] Make tab expandable to show the team status list

## Gamification & Customization
- [ ] Implement First Login Setup:
    - [ ] Set default start time (e.g., 9 AM)
- [ ] Implement On-Time Login Rewards:
  - [ ] Track daily logins against the set start time
  - [ ] Implement credit earning system for punctual logins
- [ ] Implement Avatar System:
  - [ ] Provide basic customizable avatars for all users
  - [ ] Create an avatar editor interface
  - [ ] Implement unlockable cosmetics (e.g., hats, glasses) via credits
- [ ] Implement Achievement System:
  - [ ] Track focus streaks (consecutive on-time logins? Zen mode usage?)
  - [ ] Define and track productivity milestones (e.g., total hours logged)
  - [ ] Define and track weekly goals (user-settable?)
- [ ] Optional: Implement Cosmetic Shop (Lowest Priority):
  - [ ] Allow spending credits on cosmetics
  - [ ] Consider option for real money purchases

## UI/UX Enhancements
- [✅] Add loading indicators for asynchronous actions
- [ ] Improve general error handling and provide user-friendly feedback
- [ ] Add confirmation dialogs for critical actions (e.g., deleting shifts)
- [ ] Ensure UI is responsive for mobile devices
- [ ] Implement specific main UI styling details (fonts, sizes, layout as per description)
- [ ] Add main navigation (e.g., hamburger menu top-left)
- [ ] Design and integrate app logo

## Zen Mode (Enhanced Feature)
- [ ] Implement Zen Mode Core Logic:
  - [ ] 45/15 Pomodoro-style timer (or configurable intervals)
  - [ ] Optional lock-in feature during focus sessions
  - [ ] Provide break reminders
- [ ] Add Focus Statistics Tracking

## Notifications (Enhanced Feature)
- [ ] Implement Core Notification System:
  - [ ] Leverage browser notifications API
- [ ] Implement Notification Types:
  - [ ] Reminders (e.g., end of break, upcoming shift)
  - [ ] Auto-logout warning/confirmation
  - [ ] Custom user-set reminders
  - [ ] Random inspirational messages (can tie into Perla del Giorno?)

## Security
- [✅] Implement user authentication using Supabase Auth
- [✅] Create proper Row Level Security (RLS) policies:
  - [✅] INSERT operations policy
  - [✅] SELECT operations policy
  - [✅] UPDATE operations policy
  - [✅] DELETE operations policy

## Deployment & Infrastructure
- [ ] Set up CI/CD pipeline (e.g., GitHub Actions, Vercel)
- [ ] Configure production environment variables and settings
- [ ] Set up monitoring and error tracking service (e.g., Sentry)
- [ ] Implement regular data backup strategy

## Nice to Have / Future Ideas
- [ ] Voice commands for clock-in/out/pause
- [ ] Custom Zen mode time intervals
- [ ] Integration with other productivity apps (e.g., calendar, task managers)
- [ ] Multi-language support (Localization/Internationalization)
- [ ] Dark/Light theme toggle
- [ ] Weekly productivity insights email summary









this is the list of the columns that are added to the shifts table:
ALTER TABLE shifts
ADD COLUMN department VARCHAR(255), -- For "COMMESSA" (e.g., "sviluppo")
ADD COLUMN project VARCHAR(255),    -- For "SOTTO COMMESSA/CLIENTE" (e.g., "tasks# 2149/2148/2134/ 2134/2155/2156")
ADD COLUMN notes TEXT;             -- For "NOTE VARIE"