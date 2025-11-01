# Connecting ExitReady to Supabase

This guide will help you migrate your ExitReady application from SQLite to Supabase PostgreSQL.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Python 3.8+ installed
- Your existing ExitReady application

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: exitready-pro (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize (2-3 minutes)

## Step 2: Get Your Supabase Connection Details

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **Database** section
3. Scroll down to **Connection String** section
4. Copy the **Connection string** (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
5. Replace `[YOUR-PASSWORD]` with the password you set in Step 1

### Optional: Get API Keys (for direct Supabase API usage)

1. Go to **Project Settings** > **API**
2. Copy your:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 3: Install PostgreSQL Driver

Add the PostgreSQL adapter to your backend:

```bash
cd backend
pip install psycopg2-binary
```

Or add to `requirements.txt`:
```
psycopg2-binary==2.9.9
```

Then run:
```bash
pip install -r requirements.txt
```

## Step 4: Configure Environment Variables

1. In the `backend` directory, create a `.env` file (if it doesn't exist):

```bash
cd backend
copy .env.example .env    # Windows
# or
cp .env.example .env      # Mac/Linux
```

2. Edit your `.env` file and update these values:

```env
# Flask Configuration
SECRET_KEY=your-random-secret-key-here
JWT_SECRET_KEY=your-random-jwt-secret-key-here
FLASK_ENV=development

# Supabase PostgreSQL Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Optional: Direct Supabase API (if needed)
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_KEY=your-supabase-anon-key

# CORS Settings
CORS_ORIGINS=http://localhost:3000
```

**Important**: Replace the placeholders:
- `[YOUR-PASSWORD]` - Your database password from Step 1
- `[YOUR-PROJECT-REF]` - Found in your Supabase project URL
- `your-random-secret-key-here` - Generate a random string (e.g., run `python -c "import secrets; print(secrets.token_hex(32))"`)

## Step 5: Initialize Database Schema

The application will automatically create tables on first run, but you can also use Flask-Migrate for better control:

```bash
cd backend

# Initialize migrations (if not already done)
flask db init

# Create a migration
flask db migrate -m "Initial migration to Supabase"

# Apply migrations
flask db upgrade
```

## Step 6: Migrate Existing Data (Optional)

If you have existing data in SQLite that you want to migrate:

### Option A: Export and Import via SQL

```bash
# Export from SQLite
sqlite3 instance/exitready.db .dump > data_export.sql

# Manually import to Supabase using the SQL Editor in Supabase Dashboard
# (You'll need to adapt the SQLite syntax to PostgreSQL)
```

### Option B: Python Script

Create a migration script (`migrate_data.py`):

```python
import sqlite3
from app import create_app, db
from app.models.business import Business
from app.models.assessment import Assessment
# Import other models...

# Create Flask app context
app = create_app()

with app.app_context():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect('instance/exitready.db')
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()

    # Migrate businesses
    cursor.execute('SELECT * FROM business')
    for row in cursor.fetchall():
        business = Business(
            id=row['id'],
            user_id=row['user_id'],
            name=row['name'],
            # ... map all fields
        )
        db.session.add(business)

    # Commit all changes
    db.session.commit()
    print("Migration completed!")
```

Run it:
```bash
python migrate_data.py
```

## Step 7: Test the Connection

1. Stop your current backend server (Ctrl+C)
2. Start it again:

```bash
cd backend
python run.py
```

3. Check for successful connection in the logs:
   - You should see Flask start without database errors
   - Try logging in and creating/viewing data

4. Test the health endpoint:
```bash
curl http://localhost:5000/health
```

## Step 8: Verify in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **Table Editor** in the sidebar
3. You should see your tables listed (users, business, assessment, etc.)
4. Click on any table to view the data

## Troubleshooting

### Connection Refused / Timeout

- Check your Supabase project is active (not paused)
- Verify the connection string is correct
- Check your firewall/network settings

### SSL Certificate Error

If you get SSL errors, modify your DATABASE_URL:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

### Authentication Failed

- Double-check your database password
- Ensure there are no special characters causing issues (URL-encode if needed)
- Reset your database password in Supabase if necessary

### Tables Not Created

Run migrations manually:
```bash
cd backend
flask db upgrade
```

Or check the Python console for errors when starting the app.

## Production Deployment

When deploying to production:

1. Update `FLASK_ENV=production` in your `.env`
2. Use strong, unique secret keys
3. Update `CORS_ORIGINS` to include your production domain
4. Consider using environment variables in your hosting platform (Vercel, Heroku, etc.)
5. Enable Row Level Security (RLS) in Supabase for additional security

## Security Best Practices

1. **Never commit** `.env` files to git (already in `.gitignore`)
2. **Rotate secrets** regularly
3. **Use service_role key** only in backend, never in frontend
4. **Enable RLS** in Supabase for table-level security
5. **Backup your database** regularly (Supabase has automatic backups)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Flask-SQLAlchemy + PostgreSQL](https://flask-sqlalchemy.palletsprojects.com/)
- [Flask-Migrate Documentation](https://flask-migrate.readthedocs.io/)

## Need Help?

If you encounter issues:
1. Check the backend logs for specific error messages
2. Verify your Supabase project is active
3. Test the connection string using a PostgreSQL client
4. Consult the Supabase community forums
