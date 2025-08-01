# TimeYeet - Complete Installation Guide

A comprehensive guide to set up and deploy the TimeYeet time tracking application safely and securely.

## 🎯 Overview

TimeYeet is a modern time tracking application built with Next.js, TypeScript, and Supabase. This guide will walk you through the complete setup process, from local development to production deployment.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Supabase account** - Free at [supabase.com](https://supabase.com)

## 🚀 Quick Start (5 minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/timeyeet.git
cd timeyeet
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be ready (usually 1-2 minutes)
4. Go to **Settings → API** in your project dashboard
5. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)

### Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit this file to version control!

### Step 5: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `database-setup.sql`
3. Paste it into the SQL Editor
4. Click **"Run"** to execute the script
5. Verify the tables were created by going to **Table Editor**

### Step 6: Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 7: Create Your Account

1. Go to [http://localhost:3000/auth](http://localhost:3000/auth)
2. Click "Sign Up" and create your account
3. Verify your email (check spam folder)
4. Sign in and start tracking time!

## 🔧 Detailed Setup Instructions

### Database Schema Overview

The application uses three main tables:

- **`employees`** - User profiles and information
- **`projects`** - Work projects and categories
- **`shifts`** - Time tracking sessions with start/end times

### Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Authentication Required** - All routes require login
- **Environment Variables** - Sensitive data is properly secured
- **Input Validation** - All user inputs are validated

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## 🛠️ Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🚀 Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify** - Use `npm run build && npm run start`
- **Railway** - Automatic deployment from GitHub
- **DigitalOcean App Platform** - Supports Next.js out of the box

## 🔒 Security Checklist

Before deploying to production, ensure:

- [ ] Environment variables are set correctly
- [ ] Database RLS policies are active
- [ ] No sensitive data in code
- [ ] HTTPS is enabled
- [ ] Authentication is working
- [ ] User data isolation is tested

## 🐛 Troubleshooting

### Common Issues and Solutions

**"relation does not exist"**
```bash
# Solution: Run the database setup script
# Go to Supabase SQL Editor and run database-setup.sql
```

**"Authentication error"**
```bash
# Solution: Check environment variables
# Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**"RLS policy violation"**
```bash
# Solution: Ensure database setup completed
# Check that all tables and policies were created
```

**"Module not found"**
```bash
# Solution: Reinstall dependencies
npm install
```

**"Port already in use"**
```bash
# Solution: Use a different port
npm run dev -- -p 3001
```

### Getting Help

1. Check the [Issues](../../issues) page
2. Search existing discussions
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Screenshots if applicable

## 📊 Database Management

### Backup Your Data

```sql
-- Export your data (run in Supabase SQL Editor)
SELECT * FROM employees;
SELECT * FROM projects;
SELECT * FROM shifts;
```

### Reset Database (Development Only)

```sql
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
```

### Monitor Database Usage

- Check Supabase dashboard for usage metrics
- Monitor query performance
- Set up alerts for storage limits

## 🎯 Next Steps

After successful installation:

1. **Create your first project** in the dashboard
2. **Start tracking time** with the timer
3. **Explore the dashboard** features
4. **Export your data** to Excel/CSV
5. **Invite team members** (if applicable)
6. **Customize the application** for your needs

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Support

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

**Happy Time Tracking! ⏰**

Built with ❤️ using Next.js, TypeScript, and Supabase 