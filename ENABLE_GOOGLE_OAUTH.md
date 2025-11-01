# Enable Google OAuth - Step-by-Step Guide

Your frontend is already configured with Google OAuth buttons and handlers. You just need to configure the OAuth credentials.

## Step 1: Create Google OAuth Credentials (5 minutes)

### A. Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one:
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "ExitReady Pro" (or whatever you prefer)
   - Click "Create"

### B. Configure OAuth Consent Screen

1. In the left sidebar, go to: **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Click **Create**
4. Fill in the required fields:
   - **App name**: ExitReady Pro
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On the "Scopes" page, click **Save and Continue** (no changes needed)
7. On the "Test users" page, click **Save and Continue** (no changes needed)
8. Review and click **Back to Dashboard**

### C. Create OAuth 2.0 Client ID

1. In the left sidebar, go to: **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application** as the application type
4. Name it: **ExitReady Production**
5. Under **Authorized JavaScript origins**, click **Add URI** and add:
   ```
   https://nxrszkxayqgoyxohngfz.supabase.co
   ```
6. Under **Authorized redirect URIs**, click **Add URI** and add:
   ```
   https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback
   ```
7. Click **Create**
8. A popup will show your credentials:
   - **Copy the Client ID** (save it somewhere)
   - **Copy the Client Secret** (save it somewhere)
   - Click **OK**

## Step 2: Configure Google OAuth in Supabase (2 minutes)

### A. Go to Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/nxrszkxayqgoyxohngfz)
2. Navigate to: **Authentication** > **Providers**

### B. Enable Google Provider

1. Scroll down and find **Google** in the providers list
2. Toggle it **ON** (switch to enabled)
3. Paste your credentials from Step 1:
   - **Client ID (for OAuth)**: [Paste your Google Client ID]
   - **Client Secret (for OAuth)**: [Paste your Google Client Secret]
4. Click **Save**

### C. Configure Redirect URLs

1. Still in the Supabase dashboard, go to: **Authentication** > **URL Configuration**
2. Set **Site URL** to:
   ```
   http://localhost:3000
   ```
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```
4. Click **Save**

## Step 3: Test Google OAuth (1 minute)

1. Make sure your frontend is running:
   ```bash
   cd frontend
   npm start
   ```

2. Go to `http://localhost:3000/login`

3. You should see the **"Continue with Google"** button

4. Click it and sign in with your Google account

5. After authorization, you'll be redirected back to your app dashboard

## What's Already Done

Your frontend already has:
- ✅ Supabase client configured
- ✅ Google OAuth button in LoginForm
- ✅ OAuth callback handler at `/auth/callback`
- ✅ Auth context with `signInWithGoogle()` function
- ✅ API client that supports Supabase tokens
- ✅ Backend hybrid auth (supports both Flask JWT and Supabase tokens)

## Credentials You'll Need

Save these when you create them in Google Cloud Console:

```
Google Client ID: [You'll get this in Step 1]
Google Client Secret: [You'll get this in Step 1]
```

Then paste them into Supabase in Step 2.

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the redirect URI in Google Console is **exactly**:
  `https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback`
- No trailing slash
- Use `https` not `http`

### OAuth Popup Closes Immediately
- Check that Site URL is set to `http://localhost:3000` in Supabase
- Check that redirect URLs include `http://localhost:3000/auth/callback`

### "Invalid OAuth Configuration"
- Make sure Google provider is toggled ON in Supabase
- Verify Client ID and Secret are copied correctly (no extra spaces)

## Production Setup (Future)

When you deploy to production, update:

1. **Google Cloud Console**:
   - Add your production domain to Authorized JavaScript origins
   - Add production callback URL to Authorized redirect URIs

2. **Supabase**:
   - Update Site URL to your production domain
   - Add production redirect URLs

## That's It!

Once you complete Steps 1 and 2, your Google OAuth will be live. Users can choose to:
- Sign in with email/password (existing Flask auth)
- Sign in with Google (new Supabase OAuth)

Both methods work seamlessly together!
