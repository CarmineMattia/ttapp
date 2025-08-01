# TimeYeet - Time Tracking Application

A modern, full-stack time tracking application built with Next.js, TypeScript, and Supabase. Track your work sessions, manage projects, and export your time data.

## ✨ Features

- **🕒 Real-time Timer** - Start, pause, resume, and stop work sessions
- **📊 Dashboard** - View your time tracking statistics and history
- **📁 Project Management** - Organize work by projects
- **📈 Analytics** - Track total hours, completed shifts, and averages
- **📤 Export Data** - Export your time data to Excel or CSV
- **🌙 Dark Mode** - Professional dark theme support
- **📱 Responsive Design** - Works on desktop and mobile
- **🔐 Authentication** - Secure user authentication with Supabase Auth
- **🛡️ Row Level Security** - Users can only access their own data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/timeyeet.git
cd timeyeet
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings and copy the following:
   - Project URL
   - Anon (public) key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Run the script to create all necessary tables and policies

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create Your Account

1. Go to [http://localhost:3000/auth](http://localhost:3000/auth)
2. Create a new account or sign in
3. Start tracking your time!

## 📁 Project Structure

```
timeyeet/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Main dashboard
│   │   └── test/           # Debug/test pages
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── Auth.tsx       # Authentication component
│   │   ├── Timer.tsx      # Time tracking component
│   │   └── DashboardLayout.tsx
│   ├── lib/               # Utility libraries
│   │   ├── database.ts    # Database operations
│   │   ├── supabase.ts    # Supabase client
│   │   └── auth-context.tsx
│   └── utils/             # Helper functions
├── database-setup.sql     # Database schema and setup
└── public/               # Static assets
```

## 🗄️ Database Schema

The application uses three main tables:

- **employees** - User profiles and information
- **projects** - Work projects and categories  
- **shifts** - Time tracking sessions with start/end times

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |

### Database Setup

The `database-setup.sql` file includes:
- Table creation with proper relationships
- Row Level Security (RLS) policies
- Sample projects
- Performance indexes

## 🎯 Usage

### Starting a Timer

1. Go to the dashboard
2. Click "Start Timer"
3. Select a project
4. Add optional notes
5. Click "Start Shift"

### Managing Active Sessions

- **Pause** - Temporarily stop the timer
- **Resume** - Continue a paused session
- **Stop** - End the session and save

### Viewing Your Data

- **Dashboard** - Overview of your time tracking
- **Recent Shifts** - Quick view of latest sessions
- **All Shifts Table** - Complete history with filtering
- **Export** - Download data as Excel or CSV

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features

1. Create new components in `src/components/`
2. Add database operations in `src/lib/database.ts`
3. Update types as needed
4. Test thoroughly before committing

## 🔒 Security

- **Row Level Security (RLS)** - Users can only access their own data
- **Authentication Required** - All routes require login
- **Environment Variables** - Sensitive data is properly secured
- **Input Validation** - All user inputs are validated

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**"relation does not exist"**
- Make sure you've run the database setup script
- Check that your Supabase connection is working

**"Authentication error"**
- Verify your environment variables are correct
- Check that you're logged in

**"RLS policy violation"**
- Ensure the database setup script ran completely
- Check that you're using the correct user ID

### Getting Help

- Check the [Issues](../../issues) page
- Create a new issue with detailed information
- Include error messages and steps to reproduce

## 📊 Roadmap

- [ ] Team management features
- [ ] Advanced reporting and analytics
- [ ] Mobile app
- [ ] API for third-party integrations
- [ ] Time tracking reminders
- [ ] Calendar integration

---

Built with ❤️ using Next.js, TypeScript, and Supabase
