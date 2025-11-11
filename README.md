# 🗳️ VoteEase - Secure Digital Voting Platform

A modern, secure voting platform for educational institutions with ID card verification, email OTP, GPS location verification, and real-time voting capabilities.

---

## ✨ Features

- 🔐 **Secure Authentication** - ID card verification with barcode scanning
- 📧 **Email OTP Verification** - Secure email-based OTP system (Gmail SMTP)
- 🗳️ **Voting System** - Create and participate in voting sessions
- 📊 **Real-time Results** - Live vote counting and results visualization
- 👥 **Admin Dashboard** - Comprehensive admin panel for managing votes and users
- 🔒 **Role-Based Access Control** - Admin, moderator, and user roles
- 📍 **GPS Verification** - Optional location-based voting eligibility
- 💬 **Comments System** - Discussion and comments on voting sessions
- 📱 **Responsive Design** - Modern UI with glass morphism effects

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- A Supabase account (free tier works)
- Gmail account with App Password (for email OTP)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ease-vote-hub
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Create a new project and wait for it to be ready
4. Go to **SQL Editor** and run `START_HERE.sql`
5. Run `ADD_COMMENTS_TABLE.sql` (for comments feature)
6. Go to **Storage** → **New bucket**
   - Name: `id-cards`
   - Public: `No`
   - File size limit: `10MB`
   - Allowed MIME types: `image/jpeg, image/png, image/jpg, image/webp`

### 3. Configure Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Backend API URL
VITE_API_URL=http://localhost:3001

# Gmail SMTP Configuration (for email OTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### 4. Set Up Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification**
3. Go to **App Passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password to `.env.local`

### 5. Disable Email Confirmation (for testing)

1. In Supabase Dashboard → **Authentication** → **Settings**
2. Disable **"Confirm email"** (for development/testing)

### 6. Start the Application

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend server
npm run server

# Or run both at once:
npm run dev:full
```

Open http://localhost:5173 in your browser.

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── Layout/         # Navbar, etc.
│   │   └── ui/             # Shadcn UI components
│   ├── pages/              # Page components
│   │   ├── Index.tsx       # Home page
│   │   ├── Dashboard.tsx   # User dashboard
│   │   ├── Admin.tsx       # Admin panel
│   │   ├── VoteCasting.tsx # Vote casting page
│   │   ├── Results.tsx     # Results page
│   │   ├── Register.tsx    # Registration flow
│   │   └── CompleteProfile.tsx # Profile completion
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/                # Utilities
│   │   ├── supabase.ts     # Supabase client
│   │   └── otp.ts          # OTP utilities
│   └── hooks/              # Custom hooks
├── server.js               # Express backend server
├── START_HERE.sql          # Main database schema
├── ADD_COMMENTS_TABLE.sql  # Comments table schema
├── MAKE_USER_ADMIN.sql     # Admin setup script
└── .env.local              # Environment variables
```

## 🗄️ Database Schema

### Tables

- **users** - User profiles and authentication
- **voting_sessions** - Voting sessions
- **voting_options** - Voting options for each session
- **votes** - User votes
- **otp_verifications** - OTP storage
- **id_verification_attempts** - ID verification logs
- **voting_comments** - Comments on voting sessions
- **comment_likes** - Comment likes

### Security

- **RLS is DISABLED** for development (for easy testing)
- For production, enable RLS and create proper policies
- All tables have proper indexes for performance

## 👤 User Roles

### Regular User
- View and participate in voting sessions
- View results
- Comment on voting sessions
- Manage profile

### Admin
- All user permissions
- Create and manage voting sessions
- Manage users (block/unblock)
- View analytics and statistics
- Approve/reject ID verifications

### Moderator
- All user permissions
- Moderate voting sessions
- Limited admin access

## 🔧 Making a User Admin

Run `MAKE_USER_ADMIN.sql` in Supabase SQL Editor:

```sql
-- Replace with your email
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Or use the user ID:

```sql
UPDATE public.users
SET role = 'admin'
WHERE id = 'user-uuid-here';
```

## 📝 Usage Guide

### For Users

1. **Register**
   - Go to home page and click "Register Now"
   - Upload ID card image
   - Verify email with OTP
   - Complete profile

2. **Vote**
   - Go to Dashboard
   - Click on an active voting session
   - Select an option and cast your vote
   - View results after voting

3. **View Results**
   - Click on ended voting sessions
   - View vote counts, charts, and statistics
   - See winner (if applicable)
   - Comment and interact

### For Admins

1. **Create Voting Session**
   - Go to Admin Panel
   - Click "Create Vote"
   - Fill in session details
   - Add voting options
   - Set eligibility criteria
   - Activate the session

2. **Manage Votes**
   - View all voting sessions
   - Activate/end voting sessions
   - Delete sessions
   - View statistics

3. **Manage Users**
   - View all users
   - Block/unblock users
   - View user verification status
   - Approve ID verifications

## 🚨 Troubleshooting

### Database Issues

**"Table does not exist"**
- Run `START_HERE.sql` in Supabase SQL Editor
- Verify all tables are created

**"Storage bucket not found"**
- Create `id-cards` bucket in Supabase Storage
- Set proper permissions

### Authentication Issues

**"User profile not created"**
- Check browser console for errors
- Verify Supabase keys in `.env.local`
- Ensure RLS is disabled (for development)

**"Cannot sign in"**
- Verify email and password
- Check if user exists in `auth.users` table
- Check browser console for errors

### Email OTP Issues

**"OTP not sending"**
- Verify Gmail credentials in `.env.local`
- Check if 2-Step Verification is enabled
- Verify App Password is 16 characters
- Check backend server logs
- OTP is logged to console in development

**"Invalid login: 535-5.7.8"**
- Verify Gmail App Password is correct
- Ensure 2-Step Verification is enabled
- Generate a new App Password
- Remove any spaces from the password

### Voting Issues

**"Cannot cast vote"**
- Verify voting session is active
- Check if user has already voted (if multiple votes disabled)
- Verify GPS location (if required)
- Check browser console for errors

**"Results not showing"**
- Verify voting session is ended
- Check if votes exist in database
- Verify user has access to results

## 🔒 Security Notes

### Development
- RLS is disabled for easy testing
- Email confirmation is disabled
- Storage RLS is disabled

### Production
- Enable RLS and create proper policies
- Enable email confirmation
- Set up proper storage policies
- Use environment variables for secrets
- Enable HTTPS
- Set up proper CORS policies

## 📚 API Endpoints

### Backend Server (Express)

- `POST /api/send-otp-email` - Send OTP email
- `GET /api/test-gmail` - Test Gmail SMTP connection

### Frontend Routes

- `/` - Home page
- `/register` - Registration flow
- `/dashboard` - User dashboard
- `/admin` - Admin panel (admin only)
- `/vote/:id` - Vote casting page
- `/results/:id` - Results page
- `/complete-profile` - Profile completion

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run server       # Start backend server
npm run dev:full     # Start both frontend and backend
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Shadcn UI, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Nodemailer with Gmail SMTP
- **QR/Barcode**: ZXing, HTML5-QRCode
- **Charts**: Recharts

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🚀 Deployment

### Deploy to Vercel (Recommended)

Vercel can host both your frontend and backend API routes.

1. **Push to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite framework

3. **Set Environment Variables** in Vercel:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Supabase service role key
   - `GMAIL_USER` - Your Gmail address
   - `GMAIL_APP_PASSWORD` - 16-character Gmail App Password

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

**Note**: The backend API routes are in the `/api` directory and work as Vercel serverless functions. No separate backend deployment needed!

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📞 Support

For issues and questions:
- Check the Troubleshooting section above
- Review the SQL files for database setup
- Check browser console for errors
- Check Vercel function logs (for API routes)

## 🎯 Roadmap

- [ ] Enable RLS for production
- [ ] Add phone number verification
- [ ] Add SMS OTP option
- [ ] Add email notifications
- [ ] Add vote export functionality
- [ ] Add advanced analytics
- [ ] Add multi-language support
- [ ] Add dark/light theme toggle

---

**Built with ❤️ for secure and transparent voting**
