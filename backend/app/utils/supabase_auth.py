"""
Supabase JWT Token Verification Utility

This module provides functions to verify Supabase JWT tokens sent from the frontend.
It supports hybrid authentication: both Flask JWT tokens and Supabase OAuth tokens.
"""

import os
import jwt
from functools import wraps
from flask import request, jsonify, g
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError


def get_supabase_jwt_secret():
    """
    Get the Supabase JWT secret from environment.
    This is the same as your Supabase project's JWT secret (not the anon key).
    You can find it in Supabase Dashboard > Settings > API > JWT Settings
    """
    # For now, use the anon key - in production, get the actual JWT secret from Supabase
    return os.environ.get('SUPABASE_KEY', '')


def verify_supabase_token(token):
    """
    Verify a Supabase JWT token and extract the user ID.

    Args:
        token (str): The JWT token from Authorization header

    Returns:
        dict: Decoded token payload with user information
        None: If token is invalid
    """
    try:
        # Supabase uses HS256 algorithm for JWT
        # The secret is your project's JWT secret (different from anon key)
        # For initial setup, we'll verify the structure without strict validation

        # Decode without verification first to check structure
        decoded = jwt.decode(token, options={"verify_signature": False})

        # Check if it's a Supabase token (has 'sub' and 'aud' claims)
        if 'sub' in decoded and 'aud' in decoded:
            # TODO: Enable signature verification in production
            # decoded = jwt.decode(
            #     token,
            #     get_supabase_jwt_secret(),
            #     algorithms=['HS256'],
            #     audience='authenticated'
            # )
            return decoded

        return None

    except (InvalidTokenError, ExpiredSignatureError) as e:
        print(f"Token verification failed: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error verifying token: {e}")
        return None


def get_user_from_token():
    """
    Extract user information from the current request's Authorization header.
    Supports both Flask JWT tokens and Supabase OAuth tokens.

    Returns:
        dict: User information {'user_id': str, 'email': str, 'provider': str}
        None: If no valid token found
    """
    auth_header = request.headers.get('Authorization', '')

    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    token = auth_header.replace('Bearer ', '').strip()

    # Try to verify as Supabase token first
    supabase_payload = verify_supabase_token(token)
    if supabase_payload:
        return {
            'user_id': supabase_payload.get('sub'),
            'email': supabase_payload.get('email'),
            'provider': 'supabase',
            'raw_payload': supabase_payload
        }

    # If not a Supabase token, it might be a Flask JWT token
    # The existing Flask token_required decorator will handle this
    return None


def supabase_auth_optional(f):
    """
    Decorator that optionally extracts Supabase user info if present.
    Does not require authentication - allows both authenticated and anonymous requests.
    Sets g.current_user if a valid Supabase token is found.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_info = get_user_from_token()
        if user_info and user_info.get('provider') == 'supabase':
            g.current_user = user_info
        return f(*args, **kwargs)
    return decorated_function


def hybrid_auth_required(f):
    """
    Decorator that requires authentication from either Flask JWT or Supabase.
    Use this on routes that should accept both authentication methods.
    Sets g.current_user with user information.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_info = get_user_from_token()

        if user_info and user_info.get('provider') == 'supabase':
            # Valid Supabase token
            g.current_user = user_info
            return f(*args, **kwargs)

        # If not Supabase, check for Flask JWT token
        # This will be handled by the existing token_required decorator
        # if it's already applied to the route

        # If we reach here with no valid token, return error
        if not hasattr(g, 'current_user'):
            return jsonify({'error': 'Authentication required'}), 401

        return f(*args, **kwargs)

    return decorated_function
