"""
Input validation utilities for API endpoints
"""
from flask import jsonify

def validate_positive_number(value, field_name, allow_zero=True):
    """
    Validate that a value is a positive number
    Returns (is_valid, error_response)
    """
    try:
        num = float(value)
        if allow_zero and num < 0:
            return False, jsonify({'error': f'{field_name} must be non-negative'}), 400
        elif not allow_zero and num <= 0:
            return False, jsonify({'error': f'{field_name} must be positive'}), 400
        return True, num
    except (ValueError, TypeError):
        return False, jsonify({'error': f'{field_name} must be a valid number'}), 400


def validate_percentage(value, field_name):
    """
    Validate that a value is a valid percentage (0-1)
    Returns (is_valid, error_response)
    """
    try:
        num = float(value)
        if num < 0 or num > 1:
            return False, jsonify({'error': f'{field_name} must be between 0 and 1'}), 400
        return True, num
    except (ValueError, TypeError):
        return False, jsonify({'error': f'{field_name} must be a valid number'}), 400


def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present in the data
    Returns (is_valid, error_response)
    """
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        return False, jsonify({
            'error': f'Missing required fields: {", ".join(missing_fields)}'
        }), 400
    return True, None


def validate_email(email):
    """
    Basic email validation
    Returns (is_valid, error_response)
    """
    if not email or '@' not in email or '.' not in email:
        return False, jsonify({'error': 'Invalid email format'}), 400
    return True, email.lower().strip()


def validate_string_length(value, field_name, min_length=0, max_length=None):
    """
    Validate string length
    Returns (is_valid, error_response)
    """
    if not isinstance(value, str):
        return False, jsonify({'error': f'{field_name} must be a string'}), 400

    if len(value) < min_length:
        return False, jsonify({'error': f'{field_name} must be at least {min_length} characters'}), 400

    if max_length and len(value) > max_length:
        return False, jsonify({'error': f'{field_name} must be at most {max_length} characters'}), 400

    return True, value.strip()


def validate_choice(value, field_name, choices):
    """
    Validate that value is one of allowed choices
    Returns (is_valid, error_response)
    """
    if value not in choices:
        return False, jsonify({
            'error': f'{field_name} must be one of: {", ".join(map(str, choices))}'
        }), 400
    return True, value
