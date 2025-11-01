# Supabase OAuth Quick Start Guide

## What's Already Done

✅ Supabase client installed and configured
✅ Authentication context with OAuth hooks created
✅ Login page updated with Google and GitHub buttons
✅ OAuth callback route added
✅ API client updated to support Supabase tokens
✅ Environment variables configured

## What You Need to Do

### Step 1: Enable Google OAuth (5 minutes)

#### A. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to: **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **ExitReady Pro**
   - User support email: your email
   - Developer contact: your email
   - Click **Save and Continue** through the remaining screens
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **ExitReady Production**
   - Authorized JavaScript origins:
     ```
     https://nxrszkxayqgoyxohngfz.supabase.co
     ```
   - Authorized redirect URIs:
     ```
     https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback
     ```
7. Click **Create**
8. **Copy your Client ID and Client Secret** (you'll need these in the next step)

#### B. Configure Google in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/nxrszkxayqgoyxohngfz)
2. Navigate to: **Authentication** > **Providers**
3. Find **Google** in the list
4. Toggle it **ON**
5. Paste your credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
6. Click **Save**

#### C. Configure Redirect URLs

1. In Supabase dashboard, go to: **Authentication** > **URL Configuration**
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```
4. Click **Save**

### Step 2: Test Google OAuth

1. Make sure your frontend is running:
   ```bash
   cd frontend
   npm start
   ```

2. Go to `http://localhost:3000/login`

3. Click **Continue with Google**

4. You should be redirected to Google's sign-in page

5. After authorizing, you'll be redirected back to your dashboard

### Step 3: Enable GitHub OAuth (Optional, 5 minutes)

#### A. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the form:
   - Application name: **ExitReady Pro**
   - Homepage URL: `https://nxrszkxayqgoyxohngfz.supabase.co`
   - Authorization callback URL: `https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Click **Generate a new client secret**
6. **Copy your Client ID and Client Secret**

#### B. Configure GitHub in Supabase

1. In Supabase dashboard: **Authentication** > **Providers**
2. Find **GitHub** in the list
3. Toggle it **ON**
4. Paste your credentials:
   - **Client ID**: (from GitHub)
   - **Client Secret**: (from GitHub)
5. Click **Save**

### Step 4: Production Setup (When Ready)

When deploying to production, update:

1. **Google Cloud Console**:
   - Add production domain to Authorized JavaScript origins
   - Add production callback to Authorized redirect URIs

2. **GitHub OAuth App**:
   - Update Homepage URL
   - Update Authorization callback URL

3. **Supabase Dashboard**:
   - Update Site URL to production domain
   - Add production redirect URLs

4. **Frontend `.env.production`**:
   ```
   REACT_APP_SUPABASE_URL=https://nxrszkxayqgoyxohngfz.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   REACT_APP_API_URL=https://your-production-api.com
   ```

## Troubleshooting

### "redirect_uri_mismatch" Error
- Verify redirect URI in Google Console exactly matches:
  `https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback`
- No trailing slashes
- Use https, not http

### OAuth Popup Closes Immediately
- Check browser console for errors
- Verify Site URL is set correctly in Supabase
- Make sure redirect URLs are added

### Still Using Email/Password?
- Both work! OAuth is an additional option
- Users can sign in with Google, GitHub, or email/password
- All authentication methods work together seamlessly

## What's Next?

Once OAuth is working, you can:
- Add more providers (Microsoft, Apple, etc.) - see SUPABASE_AUTH_SETUP.md
- Customize the OAuth button styles
- Add profile management features
- Migrate from SQLite to Supabase PostgreSQL database
- Use Supabase Realtime for live updates
- Use Supabase Storage for file uploads

## Need More Help?

- Full documentation: [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md)
- Supabase Auth docs: https://supabase.com/docs/guides/auth
- Google OAuth guide: https://supabase.com/docs/guides/auth/social-login/auth-google
