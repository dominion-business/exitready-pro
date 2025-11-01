# Supabase Authentication Setup Guide

## Overview
This guide will help you set up Google OAuth (and other providers) for your ExitReady application using Supabase Auth.

## What's Been Installed

✅ `@supabase/supabase-js` - Supabase JavaScript client
✅ Supabase client configuration (`frontend/src/lib/supabase.js`)
✅ Auth context provider (`frontend/src/contexts/AuthContext.jsx`)
✅ OAuth callback page (`frontend/src/pages/AuthCallback.jsx`)

## Step 1: Enable Google OAuth in Supabase

### 1.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: ExitReady
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: ExitReady Production
   - Authorized JavaScript origins: `https://nxrszkxayqgoyxohngfz.supabase.co`
   - Authorized redirect URIs: `https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback`
7. Click **Create** and copy your:
   - Client ID
   - Client Secret

### 1.2 Configure Google Provider in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/nxrszkxayqgoyxohngfz
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list
4. Toggle it **ON**
5. Paste your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
6. Click **Save**

### 1.3 Add Site URL (Important!)

1. In Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000` (fallback)
4. For production, add your production domain

## Step 2: Update Your Application

### 2.1 Wrap App with AuthProvider

Edit `frontend/src/App.js`:

```jsx
import { AuthProvider } from './contexts/AuthContext'
import AuthCallback from './pages/AuthCallback'
// ... other imports

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Add auth callback route */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Your existing routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* ... */}
        </Routes>
      </Router>
    </AuthProvider>
  )
}
```

### 2.2 Update Login Page

Add Google Sign-In button to your login page:

```jsx
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const { signIn, signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error.message)
    }
  }

  return (
    <div>
      {/* Your existing email/password form */}

      {/* Add Google Sign-In Button */}
      <button onClick={handleGoogleSignIn}>
        Sign in with Google
      </button>
    </div>
  )
}
```

## Step 3: Enable Other OAuth Providers (Optional)

### GitHub

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App:
   - Homepage URL: `https://nxrszkxayqgoyxohngfz.supabase.co`
   - Callback URL: `https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret
4. Add to Supabase: Authentication > Providers > GitHub

### Microsoft/Azure

1. Go to Azure Portal > App registrations
2. Register new application
3. Configure redirect URI: `https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback`
4. Add to Supabase: Authentication > Providers > Azure

### Apple

1. Go to Apple Developer > Certificates, Identifiers & Profiles
2. Create App ID and Services ID
3. Configure Sign In with Apple
4. Add to Supabase: Authentication > Providers > Apple

## Available Auth Methods

Your AuthContext provides these methods:

```javascript
const {
  user,              // Current user object
  session,           // Current session
  loading,           // Auth loading state
  signIn,            // Email/password sign in
  signUp,            // Email/password sign up
  signOut,           // Sign out
  signInWithGoogle,  // Google OAuth
  signInWithGithub,  // GitHub OAuth
  resetPassword,     // Send password reset email
  updatePassword,    // Update user password
} = useAuth()
```

## Using Supabase Database (Alternative to Flask Backend)

If you want to use Supabase database directly instead of Flask:

### Option A: Hybrid (Recommended)
- Use Supabase Auth for authentication
- Keep Flask backend for business logic
- Use Supabase JWT tokens to authenticate Flask API calls

### Option B: Full Supabase
- Use Supabase Auth for authentication
- Use Supabase Database for data storage
- Use Row Level Security (RLS) for data access control
- Eliminate Flask backend entirely

## Security: Row Level Security (RLS)

If using Supabase database directly, enable RLS:

```sql
-- Enable RLS on your tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own data
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);
```

## Hybrid Architecture (Flask + Supabase Auth)

To use Supabase auth with your Flask backend:

1. **Frontend**: Use Supabase for authentication
2. **Get JWT token** from Supabase session
3. **Send token** to Flask API in Authorization header
4. **Flask**: Verify Supabase JWT token

Example Flask verification:

```python
import jwt
from functools import wraps
from flask import request, jsonify

SUPABASE_JWT_SECRET = 'your-supabase-jwt-secret'

def verify_supabase_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                audience='authenticated'
            )
            request.user_id = payload['sub']
            return f(*args, **kwargs)
        except:
            return jsonify({'error': 'Invalid token'}), 401

    return decorated
```

## Testing

1. Start your frontend: `npm start`
2. Click "Sign in with Google"
3. Authorize the app
4. You'll be redirected back to your app
5. Check console for user object

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure redirect URI in Google Console matches exactly: `https://nxrszkxayqgoyxohngfz.supabase.co/auth/v1/callback`
- No trailing slashes

### OAuth Not Working
- Check Site URL in Supabase dashboard
- Verify redirect URLs are added
- Clear browser cache and cookies
- Check browser console for errors

### Session Not Persisting
- Check that `persistSession: true` in supabase client config
- Verify localStorage is not blocked
- Check for third-party cookie restrictions

## Next Steps

1. Enable Google OAuth in Supabase dashboard
2. Update your login page with Google sign-in button
3. Test authentication flow
4. Add other providers as needed
5. Implement protected routes
6. Add user profile management

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [GitHub OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)
