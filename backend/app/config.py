import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""

    # Secret keys
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'dev-jwt-secret-change-in-production'

    # Database
    # Supports both SQLite (local dev) and PostgreSQL (Supabase/production)
    # Set DATABASE_URL in .env to use Supabase:
    # DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///exitready.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # PostgreSQL connection pool settings (for Supabase)
    if SQLALCHEMY_DATABASE_URI.startswith('postgresql'):
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_size': 10,
            'pool_recycle': 3600,
            'pool_pre_ping': True,
        }

    # JWT Settings
    JWT_TOKEN_LOCATION = ['headers']
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_COOKIE_CSRF_PROTECT = False

    # CORS Settings
    CORS_HEADERS = 'Content-Type'
